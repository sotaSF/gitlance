"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
} from "@/components/ui/stepper";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import {
  BasicDetailsStep,
  type BasicDetailsData,
} from "@/components/onboarding/basic-details-step";
import { RoleSelectionStep } from "@/components/onboarding/role-selection-step";
import {
  DeveloperSkillsStep,
  type DeveloperSkillsData,
} from "@/components/onboarding/developer-skills-step";
import SkillsStep from "@/components/onboarding/skills-step";
import { ClientProjectStep } from "@/components/onboarding/client-project-step";
import { GitHubConnectStep } from "@/components/onboarding/github-connect-step";
import { StripeConnectStep } from "@/components/onboarding/stripe-connect-step";
import { OnboardingNavigation } from "@/components/onboarding/onboarding-navigation";
import {
  updateBasicDetails,
  updateUserRole,
  updateDeveloperDetails,
  updateUserSkills,
  completeOnboarding,
  getAvailableSkills,
  createCustomSkill,
  syncGitHubProfile,
} from "./actions";

interface OnboardingClientProps {
  userName?: string;
  initialProfile?: any;
}

export function OnboardingClient({ userName, initialProfile }: OnboardingClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<
    Array<{ id: number; name: string; category: string }>
  >([]);

  // Form data states - initialize with existing profile data if available
  const [basicDetails, setBasicDetails] = useState<BasicDetailsData>({
    username: initialProfile?.username || "",
    display_name: initialProfile?.display_name || userName || "",
    pronouns: initialProfile?.pronouns || "",
    headline: initialProfile?.headline || "",
    description: initialProfile?.description || "",
    location: initialProfile?.location || "",
    timezone: initialProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    country: initialProfile?.country || "",
    city: initialProfile?.city || "",
    region: initialProfile?.region || "",
    country_code: initialProfile?.country_code || "",
    avatar_url: initialProfile?.avatar_url || undefined,
  });

  const [selectedRole, setSelectedRole] = useState<
    "developer" | "client" | null
  >(null);

  const [developerDetails, setDeveloperDetails] = useState<DeveloperSkillsData>(
    initialProfile ? {
      years_experience: initialProfile.years_experience || 0,
      seniority: initialProfile.seniority || "",
      linkedin_url: initialProfile.linkedin_url || "",
      availability: initialProfile.availability || { types: [], hours_per_week: 40 },
      selectedSkills: [],
    } : {
      years_experience: 0,
      seniority: "",
      linkedin_url: "",
      availability: { types: [], hours_per_week: 40 },
      selectedSkills: [],
    }
  );

  // Fetch available skills on mount and restore onboarding progress
  useEffect(() => {
    const fetchSkills = async () => {
      const result = await getAvailableSkills();
      if (result.success && result.skills) {
        setAvailableSkills(result.skills);
      }
    };
    fetchSkills();

    // Check if user just returned from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthCode = urlParams.has('code');

    // Restore onboarding progress from localStorage
    try {
      const savedStep = localStorage.getItem('onboarding_current_step');
      const savedRole = localStorage.getItem('onboarding_selected_role');
      const savedBasicDetails = localStorage.getItem('onboarding_basic_details');
      const savedDeveloperDetails = localStorage.getItem('onboarding_developer_details');

      if (savedStep) {
        const step = parseInt(savedStep, 10);
        if (!isNaN(step) && step > 1) {
          setCurrentStep(step);
        }
      }

      if (savedRole) {
        setSelectedRole(savedRole as 'developer' | 'client');
      }

      if (savedBasicDetails) {
        setBasicDetails(JSON.parse(savedBasicDetails));
      }

      if (savedDeveloperDetails) {
        setDeveloperDetails(JSON.parse(savedDeveloperDetails));
      }
    } catch (error) {
      console.error('Error restoring onboarding data:', error);
    }

    // Sync GitHub profile if user returned from OAuth
    if (hasOAuthCode) {
      const syncGitHub = async () => {
        console.log('Detected OAuth return, syncing GitHub profile and token...');

        // Sync GitHub username
        const result = await syncGitHubProfile();
        if (result.success && result.github_username) {
          console.log('GitHub username synced:', result.github_username);
          toast.success(`GitHub connected as @${result.github_username}`);
        } else {
          console.error('Failed to sync GitHub profile:', result.error);
        }

        // CRITICAL: Sync GitHub token to database for persistent storage
        const { syncGitHubTokenToDatabase } = await import('@/app/settings/actions');
        const tokenResult = await syncGitHubTokenToDatabase();

        if (tokenResult.success) {
          if (tokenResult.stored) {
            console.log('✅ GitHub token stored successfully');
          } else if (tokenResult.alreadyStored) {
            console.log('ℹ GitHub token already stored');
          }
        } else {
          console.error('❌ Failed to sync GitHub token:', tokenResult.error);
          // Don't show error to user if username sync succeeded - token might sync later
        }

        // Clear the OAuth code from URL without refreshing
        window.history.replaceState({}, document.title, '/onboarding');
      };
      syncGitHub();
    }

    // Debug: Log restored state
    setTimeout(() => {
      console.log('Onboarding state after restoration:', {
        currentStep,
        selectedRole,
        savedStep: localStorage.getItem('onboarding_current_step'),
        savedRole: localStorage.getItem('onboarding_selected_role')
      })
    }, 100);
  }, [router]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (currentStep > 1) { // Don't save if we're on the welcome step
      try {
        localStorage.setItem('onboarding_current_step', String(currentStep));
        localStorage.setItem('onboarding_basic_details', JSON.stringify(basicDetails));
        localStorage.setItem('onboarding_developer_details', JSON.stringify(developerDetails));

        if (selectedRole) {
          localStorage.setItem('onboarding_selected_role', selectedRole);
        }

        console.log('Auto-saved onboarding state:', { currentStep, selectedRole });
      } catch (error) {
        console.error('Error auto-saving onboarding data:', error);
      }
    }
  }, [currentStep, selectedRole, basicDetails, developerDetails]);

  // Define step configuration dynamically depending on selected role
  const steps =
    selectedRole === "developer"
      ? [
        { title: "Welcome", description: "Getting started" },
        { title: "Basic Info", description: "Tell us about you" },
        { title: "Your Role", description: "Developer or Client" },
        { title: "Details", description: "Experience & availability" },
        { title: "GitHub", description: "Connect account" },
        { title: "Skills", description: "Your expertise" },
        { title: "Finances", description: "Receive payouts" },
      ]
      : [
        { title: "Welcome", description: "Getting started" },
        { title: "Basic Info", description: "Tell us about you" },
        { title: "Your Role", description: "Developer or Client" },
        { title: "Project", description: "Create project" },
      ];

  const totalSteps = steps.length;

  const handleNext = async () => {
    // Save progress to localStorage
    try {
      localStorage.setItem('onboarding_current_step', String(currentStep));
      if (selectedRole) {
        localStorage.setItem('onboarding_selected_role', selectedRole);
      }
      localStorage.setItem('onboarding_basic_details', JSON.stringify(basicDetails));
      localStorage.setItem('onboarding_developer_details', JSON.stringify(developerDetails));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }

    setIsLoading(true);

    try {
      if (currentStep === 1) {
        // Welcome step - just move to next
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Basic details step - validate and save
        if (!basicDetails.username.trim()) {
          toast.error("Please enter your username to continue.");
          setIsLoading(false);
          return;
        }
        if (!basicDetails.display_name.trim()) {
          toast.error("Please enter your display name to continue.");
          setIsLoading(false);
          return;
        }
        if (!basicDetails.pronouns.trim()) {
          toast.error("Please enter your pronouns to continue.");
          setIsLoading(false);
          return;
        }
        if (!basicDetails.headline.trim()) {
          toast.error("Please enter your headline to continue.");
          setIsLoading(false);
          return;
        }
        if (!basicDetails.description.trim()) {
          toast.error("Please tell us about yourself to continue.");
          setIsLoading(false);
          return;
        }
        if (!basicDetails.location.trim()) {
          toast.error("Please enter your location to continue.");
          setIsLoading(false);
          return;
        }

        const result = await updateBasicDetails(basicDetails);
        if (!result.success) {
          toast.error(result.error || "Failed to save details");
          setIsLoading(false);
          return;
        }

        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Role selection step
        if (!selectedRole) {
          toast.error("Please select your role to continue.");
          setIsLoading(false);
          return;
        }

        const result = await updateUserRole({ primary_role: selectedRole });
        if (!result.success) {
          toast.error(result.error || "Failed to save role");
          setIsLoading(false);
          return;
        }

        setCurrentStep(4);
      } else if (currentStep === 4) {
        // If developer, step 4 is details and should move to skills step
        if (selectedRole === "developer") {
          // Validate developer detail fields (without skills)
          if (!developerDetails.seniority) {
            toast.error("Please select your seniority level.");
            setIsLoading(false);
            return;
          }
          if (!developerDetails.linkedin_url.trim()) {
            toast.error("Please enter your LinkedIn URL.");
            setIsLoading(false);
            return;
          }
          if (
            !developerDetails.availability?.types ||
            developerDetails.availability.types.length === 0
          ) {
            toast.error("Please select at least one availability type.");
            setIsLoading(false);
            return;
          }

          // Move to GitHub connect step
          setCurrentStep(5);
        } else {
          // Final step for client role - complete onboarding
          const completeResult = await completeOnboarding();
          if (!completeResult.success) {
            toast.error(completeResult.error || "Failed to complete onboarding");
            setIsLoading(false);
            return;
          }

          // Clear onboarding progress from localStorage
          localStorage.removeItem('onboarding_current_step');
          localStorage.removeItem('onboarding_selected_role');
          localStorage.removeItem('onboarding_basic_details');
          localStorage.removeItem('onboarding_developer_details');

          router.push("/explore");
        }
      } else if (currentStep === 5) {
        // GitHub connect step for developers - just move to next
        if (selectedRole === "developer") {
          setCurrentStep(6);
        }
      } else if (currentStep === 6) {
        // Final step for developer - validate skills and save everything
        if (selectedRole === "developer") {
          if (developerDetails.selectedSkills.length === 0) {
            toast.error("Please select at least one skill.");
            setIsLoading(false);
            return;
          }

          // Process custom skills - create them in database first
          const customSkills = developerDetails.selectedSkills.filter(
            (s) => s.skill_id < 0
          );
          const processedSkills = [...developerDetails.selectedSkills];

          for (const customSkill of customSkills) {
            const result = await createCustomSkill(customSkill.name, "general");
            if (result.success && result.skill) {
              // Replace the custom skill with the database skill
              const index = processedSkills.findIndex(
                (s) => s.skill_id === customSkill.skill_id
              );
              if (index !== -1) {
                processedSkills[index] = {
                  ...processedSkills[index],
                  skill_id: result.skill.id,
                };
              }
            }
          }

          // Save developer details
          const detailsResult = await updateDeveloperDetails({
            years_experience: developerDetails.years_experience,
            seniority: developerDetails.seniority as
              | "junior"
              | "mid"
              | "senior"
              | "lead",
            linkedin_url: developerDetails.linkedin_url,
            availability: {
              ...developerDetails.availability,
              hours_per_week:
                Number(developerDetails.availability?.hours_per_week) || 0,
            },
          });

          if (!detailsResult.success) {
            toast.error(detailsResult.error || "Failed to save developer details");
            setIsLoading(false);
            return;
          }

          // Save skills
          const skillsResult = await updateUserSkills(
            processedSkills.map((s) => ({
              skill_id: s.skill_id,
              proficiency: s.proficiency,
              years_experience: 0,
            }))
          );

          if (!skillsResult.success) {
            toast.error("Failed to save skills. Please try again.");
            setIsLoading(false);
            return;
          }

          setCurrentStep(7);
        }
      } else if (currentStep === 7) {
        if (selectedRole === "developer") {
          // Mark onboarding as complete
          const completeResult = await completeOnboarding();
          if (!completeResult.success) {
            toast.error(completeResult.error || "Failed to complete onboarding");
            setIsLoading(false);
            return;
          }

          // Clear onboarding progress from localStorage
          localStorage.removeItem('onboarding_current_step');
          localStorage.removeItem('onboarding_selected_role');
          localStorage.removeItem('onboarding_basic_details');
          localStorage.removeItem('onboarding_developer_details');

          router.push("/explore");
        }
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);

    try {
      // Complete onboarding without project creation
      const result = await completeOnboarding();
      if (!result.success) {
        toast.error(result.error || "Failed to complete onboarding");
        setIsLoading(false);
        return;
      }

      // Clear onboarding progress from localStorage
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_selected_role');
      localStorage.removeItem('onboarding_basic_details');
      localStorage.removeItem('onboarding_developer_details');

      router.push("/explore");
    } catch (error) {
      console.error("Error skipping:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Stable handler passed to SkillsStep to avoid re-creating the function
  // on every render (which caused a useEffect dependency loop in SkillsStep).
  const handleSkillsChange = useCallback(
    (data: import("@/components/onboarding/skills-step").DeveloperSkillsData) =>
      setDeveloperDetails((prev) => ({
        ...prev,
        seniority: data.seniority,
        linkedin_url: data.linkedin_url,
        availability: data.availability,
        selectedSkills: data.selectedSkills,
      })),
    [setDeveloperDetails]
  );

  const isNextDisabled = () => {
    if (
      currentStep === 2 &&
      (!basicDetails.username.trim() ||
        !basicDetails.display_name.trim() ||
        !basicDetails.pronouns.trim() ||
        !basicDetails.headline.trim() ||
        !basicDetails.description.trim() ||
        !basicDetails.location.trim())
    ) {
      return true;
    }
    if (currentStep === 3 && !selectedRole) {
      return true;
    }
    if (currentStep === 4 && selectedRole === "developer") {
      // Developer details step (without skills)
      if (
        !developerDetails.seniority ||
        !developerDetails.linkedin_url.trim() ||
        !developerDetails.availability?.types ||
        developerDetails.availability.types.length === 0
      ) {
        return true;
      }
    }

    if (currentStep === 6 && selectedRole === "developer") {
      // Skills step: require at least one selected skill
      if (
        !developerDetails.selectedSkills ||
        developerDetails.selectedSkills.length === 0
      ) {
        return true;
      }
    }

    // Step 7 doesn't strictly have a disabled state for Next button unless they haven't connected?
    // We allow them to skip instead, so Next is always enabled or they use Connect button.

    return false;
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl space-y-8 px-4 py-12">
      {/* Stepper */}
      <Stepper value={currentStep} className="mb-12">
        {steps.map((s, i) => (
          <StepperItem
            key={i}
            step={i + 1}
            className="not-last:flex-1 max-md:items-start"
          >
            <StepperTrigger className="gap-4 rounded max-md:flex-col">
              <StepperIndicator />
              <div className="text-center md:-order-1 md:text-left">
                <StepperTitle>{s.title}</StepperTitle>
              </div>
            </StepperTrigger>
            {i + 1 < steps.length && (
              <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
            )}
          </StepperItem>
        ))}
      </Stepper>

      {/* Step Content with Animation */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <WelcomeStep key="welcome" userName={basicDetails.display_name} />
          )}

          {currentStep === 2 && (
            <BasicDetailsStep
              key="basic-details"
              onDataChange={setBasicDetails}
              initialData={basicDetails}
            />
          )}

          {currentStep === 3 && (
            <RoleSelectionStep
              key="role-selection"
              onRoleChange={setSelectedRole}
              initialRole={selectedRole || undefined}
            />
          )}

          {currentStep === 4 && selectedRole === "developer" && (
            <DeveloperSkillsStep
              key="developer-details"
              onDataChange={setDeveloperDetails}
              initialData={developerDetails}
              availableSkills={availableSkills}
            />
          )}

          {currentStep === 5 && selectedRole === "developer" && (
            <GitHubConnectStep
              key="github-connect"
              isConnected={!!initialProfile?.github_username}
              githubUsername={initialProfile?.github_username}
              onSkip={() => setCurrentStep(6)}
            />
          )}

          {currentStep === 6 && selectedRole === "developer" && (
            <SkillsStep
              key="developer-skills"
              onDataChange={handleSkillsChange}
              initialData={developerDetails}
              availableSkills={availableSkills}
            />
          )}

          {currentStep === 7 && selectedRole === "developer" && (
            <StripeConnectStep
              key="stripe-connect"
              isConnected={!!initialProfile?.stripe_connect_id}
              onSkip={() => {
                // Manually trigger the "Next" logic for step 7
                handleNext();
              }}
            />
          )}

          {currentStep === 4 && selectedRole === "client" && (
            <ClientProjectStep
              key="client-project"
              onSkip={handleSkip}
              onComplete={async () => {
                const result = await completeOnboarding();
                if (!result.success) {
                  toast.error(result.error || "Failed to complete onboarding");
                  throw new Error(result.error);
                }
                localStorage.removeItem('onboarding_current_step');
                localStorage.removeItem('onboarding_selected_role');
                localStorage.removeItem('onboarding_basic_details');
                localStorage.removeItem('onboarding_developer_details');
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={
          currentStep === 4 && selectedRole === "client"
            ? handleSkip
            : currentStep === 5 && selectedRole === "developer"
              ? () => setCurrentStep(currentStep + 1)
              : currentStep === 7 && selectedRole === "developer"
                ? handleNext
                : undefined
        }
        isLoading={isLoading}
        isNextDisabled={isNextDisabled()}
        showSkip={
          (currentStep === 4 && selectedRole === "client") ||
          (currentStep === 5 && selectedRole === "developer") ||
          (currentStep === 7 && selectedRole === "developer")
        }
      />
    </div>
  );
}
