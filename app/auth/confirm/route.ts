import { createServerSupabase } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/data/user";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/explore";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.search = "";

  if (token_hash && type) {
    const supabase = await createServerSupabase();
    const { error, data } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // For password recovery, redirect to reset-password page
      if (type === "recovery") {
        redirectTo.pathname = "/auth/reset-password";
      } else if (type === "signup" || type === "email") {
        // For email confirmation (new signups), check if onboarding is needed
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const onboardingComplete = await hasCompletedOnboarding(user.id);
          if (!onboardingComplete) {
            redirectTo.pathname = "/onboarding";
          }
        }
      }
      return NextResponse.redirect(redirectTo);
    } else {
      console.log("OTP verification failed:", error.message);
    }
  } else {
    console.log("Missing token_hash or type");
  }

  // Redirect to error page if verification fails
  console.log("Redirecting to error page");
  redirectTo.pathname = "/auth/auth-code-error";
  return NextResponse.redirect(redirectTo);
}
