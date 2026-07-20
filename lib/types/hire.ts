export type MilestoneTargetDay = 30 | 60 | 90;
export type HireTaskStatus = 'todo' | 'in_progress' | 'done';

export interface HireMilestone {
  id: string;
  client_id: string;
  company_id: string;
  title: string;
  description: string | null;
  target_day: MilestoneTargetDay;
  completed_at: string | null;
  created_at: string;
}

export interface CompanyHubContact {
  name: string;
  role: string;
  email: string;
}

export interface CompanyHubLink {
  label: string;
  url: string;
}

export interface CompanyHubConfig {
  id: string;
  company_id: string;
  client_id: string;
  welcome_headline: string | null;
  welcome_message: string | null;
  contacts: CompanyHubContact[];
  links: CompanyHubLink[];
  notes: string | null;
  updated_at: string;
}

export interface HireTask {
  id: string;
  client_id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: HireTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export type HireActionResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string };