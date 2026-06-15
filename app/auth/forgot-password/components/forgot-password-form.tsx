"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { FormField } from "../../components/form-field";
import { SubmitButton } from "../../components/submit-button";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;

    setError(null);
    setIsLoading(true);

    // Client-side validation
    if (!email) {
      setError("Email is required.");
      setIsLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Invalid email format.");
      setIsLoading(false);
      return;
    }

    // Request password reset using client-side Supabase
    const supabase = createBrowserSupabase();
    const origin = window.location.origin;
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/auth/confirm?type=recovery&next=/auth/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message || "Failed to send reset email.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <>
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 mb-4"
          role="status"
        >
          Password reset email sent! Check your inbox and spam folder.
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <FormField
          id="email"
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          icon={Mail}
          disabled={success || isLoading}
        />
        <SubmitButton loadingText="Sending..." disabled={success || isLoading}>
          Send Reset Link
        </SubmitButton>
      </form>
    </>
  );
}
