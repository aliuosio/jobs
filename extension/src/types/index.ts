export type TabId = 'job-links' | 'forms-helper';

// ============================================
// JobLink - Represents a job posting URL
// ============================================
export type JobStatus = 'applied' | 'in_progress' | 'not_applied';

export interface JobLink {
  id: string;
  url: string;
  title: string;
  company: string;
  status: JobStatus;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// FormField - Represents a detected form field
// ============================================
export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  value?: string;
  filled: boolean;
  detectedAt: string;
}

// ============================================
// UserProfile - User's resume data
// ============================================
export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

// ============================================
// APIResponse - Standard API response wrapper
// ============================================
export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================
// Extension-specific types
// ============================================
export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

export interface DetectionResult {
  url: string;
  fields: FormField[];
}

export interface FillResult {
  success: boolean;
  filledCount: number;
  errors: string[];
}