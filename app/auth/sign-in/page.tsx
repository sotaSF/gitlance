"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Suspense, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInAction } from "../actions";
import { AuthLayout } from "../components/auth-layout";
import { AuthHeader } from "../components/auth-header";
import { AuthTestimonial } from "../components/auth-testimonial";
import { OAuthButtons } from "../components/oauth-buttons";
import { FormField } from "../components/form-field";
import { PasswordField } from "../components/password-field";
import { SubmitButton } from "../components/submit-button";
import { AuthFooterLink } from "../components/auth-footer-link";
import { ErrorMessage } from "../components/error-message";
import { loginSchema, LoginInput } from "@/lib/auth/validation";
import { toast } from "sonner";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        const result = await signInAction(formData);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error: any) {
        if (error && typeof error === "object" && "digest" in error) {
          throw error;
        }
        toast.error(error.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <AuthLayout
      testimonial={
        <AuthTestimonial
          quote="Lately been using GitLance for projects to save on costs and rapid builds that do not need all the infra and the hefty overheads that come with complex setups. Great solution overall."
          highlight="that do not need all the infra"
        />
      }
    >
      <AuthHeader title="Welcome back" description="Sign in to your account" />

      <Suspense fallback={null}>
        <ErrorMessage />
      </Suspense>

      <OAuthButtons />

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          registration={register("email")}
          error={errors.email?.message}
          disabled={isPending}
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password?.message}
          disabled={isPending}
        />

        <div className="flex items-center justify-between">
          <div />
          <Link
            href="/auth/forgot-password"
            className="text-sm text-[var(--color-brand)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton
          loadingText="Signing in..."
          loading={isPending}
        >
          Sign In
        </SubmitButton>

        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign Up Now"
          href="/auth/signup"
        />
      </form>
    </AuthLayout>
  );
}
