"use client";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        Sign Out
      </Button>
    </form>
  );
}
