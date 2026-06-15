"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "../components/auth-layout";
import { AuthHeader } from "../components/auth-header";
import { AuthTestimonial } from "../components/auth-testimonial";
import { ResetPasswordForm } from "./components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      testimonial={
        <AuthTestimonial
          quote="Secure password management with GitLance gives me peace of mind. Simple yet powerful."
          highlight="Simple yet powerful"
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
        title="Reset your password"
        description="Enter your new password below."
      />

      <ResetPasswordForm />

      <div className="text-center text-xs text-muted-foreground border-t border-border pt-4 mt-6">
        <p>
          By updating your password, you agree to our{" "}
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
