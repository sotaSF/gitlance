export interface ProfileSettingsFormData {
  display_name: string | null;
  username: string | null;
  headline: string | null;
  description: string | null;
  location: string | null;
  timezone: string | null;
  pronouns: string | null;
  years_experience: number | null;
  seniority: "junior" | "mid" | "senior" | "lead" | null;
  primary_role: string | null;
  avatar_url: string | null;
  stripe_connect_id?: string | null;
}

export interface SocialLinksFormData {
  github_username?: string | null;
  linkedin_url: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LinkedProvider {
  provider: "email" | "github" | "google";
  identity_id: string;
  created_at: string;
}

export interface UserSettings {
  profile: ProfileSettingsFormData;
  social: SocialLinksFormData;
  linkedProviders: LinkedProvider[];
}
