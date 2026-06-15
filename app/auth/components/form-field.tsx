import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  icon: LucideIcon;
  disabled?: boolean;
  error?: string;
  registration?: any;
}

export function FormField({
  id,
  label,
  type,
  name,
  placeholder,
  required = false,
  autoComplete,
  icon: Icon,
  disabled = false,
  error,
  registration,
}: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          id={id}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`pl-9 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          {...registration}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
