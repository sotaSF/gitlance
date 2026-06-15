import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // 1. Auth Check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get User Profile to check existing stripe_connect_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let accountId = profile.stripe_connect_id;

    // 3. Create Stripe Connect Account if not exists
    if (!accountId) {
      console.log(`[Stripe] Creating fresh Standard account for user ${user.id}...`);
      const account = await stripe.accounts.create({
        type: "standard",
        email: user.email,
        // No forced country - let the user choose on the Stripe onboarding page
      });

      accountId = account.id;

      // 4. Save account ID to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_connect_id: accountId })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile with Stripe ID:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 },
        );
      }
    }

    // 5. Create Account Link for onboarding
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?tab=payments&refresh=true`,
      return_url: `${origin}/settings?tab=payments&success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error: any) {
    console.error("Error creating Connect account link:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
