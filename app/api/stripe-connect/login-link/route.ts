import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

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

    if (profileError || !profile?.stripe_connect_id) {
      return NextResponse.json(
        { error: "No connected Stripe account found" },
        { status: 404 }
      );
    }

    // 3. Generate Login Link
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripe_connect_id
    );

    return NextResponse.json({
      url: loginLink.url,
    });
  } catch (error: any) {
    console.error("Error creating login link:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
