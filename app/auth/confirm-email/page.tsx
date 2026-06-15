"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Check, ArrowLeft, RefreshCw } from "lucide-react";
import { resendConfirmationEmail } from "../actions";
import { AuthLayout } from "../components/auth-layout";
import { AuthHeader } from "../components/auth-header";
import { AuthTestimonial } from "../components/auth-testimonial";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL_VERIFICATION_POLL_INTERVAL = 4000;

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const supabase = createBrowserSupabase();

  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/auth/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || isResending || countdown > 0) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await resendConfirmationEmail(email);
      setResendSuccess(true);
      setCountdown(60); // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend confirmation email"
      );
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (!email) return;
    let interval: NodeJS.Timeout;

    const checkEmailConfirmed = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email_confirmed_at) {
        router.push("/explore");
      }
    };

    interval = setInterval(checkEmailConfirmed, EMAIL_VERIFICATION_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [email, router, supabase]);

  if (!email) {
    return null; // Will redirect
  }

  return (
    <AuthLayout
      testimonial={
        <AuthTestimonial
          quote="The seamless onboarding process made getting started with GitLance incredibly smooth. Security without the hassle."
          highlight="Security without the hassle"
        />
      }
    >
      <div className="mb-6">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to signup
        </Link>
      </div>

      <AuthHeader
        title="Check your email"
        description="We've sent a confirmation link to your inbox"
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {resendSuccess && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success mb-4">
          Confirmation email sent! Check your inbox.
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="relative">
            <div className="p-4 rounded-full bg-brand/10 animate-pulse">
              <Mail className="h-8 w-8 text-brand" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border-2 border-brand">
              <Check className="h-3 w-3 text-brand" />
            </div>
          </div>

          <div className="text-center space-y-2 max-w-md">
            <h3 className="font-semibold text-lg">Confirmation email sent</h3>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and get
              started.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            What to do next
          </h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Check your email inbox for a message from GitLance</li>
            <li>Click the confirmation link in the email</li>
            <li>
              You'll be automatically signed in and redirected to your dashboard
            </li>
          </ol>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending
                ? "Resending..."
                : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend Email"}
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">Return to Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p className="mb-2">
            Check your spam folder if you don't see the email
          </p>
          <p>
            By confirming, you agree to our{" "}
            <Link
              href="/term-of-services"
              className="text-brand hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-brand hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        testimonial={
          <AuthTestimonial
            quote="The seamless onboarding process made getting started with GitLance incredibly smooth. Security without the hassle."
            highlight="Security without the hassle"
          />
        }
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLayout>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
