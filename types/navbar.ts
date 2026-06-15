import { User } from "@supabase/supabase-js";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
}

export interface UserMenuProps {
  user: User;
  avatarUrl?: string | null;
  displayName?: string | null;
}
