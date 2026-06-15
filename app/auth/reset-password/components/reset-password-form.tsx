"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "../../components/password-field";
import { SubmitButton } from "../../components/submit-button";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters long and include at least one letter and one number.";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    setError(null);
    setIsLoading(true);

    // Client-side validation
    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      setIsLoading(false);
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(PASSWORD_ERROR_MESSAGE);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_ERROR_MESSAGE);
      setIsLoading(false);
      return;
    }

    // Update password using client-side Supabase
    const supabase = createBrowserSupabase();
    
    
    const { error: updateError, data: updateData } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message || "Error updating password.");
      setIsLoading(false);
      return;
    }

    console.log("Password updated successfully!");
    setSuccess(true);
    setIsLoading(false);
    
    setTimeout(() => {
      router.push("/auth/sign-in?success=password-reset");
    }, 1500);
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
          Password updated successfully! Redirecting to sign in...
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <PasswordField
          id="password"
          label="New Password"
          name="password"
          placeholder="Enter your new password"
          required
          autoComplete="new-password"
          disabled={success || isLoading}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm your new password"
          required
          autoComplete="new-password"
          disabled={success || isLoading}
        />
        <SubmitButton loadingText="Updating..." disabled={success || isLoading}>
          Update Password
        </SubmitButton>
      </form>
    </>
  );
}
