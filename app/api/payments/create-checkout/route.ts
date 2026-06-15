import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, formatAmountForStripe } from "@/lib/stripe/client";
import { PaymentService } from "@/lib/services/payment";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await req.json();
    const { projectId, moduleAssignments, totalAmount } = body;

    // 1. Auth Check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Create Stripe Customer (or get existing)
    // In a production app, you'd store stripe_customer_id in the profiles table
    // For now, we'll create a new customer or search by email
    let customerId: string | undefined;
    const email = user.email;

    if (email) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: email,
          name: user.user_metadata?.display_name || user.user_metadata?.full_name,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;
      }
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "GitLance Project Workspace",
              description: `Initial funding for project workspace`,
              metadata: {
                projectId: projectId,
              },
            },
            unit_amount: formatAmountForStripe(totalAmount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/workspace/create/${projectId}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/workspace/create/${projectId}?payment_canceled=true`,
      metadata: {
        projectId: projectId,
        userId: user.id,
        type: "initial_payment",
      },
    });

    // 4. Create Payment Record in Database
    // We use the payment_intent as the ID, but it might not be available yet in session
    // So we'll store the session ID and update later via webhook
    if (session && session.payment_intent) {
        // If payment intent is immediately available (rare for checkout)
    }

    // We'll Create a pending payment record linked to this session
    // This allows us to track it even if the user drops off
    // Note: We don't have payment_intent_id yet usually, gets created after confirmation
    
    // For tracking, we'll rely on the webhook to create the final authoritative record
    // or update this one if we store session_id.
    // Let's store session_id in the payments table for now (requires schema tweak or using metadata)
    // Actually, let's just return the session ID. 
    // The webhook will handle the "succeeded" event and create/update the payment record.
    // BUT, for better UX, we might want a record to verify against immediately.
    
    // Let's create a record with the checkout session ID as the "stripe_payment_intent_id" temporarily
    // or better, add a column for session_id. 
    // For now, we will store metadata.
    
    // Wait, the PaymentService.createInitialPayment requires stripePaymentIntentId.
    // Let's modify it to accept session ID or handle it. 
    // Actually it's cleaner to wait for webhook or use the session ID in a separate field.
    // For this implementation, we will pass the session.id as the identifier for now, 
    // knowing that the comprehensive solution would update it to payment_intent_id later.
    
    await PaymentService.createInitialPayment({
        projectId,
        userId: user.id,
        amount: totalAmount,
        stripePaymentIntentId: session.id, // Storing session ID here temporarily
        metadata: {
            checkout_session_id: session.id,
            module_assignments: moduleAssignments
        }
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
