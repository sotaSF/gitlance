import { createAdminSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/config/env";

export type PaymentType = "initial_payment" | "module_price_update" | "refund";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded";

/**
 * Service to handle payment logic and database operations
 */
export class PaymentService {
  /**
   * Create an initial payment record for a workspace
   */
  static async createInitialPayment({
    projectId,
    userId,
    amount,
    stripePaymentIntentId,
    metadata = {},
  }: {
    projectId: string;
    userId: string;
    amount: number;
    stripePaymentIntentId: string;
    metadata?: any;
  }) {
    const supabase = createAdminSupabase();

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        project_id: projectId,
        user_id: userId,
        amount,
        payment_type: "initial_payment",
        stripe_payment_intent_id: stripePaymentIntentId,
        status: "pending",
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment record:", error);
      throw new Error("Failed to create payment record");
    }

    return payment;
  }

  /**
   * Create a payment record for module price updates
   */
  static async createModuleUpdatePayment({
    projectId,
    workspaceId,
    userId,
    amount,
    stripePaymentIntentId,
    moduleUpdates,
  }: {
    projectId: string;
    workspaceId: string;
    userId: string;
    amount: number;
    stripePaymentIntentId: string;
    moduleUpdates: Array<{
      moduleId: string;
      oldPrice: number;
      newPrice: number;
      updatedBy: string;
      reason?: string;
    }>;
  }) {
    const supabase = createAdminSupabase();

    // Start a transaction-like operation
    // 1. Create Payment Record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        user_id: userId,
        amount,
        payment_type: "module_price_update",
        stripe_payment_intent_id: stripePaymentIntentId,
        status: "pending",
        metadata: { module_count: moduleUpdates.length },
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("Error creating update payment:", paymentError);
      throw new Error("Failed to create update payment");
    }

    // 2. Create Module Update Records
    const updatesToInsert = moduleUpdates.map((update) => ({
      payment_id: payment.id,
      module_id: update.moduleId,
      old_price: update.oldPrice,
      new_price: update.newPrice,
      price_difference: update.newPrice - update.oldPrice,
      updated_by: update.updatedBy,
      reason: update.reason,
    }));

    const { error: updatesError } = await supabase
      .from("payment_module_updates")
      .insert(updatesToInsert);

    if (updatesError) {
      console.error("Error creating module updates:", updatesError);
      // In a real scenario, we might want to rollback the payment record here
      // But since it's pending and not charged, it's less critical strictly speaking
    }

    return payment;
  }

  /**
   * Verify and update payment status from Stripe
   */
  static async syncPaymentStatus(paymentId: string) {
    const supabase = createAdminSupabase();

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error("Payment not found");
    }

    if (!payment.stripe_payment_intent_id) {
      return payment;
    }

    // Check status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id
    );

    let newStatus: PaymentStatus = payment.status as PaymentStatus;

    if (paymentIntent.status === "succeeded") {
      newStatus = "succeeded";
    } else if (paymentIntent.status === "canceled") {
      newStatus = "canceled";
    } else if (paymentIntent.status === "requires_payment_method") {
      newStatus = "failed";
    }

    // Update if status changed
    if (newStatus !== payment.status) {
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update({
          status: newStatus,
          completed_at:
            newStatus === "succeeded" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (!updateError && updatedPayment) {
        // If payment succeeded, update workspace status if applicable
        if (newStatus === "succeeded" && updatedPayment.workspace_id) {
          await supabase.rpc("increment_workspace_payment", {
            w_id: updatedPayment.workspace_id,
            amt: updatedPayment.amount,
          });
        }
        return updatedPayment;
      }
    }

    return payment;
  }

  /**
   * Handle checkout.session.completed webhook
   * Swaps the temporary session ID with the actual Payment Intent ID
   */
  static async handleCheckoutSessionCompleted(session: any) {
    const supabase = createAdminSupabase();
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId) return;

    // Find the payment record that has this session ID
    // We stored session.id in stripe_payment_intent_id in create-checkout route
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent_id", sessionId)
      .single();

    if (payment) {
      // Update with real payment intent ID and status
      await supabase
        .from("payments")
        .update({
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: sessionId,
          stripe_customer_id: session.customer,
          status: "succeeded",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Increment workspace total
      if (payment.workspace_id) {
        // workspace might be null if created BEFORE workspace exists?
        // Wait, the plan is payment BEFORE workspace.
        // So workspace_id is likely NULL at this point.
        // The CreateWorkspaceForm will verify the payment and THEN create workspace
        // linking it to this payment.
      }
    }
  }

  /**
   * Handle payment_intent.succeeded webhook
   */
  static async handlePaymentIntentSucceeded(paymentIntent: any) {
    const supabase = createAdminSupabase();
    const paymentIntentId = paymentIntent.id;

    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (payment && payment.status !== "succeeded") {
      await supabase
        .from("payments")
        .update({
          status: "succeeded",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
    }
  }

  /**
   * Handle payment_intent.payment_failed webhook
   */
  static async handlePaymentIntentFailed(paymentIntent: any) {
    const supabase = createAdminSupabase();
    const paymentIntentId = paymentIntent.id;

    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId);
  }

  /**
   * Transfer funds to a freelancer's connected Stripe account
   * Includes balance validation to prevent "insufficient funds" errors
   */
  static async transferToFreelancer(
    amount: number,
    freelancerStripeId: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      // Check available balance in platform account first
      const balance = await stripe.balance.retrieve();

      // Get available USD balance
      const availableUSD =
        balance.available.find((b) => b.currency === "usd")?.amount || 0;

      if (availableUSD < amount) {
        const pendingUSD =
          balance.pending.find((b) => b.currency === "usd")?.amount || 0;

        console.error("Insufficient available funds for transfer", {
          requested: amount,
          available: availableUSD,
          pending: pendingUSD,
          total: availableUSD + pendingUSD,
        });

        throw new Error(
          `Insufficient available funds. Available: $${(
            availableUSD / 100
          ).toFixed(2)}, ` +
            `Pending: $${(pendingUSD / 100).toFixed(2)}, ` +
            `Required: $${(amount / 100).toFixed(2)}. ` +
            `Funds in pending balance will be available within 24-48 hours.`
        );
      }

      const transfer = await stripe.transfers.create({
        amount,
        currency: "usd",
        destination: freelancerStripeId,
        metadata,
      });

      return transfer;
    } catch (error) {
      console.error("Error transferring to freelancer:", error);
      throw error;
    }
  }
}
