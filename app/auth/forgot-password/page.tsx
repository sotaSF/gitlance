import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "../components/auth-layout";
import { AuthHeader } from "../components/auth-header";
import { AuthTestimonial } from "../components/auth-testimonial";
import { ForgotPasswordForm } from "./components/forgot-password-form";

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthLayout
      testimonial={
        <AuthTestimonial
          quote="Resetting my password on GitLance was quick and painless. Security made simple."
          highlight="Security made simple"
        />
      }
    >
      <div className="mb-6">
        <Link
          href="/auth/sign-in"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>

      <AuthHeader
        title="Forgot your password?"
        description="Enter your email and we'll send you a link to reset it."
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <ForgotPasswordForm />

      <div className="text-center text-xs text-muted-foreground border-t border-border pt-4 mt-6">
        <p className="mb-2">
          Check your spam folder if you don't see the email
        </p>
        <p>
          By resetting, you agree to our{" "}
          <Link href="/term-of-services" className="text-brand hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
