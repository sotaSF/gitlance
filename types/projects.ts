export interface ProjectAttachment {
  name?: string | null;
  url?: string | null;
  size?: number | null;
}

export interface ProjectRecord {
  id: string;
  owner_id: string;
  title: string;
  short_description?: string | null;
  user_story?: string | null;
  attachments?: ProjectAttachment[] | null;
  owner_final_total?: number | null;
  tags?: string[] | null;
  required_skills?: string[] | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  is_published?: boolean | null;
  deadline?: string | null;
  currency?: string | null;
}

export interface ProjectModule {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  owner_final_cost?: number | null;
  ai_estimated_cost?: number | null;
  ai_confidence?: number | null;
  is_mandatory?: boolean | null;
  complexity?: number | null;
  created_at?: string;
  is_assigned?: boolean;
}
