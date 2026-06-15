"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  children: React.ReactNode;
  loadingText: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SubmitButton({
  children,
  loadingText,
  disabled = false,
  loading = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled || loading}
      className="mt-2 w-full bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-secondary)]"
    >
      {pending || loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
