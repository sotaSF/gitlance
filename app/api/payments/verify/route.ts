import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();

    // 1. Retrieve the checkout session from Stripe to get the real status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2. Find the payment record in our DB
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .or(`stripe_payment_intent_id.eq.${sessionId},stripe_checkout_session_id.eq.${sessionId}`)
      .single();

    // 3. If payment is paid, update our DB record
    if (session.payment_status === "paid") {
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

      if (payment) {
        // Update the record with the real payment intent ID and mark as succeeded
        await supabase
          .from("payments")
          .update({
            stripe_payment_intent_id: paymentIntentId || payment.stripe_payment_intent_id,
            stripe_checkout_session_id: sessionId,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            status: "succeeded",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        return NextResponse.json({
          status: "succeeded",
          paymentId: payment.id,
          amount: payment.amount,
        });
      }

      // Payment exists in Stripe but not in our DB (webhook may not have fired)
      return NextResponse.json({ status: "processing_payment" });
    }

    // 4. Payment not yet paid
    if (payment) {
      return NextResponse.json({
        status: payment.status,
        paymentId: payment.id,
      });
    }

    return NextResponse.json({ status: "not_found" });

  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

