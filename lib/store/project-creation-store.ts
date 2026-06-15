import { create } from "zustand";

export type AIModule = {
  id: string;
  name: string;
  description: string;
  ai_estimated_cost: number;
  owner_final_cost?: number;
  ai_confidence?: number;
  complexity?: number;
  is_mandatory: boolean;
  min_cost?: number;
  max_cost?: number;
};

export type AISuggestion = {
  modules: AIModule[];
  suggested_total: number;
  adjustment_limits: {
    min_total?: number;
    max_total?: number;
    per_module_adjustment_percent?: number;
  };
};

type ProjectCreationState = {
  // Step 1: Basic info
  title: string;
  userStory: string;
  ownerEstimatedBudget: number;

  // Step 2: AI suggestions
  aiStatus: "idle" | "loading" | "success" | "error";
  aiModules: AIModule[];
  aiError: string | null;

  // Step 3: Owner adjustments
  adjustedModules: AIModule[];

  // Step 4: GitHub authentication
  githubAuthStatus: "not_connected" | "connecting" | "connected";
  githubAccount: { username: string; accountId: number } | null;

  // Step 5: Repo config
  selectedRepoVisibility: "public" | "private";
  repoName: string;

  // Step 6: Publish readiness
  isReadyToPublish: boolean;

  // UI state
  currentStep: number;

  // Actions
  setTitle: (title: string) => void;
  setUserStory: (story: string) => void;
  setOwnerEstimatedBudget: (budget: number) => void;
  setAiStatus: (status: "idle" | "loading" | "success" | "error") => void;
  setAiModules: (modules: AIModule[]) => void;
  setAiError: (error: string | null) => void;
  setAdjustedModules: (modules: AIModule[]) => void;
  setGithubAuthStatus: (
    status: "not_connected" | "connecting" | "connected"
  ) => void;
  setGithubAccount: (
    account: { username: string; accountId: number } | null
  ) => void;
  setSelectedRepoVisibility: (visibility: "public" | "private") => void;
  setRepoName: (name: string) => void;
  setIsReadyToPublish: (ready: boolean) => void;
  setCurrentStep: (step: number) => void;
  resetStore: () => void;
};

const initialState: ProjectCreationState = {
  title: "",
  userStory: "",
  ownerEstimatedBudget: 0,
  aiStatus: "idle",
  aiModules: [],
  aiError: null,
  adjustedModules: [],
  githubAuthStatus: "not_connected",
  githubAccount: null,
  selectedRepoVisibility: "private",
  repoName: "",
  isReadyToPublish: false,
  currentStep: 1,
  setTitle: () => {},
  setUserStory: () => {},
  setOwnerEstimatedBudget: () => {},
  setAiStatus: () => {},
  setAiModules: () => {},
  setAiError: () => {},
  setAdjustedModules: () => {},
  setGithubAuthStatus: () => {},
  setGithubAccount: () => {},
  setSelectedRepoVisibility: () => {},
  setRepoName: () => {},
  setIsReadyToPublish: () => {},
  setCurrentStep: () => {},
  resetStore: () => {},
};

export const useProjectCreationStore = create<ProjectCreationState>(
  (set, _) => ({
    ...initialState,
    setTitle: (title) => set({ title }),
    setUserStory: (story) => set({ userStory: story }),
    setOwnerEstimatedBudget: (budget) => set({ ownerEstimatedBudget: budget }),
    setAiStatus: (status) => set({ aiStatus: status }),
    setAiModules: (modules) => set({ aiModules: modules }),
    setAiError: (error) => set({ aiError: error }),
    setAdjustedModules: (modules) => set({ adjustedModules: modules }),
    setGithubAuthStatus: (status) => set({ githubAuthStatus: status }),
    setGithubAccount: (account) => set({ githubAccount: account }),
    setSelectedRepoVisibility: (visibility) =>
      set({ selectedRepoVisibility: visibility }),
    setRepoName: (name) => set({ repoName: name }),
    setIsReadyToPublish: (ready) => set({ isReadyToPublish: ready }),
    setCurrentStep: (step) => set({ currentStep: step }),
    resetStore: () => set(initialState),
  })
);
