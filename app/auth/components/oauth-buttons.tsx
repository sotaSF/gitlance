"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/constants/google_svg";
import { oauthSignInGithub, oauthSignInGoogle } from "../actions";
import { toast } from "sonner";

export function OAuthButtons() {
  const handleGithub = async () => {
    const res = await oauthSignInGithub();
    if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleGoogle = async () => {
    const res = await oauthSignInGoogle();
    if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <div className="grid gap-3">
      <form action={handleGithub}>
        <Button
          type="submit"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-[var(--color-border)]"
          aria-label="Continue with GitHub"
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </Button>
      </form>

      <form action={handleGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-[var(--color-border)]"
          aria-label="Continue with Google"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </Button>
      </form>

      <div className="relative my-2 flex items-center">
        <div className="h-px w-full bg-[var(--color-border)]" />
        <span className="px-3 text-xs text-[var(--color-muted-foreground)]">
          or
        </span>
        <div className="h-px w-full bg-[var(--color-border)]" />
      </div>
    </div>
  );
}
