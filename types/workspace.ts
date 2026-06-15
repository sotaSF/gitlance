export interface WorkspaceRecord {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface WorkspaceChannel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface WorkspaceChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
}

export interface WorkspaceChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  reply_to_id?: string | null;
  reactions?: Record<string, string[]>; // Map of emoji -> array of user_ids
  is_deleted?: boolean;        // soft-delete flag
  edited_at?: string | null;   // timestamp of last edit
  created_at: string;
  updated_at: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GitHubStats {
  commits: number;
  contributors: number;
  pullRequests: number;
  openPullRequests: number;
  closedPullRequests: number;
  mergedPullRequests: number;
  issues: number;
  openIssues: number;
  closedIssues: number;
  stars: number;
  forks: number;
  watchers: number;
  lastUpdate: string;
  defaultBranch: string;
  repoSize: number; // in KB
  languages: LanguageStat[];
  topContributors: ContributorStat[];
  commitActivity: CommitActivity[];
  codeFrequency: CodeFrequency[];
  recentActivity: RecentActivity[];
}

export interface LanguageStat {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface ContributorStat {
  username: string;
  avatarUrl: string;
  commits: number;
  additions: number;
  deletions: number;
  percentage: number;
}

export interface CommitActivity {
  date: string;
  count: number;
}

export interface CodeFrequency {
  week: string;
  additions: number;
  deletions: number;
}

export interface RecentActivity {
  type: 'commit' | 'pr' | 'issue' | 'release';
  title: string;
  author: string;
  authorAvatar: string;
  date: string;
  url: string;
}

export interface WorkspaceMember {
  id: string;
  profile_id: string;
  project_id: string;
  role: TeamRole;
  joined_at: string;
  active?: boolean;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    github_username?: string | null;
  };
}

// Role types
export type TeamRole = 'owner' | 'maintainer' | 'contributor';

export type ModuleStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed';

// Workspace metadata stored in jsonb
export interface WorkspaceMetadata {
  is_paused?: boolean;
  paused_at?: string;
  paused_by?: string;
  description?: string;
  permissions?: {
    can_create_channels?: TeamRole[];
    can_invite_members?: TeamRole[];
    can_manage_settings?: TeamRole[];
  };
}

// Settings page data
export interface WorkspaceSettings {
  workspace: WorkspaceRecord;
  metadata: WorkspaceMetadata;
  userRole: TeamRole;
  canManageSettings: boolean;
}

// Project module with assignment tracking
export interface ProjectModule {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  ai_estimated_cost?: number;
  owner_final_cost?: number;
  currency?: string;
  is_mandatory: boolean;
  complexity: number;
  is_assigned: boolean;
  assigned_to?: string;
  status: ModuleStatus;
  progress: number; // 0-100 percentage
  completed_at?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

// GitHub collaborator info
export interface GitHubCollaborator {
  id: number;
  login: string;
  avatar_url: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

// Repository info
export interface ProjectRepository {
  id: string;
  project_id: string;
  provider: string;
  repo_full_name: string | null;
  repo_url: string | null;
  is_private: boolean;
  creation_status: string;
  created_at: string;
}
