export interface ProposalAttachment {
  name?: string | null;
  url?: string | null;
  size?: number | null;
}

export interface ModuleSnapshot {
  id?: string;
  name?: string;
  description?: string | null;
  owner_final_cost?: number | null;
  ai_estimated_cost?: number | null;
  is_mandatory?: boolean | null;
  complexity?: number | null;
}

export interface ProposalProposer {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline?: string | null;
}

export interface ProposalWithProposer {
  id: string;
  project_id: string;
  proposer_id: string;
  cover_letter: string | null;
  proposed_budget: number | null;
  currency: string | null;
  proposed_timeline_days: number | null;
  attachments?: ProposalAttachment[] | null;
  status: string;
  modules_snapshot?: ModuleSnapshot[] | null;
  created_at: string;
  updated_at: string;
  proposer?: ProposalProposer | null;
}
