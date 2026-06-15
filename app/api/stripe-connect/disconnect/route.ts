import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Clear stripe_connect_id in profile
    const { error } = await supabase
      .from("profiles")
      .update({ stripe_connect_id: null })
      .eq("id", user.id);

    if (error) {
      console.error("Error disconnecting Stripe:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Stripe account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stripe Disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
