"use client";

import { Mail, User } from "lucide-react";
import { Suspense, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpAction } from "../actions";
import { AuthLayout } from "../components/auth-layout";
import { AuthHeader } from "../components/auth-header";
import { AuthTestimonial } from "../components/auth-testimonial";
import { OAuthButtons } from "../components/oauth-buttons";
import { FormField } from "../components/form-field";
import { PasswordField } from "../components/password-field";
import { SubmitButton } from "../components/submit-button";
import { AuthFooterLink } from "../components/auth-footer-link";
import { ErrorMessage } from "../components/error-message";
import { signupSchema, SignupInput } from "@/lib/auth/validation";
import { toast } from "sonner";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = (data: SignupInput) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("confirm", data.confirm);
        const result = await signUpAction(formData);
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
          quote="Getting started with GitLance was effortless and the developer matching saved us weeks. The velocity boost has been huge for our product roadmap."
          highlight="The velocity boost"
        />
      }
    >
      <AuthHeader
        title="Create your account"
        description="Start building with GitLance"
      />

      <Suspense fallback={null}>
        <ErrorMessage />
      </Suspense>

      <OAuthButtons />

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="name"
          label="Name"
          type="text"
          placeholder="Jane Doe"
          icon={User}
          registration={register("name")}
          error={errors.name?.message}
          disabled={isPending}
        />

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
          autoComplete="new-password"
          registration={register("password")}
          error={errors.password?.message}
          disabled={isPending}
        />

        <PasswordField
          id="confirm"
          label="Confirm Password"
          autoComplete="new-password"
          registration={register("confirm")}
          error={errors.confirm?.message}
          disabled={isPending}
        />

        <SubmitButton
          loadingText="Creating account..."
          loading={isPending}
        >
          Create Account
        </SubmitButton>

        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign In"
          href="/auth/sign-in"
        />
      </form>
    </AuthLayout>
  );
}
