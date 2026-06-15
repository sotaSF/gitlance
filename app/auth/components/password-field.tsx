"use client";

import { useState } from "react";
import { Eye, EyeClosed, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PasswordFieldProps {
  id: string;
  label: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  registration?: any;
}

export function PasswordField({
  id,
  label,
  name,
  placeholder = "Password",
  required = false,
  autoComplete,
  disabled = false,
  error,
  registration,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}

          className={`pl-9 pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeClosed className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
