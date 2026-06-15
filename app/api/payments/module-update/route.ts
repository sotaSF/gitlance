import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, formatAmountForStripe } from "@/lib/stripe/client";
import { PaymentService } from "@/lib/services/payment";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await req.json();
    const { projectId, workspaceId, updates } = body;
    // updates: [{ moduleId, oldPrice, newPrice, reason }]

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!updates || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Calculate total difference
    let totalDifference = 0;
    const validUpdates = [];

    for (const update of updates) {
      const diff = update.newPrice - update.oldPrice;
      if (diff === 0) continue;
      
      totalDifference += diff;
      validUpdates.push({
          ...update,
          updatedBy: user.id
      });
    }

    if (totalDifference <= 0) {
      // Handle refunds or no-op
      // For now we only handle payments (positive difference)
      return NextResponse.json({ 
          message: "No payment required", 
          totalDifference 
      });
    }

    // Create Checkout Session for the difference
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Project Module Price Update",
              description: `Additional funding for ${validUpdates.length} module updates`,
              metadata: {
                projectId: projectId,
                workspaceId: workspaceId
              },
            },
            unit_amount: formatAmountForStripe(totalDifference),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/workspace/${workspaceId}/settings?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/workspace/${workspaceId}/settings?payment_canceled=true`,
      metadata: {
        projectId,
        workspaceId,
        userId: user.id,
        type: "module_price_update",
      },
    });

    // Create pending payment record
    await PaymentService.createModuleUpdatePayment({
        projectId,
        workspaceId,
        userId: user.id,
        amount: totalDifference,
        stripePaymentIntentId: session.id, // Using session ID temporarily
        moduleUpdates: validUpdates
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating update checkout:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
