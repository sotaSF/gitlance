export type ProjectSearchFilters = {
  query?: string;
  tags?: string[];
  minBudget?: number;
  maxBudget?: number;
  collaborationType?: string[];
  experienceLevel?: string[];
  paymentType?: string[];
  skills?: string[];
  status?: string[];
  isPublished?: boolean;
  deadlineStart?: string;
  deadlineEnd?: string;
  sortBy?: "recent" | "budget_high" | "budget_low" | "deadline";
  page?: number;
  limit?: number;
};

export type UserSearchFilters = {
  query?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  seniority?: string[];
  primaryRole?: string[];
  location?: string;
  isVerified?: boolean;
  availability?: string[];
  sortBy?: "recent" | "experience" | "rating";
  page?: number;
  limit?: number;
};

export type SearchResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
