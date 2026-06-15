/**
 * Project Input Validation Utilities
 * Comprehensive validation for project creation fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationErrors {
  title?: string;
  shortDescription?: string;
  userStory?: string;
  budget?: string;
  tags?: string;
  requiredSkills?: string;
  attachments?: string;
}

export interface ProjectInputData {
  title: string;
  shortDescription?: string;
  userStory: string;
  budget?: number | null;
  tags?: string[];
  requiredSkills?: string[];
  attachments?: any[];
}

// Common English words for validation - expanded list
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
  'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
  // Tech/Project related words
  'app', 'application', 'website', 'web', 'mobile', 'platform', 'system', 'software',
  'project', 'develop', 'development', 'build', 'create', 'design', 'code', 'coding',
  'frontend', 'backend', 'fullstack', 'database', 'api', 'server', 'client', 'user',
  'users', 'feature', 'features', 'function', 'functions', 'component', 'components',
  'page', 'pages', 'dashboard', 'admin', 'login', 'register', 'authentication',
  'payment', 'checkout', 'cart', 'product', 'products', 'service', 'services',
  'data', 'content', 'management', 'cms', 'crm', 'erp', 'saas', 'ecommerce',
  'marketplace', 'social', 'media', 'network', 'chat', 'messaging', 'notification',
  'email', 'sms', 'push', 'real', 'realtime', 'analytics', 'report', 'reports',
  'integration', 'automated', 'automation', 'workflow', 'process', 'task', 'tasks',
  'react', 'next', 'nextjs', 'node', 'nodejs', 'typescript', 'javascript', 'python',
  'java', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'native', 'cross',
  'responsive', 'secure', 'security', 'fast', 'performance', 'scalable', 'modern',
  'clean', 'minimal', 'simple', 'complex', 'enterprise', 'startup', 'business',
  'need', 'needs', 'want', 'wants', 'require', 'requires', 'should', 'must',
  'include', 'includes', 'allow', 'allows', 'enable', 'enables', 'support', 'supports'
]);

// Tech-related terms that indicate a valid software project
const PROJECT_KEYWORDS = new Set([
  'app', 'application', 'website', 'web', 'mobile', 'platform', 'system', 'software',
  'api', 'database', 'server', 'frontend', 'backend', 'fullstack', 'dashboard',
  'saas', 'ecommerce', 'marketplace', 'portal', 'tool', 'automation', 'bot',
  'extension', 'plugin', 'library', 'framework', 'sdk', 'cli', 'desktop',
  'chrome', 'browser', 'android', 'ios', 'native', 'hybrid', 'pwa',
  'microservice', 'monolith', 'serverless', 'cloud', 'deploy', 'hosting'
]);

/**
 * Calculate vowel ratio in text
 */
function getVowelRatio(text: string): number {
  const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanText.length === 0) return 0;
  
  const vowels = cleanText.match(/[aeiou]/g) || [];
  return vowels.length / cleanText.length;
}

/**
 * Check for excessive repeated characters
 */
function hasExcessiveRepeats(text: string): boolean {
  // Check for same character repeated 4+ times
  if (/(.)\1{3,}/i.test(text)) return true;
  
  // Check for same pattern repeated
  if (/(.{2,})\1{2,}/i.test(text)) return true;
  
  return false;
}

/**
 * Check for random consonant sequences (gibberish indicator)
 */
function hasRandomConsonantSequences(text: string): boolean {
  // Look for 5+ consecutive consonants (very rare in real words)
  const consonantSequence = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
  return consonantSequence.test(text.replace(/\s/g, ''));
}

/**
 * Count recognizable words in text
 */
function countRecognizableWords(text: string): { total: number; recognized: number } {
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
  
  const recognized = words.filter(word => COMMON_WORDS.has(word)).length;
  
  return { total: words.length, recognized };
}

/**
 * Main gibberish detection function
 */
export function isGibberish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  const cleanText = text.trim();
  
  // Check 1: Very low vowel ratio (< 10%)
  const vowelRatio = getVowelRatio(cleanText);
  if (vowelRatio < 0.10 && cleanText.length > 10) {
    return true;
  }
  
  // Check 2: Excessive repeated characters
  if (hasExcessiveRepeats(cleanText)) {
    return true;
  }
  
  // Check 3: Random consonant sequences
  if (hasRandomConsonantSequences(cleanText)) {
    return true;
  }
  
  // Check 4: Low ratio of recognizable words
  const { total, recognized } = countRecognizableWords(cleanText);
  if (total >= 3 && recognized / total < 0.3) {
    return true;
  }
  
  return false;
}

/**
 * Check if text contains project-related keywords
 */
export function containsProjectKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  return words.some(word => PROJECT_KEYWORDS.has(word.replace(/[^a-z]/g, '')));
}

/**
 * Validate project title
 */
export function isValidProjectTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: "Project title is required" };
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length < 5) {
    return { isValid: false, error: "Title must be at least 5 characters" };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: "Title must be less than 100 characters" };
  }
  
  return { isValid: true };
}

/**
 * Validate short description
 */
export function isValidShortDescription(description: string): ValidationResult {
  if (!description || description.trim().length === 0) {
    return { isValid: true }; // Optional field
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length < 10) {
    return { isValid: false, error: "Description must be at least 10 characters" };
  }
  
  if (trimmed.length > 150) {
    return { isValid: false, error: "Description must be less than 150 characters" };
  }
  
  return { isValid: true };
}

/**
 * Validate user story / project description
 */
export function isValidUserStory(userStory: string): ValidationResult {
  if (!userStory || userStory.trim().length === 0) {
    return { isValid: false, error: "Project description is required" };
  }
  
  const trimmed = userStory.trim();
  
  if (trimmed.length < 20) {
    return { isValid: false, error: "Description must be at least 20 characters." };
  }
  
  if (trimmed.length > 10000) {
    return { isValid: false, error: "Description must be less than 10,000 characters" };
  }
  
  // Advanced validation is now handled by AI
  
  return { isValid: true };
}

/**
 * Validate budget
 */
export function isValidBudget(budget: number | null | undefined): ValidationResult {
  if (budget === null || budget === undefined) {
    return { isValid: true }; // Optional field
  }
  
  if (typeof budget !== 'number' || isNaN(budget)) {
    return { isValid: false, error: "Budget must be a valid number" };
  }
  
  if (budget < 0) {
    return { isValid: false, error: "Budget cannot be negative" };
  }
  
  if (budget > 0 && budget < 50) {
    return { isValid: false, error: "Minimum budget is $50 for any project" };
  }
  
  if (budget > 1000000) {
    return { isValid: false, error: "Budget seems unrealistic. Please enter a valid amount." };
  }
  
  return { isValid: true };
}

/**
 * Validate a single tag
 */
function isValidTag(tag: string): boolean {
  const trimmed = tag.trim();
  if (trimmed.length < 2 || trimmed.length > 30) return false;
  if (isGibberish(trimmed)) return false;
  // Allow alphanumeric, dots, hashes, and plus (for tech names like C++, .NET, C#)
  if (!/^[a-zA-Z0-9.#+\-\s]+$/.test(trimmed)) return false;
  return true;
}

/**
 * Validate tags array
 */
export function isValidTags(tags: string[]): ValidationResult {
  if (!tags || tags.length === 0) {
    return { isValid: true }; // Optional field
  }
  
  if (tags.length > 10) {
    return { isValid: false, error: "Maximum 10 tags allowed" };
  }
  
  const invalidTags = tags.filter(tag => !isValidTag(tag));
  if (invalidTags.length > 0) {
    return { 
      isValid: false, 
      error: `Invalid tag: "${invalidTags[0]}". Tags must be 2-30 characters, alphanumeric.` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate required skills array
 */
export function isValidRequiredSkills(skills: string[]): ValidationResult {
  if (!skills || skills.length === 0) {
    return { isValid: true }; // Optional field
  }
  
  if (skills.length > 15) {
    return { isValid: false, error: "Maximum 15 skills allowed" };
  }
  
  const invalidSkills = skills.filter(skill => !isValidTag(skill)); // Same rules as tags
  if (invalidSkills.length > 0) {
    return { 
      isValid: false, 
      error: `Invalid skill: "${invalidSkills[0]}". Skills must be 2-30 characters.` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate attachments
 */
export function isValidAttachments(
  attachments: any[], 
  maxCount: number = 2, 
  maxSizeBytes: number = 5 * 1024 * 1024
): ValidationResult {
  if (!attachments || attachments.length === 0) {
    return { isValid: true };
  }
  
  if (attachments.length > maxCount) {
    return { isValid: false, error: `Maximum ${maxCount} attachments allowed` };
  }
  
  const oversized = attachments.find(a => a.size > maxSizeBytes);
  if (oversized) {
    return { 
      isValid: false, 
      error: `File "${oversized.name}" exceeds ${maxSizeBytes / (1024 * 1024)}MB limit` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate all project input fields at once
 */
export function validateProjectInput(data: ProjectInputData): ValidationErrors {
  const errors: ValidationErrors = {};
  
  const titleResult = isValidProjectTitle(data.title);
  if (!titleResult.isValid) {
    errors.title = titleResult.error;
  }
  
  if (data.shortDescription) {
    const shortDescResult = isValidShortDescription(data.shortDescription);
    if (!shortDescResult.isValid) {
      errors.shortDescription = shortDescResult.error;
    }
  }
  
  const userStoryResult = isValidUserStory(data.userStory);
  if (!userStoryResult.isValid) {
    errors.userStory = userStoryResult.error;
  }
  
  const budgetResult = isValidBudget(data.budget);
  if (!budgetResult.isValid) {
    errors.budget = budgetResult.error;
  }
  
  if (data.tags) {
    const tagsResult = isValidTags(data.tags);
    if (!tagsResult.isValid) {
      errors.tags = tagsResult.error;
    }
  }
  
  if (data.requiredSkills) {
    const skillsResult = isValidRequiredSkills(data.requiredSkills);
    if (!skillsResult.isValid) {
      errors.requiredSkills = skillsResult.error;
    }
  }
  
  if (data.attachments) {
    const attachmentsResult = isValidAttachments(data.attachments);
    if (!attachmentsResult.isValid) {
      errors.attachments = attachmentsResult.error;
    }
  }
  
  return errors;
}

/**
 * Check if there are any validation errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
