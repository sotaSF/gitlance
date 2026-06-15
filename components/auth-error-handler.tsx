"use client";

import { useEffect, useState } from "react";
import { cleanupAuthAndRedirect } from "@/app/auth/cleanup-action";

/**
 * Component to handle authentication errors in URL hash
 * Supabase redirects banned/disabled users to pages with hash parameters like:
 *
 * This component extracts those errors, cleans up auth state, and redirects to sign-in
 */
export function AuthErrorHandler() {
  const [isHandling, setIsHandling] = useState(false);

  useEffect(() => {
    // Prevent multiple executions
    if (isHandling) return;

    // Check for error in URL hash
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the # character
      const params = new URLSearchParams(hash);

      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (error) {
        setIsHandling(true);

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);

        // Determine error message
        let errorMessage = "Authentication failed";

        if (errorCode === "user_banned") {
          errorMessage =
            "Your account has been banned. Please contact support.";
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(
            errorDescription.replace(/\+/g, " ")
          );
        } else {
          errorMessage = error;
        }

        // Call server action to clean up auth and redirect
        cleanupAuthAndRedirect(errorMessage);
      }
    }
  }, [isHandling]);

  return null; // This component doesn't render anything
}
