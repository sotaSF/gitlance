"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileSettingsForm } from "./components/profile-settings-form";
import { SocialLinksForm } from "./components/social-links-form";
import { SecuritySettings } from "./components/security-settings";
import { PaymentSettings } from "./components/payment-settings";
import { getUserSettings, syncGitHubUsername } from "./actions";
import { User, Link2, Shield, ArrowLeft, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  ProfileSettingsFormData,
  SocialLinksFormData,
  LinkedProvider,
} from "@/types/settings";

// Define interface for the data structure returned by getUserSettings
interface SettingsData {
  profile: ProfileSettingsFormData;
  social: SocialLinksFormData;
  linkedProviders: LinkedProvider[];
}

function SettingsPageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/auth/sign-in");
      }

      const result = await getUserSettings();

      if (!result.success || !result.data) {
        setError(result.error || "Failed to load settings");
      } else {
        setSettingsData(result.data);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const sync = async () => {
        // Clear code from URL immediately
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        toast({
          title: "Syncing GitHub...",
          description: "Please wait while we update your profile.",
        });

        const result = await syncGitHubUsername();
        if (result.success) {
          toast({
            title: "GitHub Connected",
            description: `Connected as @${result.github_username}`,
          });

          // Reload settings to update UI
          const settingsResult = await getUserSettings();
          if (settingsResult.success && settingsResult.data) {
            setSettingsData(settingsResult.data);
            // Switch to social tab to show the connection
            setActiveTab("social");
          }
        } else {
          toast({
            title: "Sync Failed",
            description: result.error || "Failed to sync GitHub profile",
            variant: "destructive",
          });
        }
      };
      sync();
    }
  }, [searchParams, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-muted-foreground animate-pulse">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (error || !settingsData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-md space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4 ring-8 ring-red-500/5">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Error loading settings</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Manage your public profile",
    },
    {
      id: "social",
      label: "Social Links",
      icon: Link2,
      description: "Connect your social accounts",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Password and authentication",
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      description: "Manage your payout details",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none opacity-50" />

      <div className="container max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2 h-12 w-12 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <SettingsPageIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-lg">
                Manage your account preferences and profile
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="sticky top-24 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 relative group overflow-hidden",
                      isActive
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-emerald-500"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-white"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="font-medium">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border rounded-3xl shadow-sm overflow-hidden"
              >
                {/* Content Header */}
                <div className="px-8 py-6 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    {tabs.map(
                      (t) =>
                        t.id === activeTab && (
                          <div key={t.id} className="flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2.5 rounded-xl",
                                activeTab === "profile"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : activeTab === "social"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-amber-500/10 text-amber-600"
                              )}
                            >
                              <t.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold">
                                {t.label}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {t.description}
                              </p>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-8">
                  {activeTab === "profile" && (
                    <ProfileSettingsForm initialData={settingsData.profile} />
                  )}
                  {activeTab === "social" && (
                    <SocialLinksForm initialData={settingsData.social} />
                  )}
                  {activeTab === "security" && (
                    <SecuritySettings
                      linkedProviders={settingsData.linkedProviders}
                    />
                  )}
                  {activeTab === "payments" && (
                    <PaymentSettings
                      stripeConnectId={settingsData.profile.stripe_connect_id}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
