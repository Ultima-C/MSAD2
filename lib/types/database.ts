// Onboardly Database Types

// Enums
export type PlanTier = 'starter' | 'professional' | 'enterprise'
export type LogicGateMode = 'strict' | 'parallel'
export type ClientStatus = 'invited' | 'in_progress' | 'awaiting_review' | 'complete'
export type TaskStatus = 'locked' | 'pending' | 'in_progress' | 'complete' | 'verified'
export type StepType = 'signature_upload' | 'form' | 'file_upload' | 'payment' | 'scheduling' | 'custom'
export type IndustryType = 'legal' | 'creative' | 'financial' | 'general'
export type NotificationType = 'portal_link_sent' | 'task_completed' | 'onboarding_complete' | 'reminder_sent'
export type SSLStatus = 'pending' | 'issued' | 'failed'
export type DNSStatus = 'propagating' | 'active' | 'error'
export type TeamRole = 'owner' | 'admin' | 'hr_manager' | 'support' | 'viewer'

// Database Tables
export interface Tenant {
  id: string
  owner_id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string
  plan: PlanTier
  default_logic_mode: LogicGateMode
  industry: IndustryType
  max_clients: number
  created_at: string
  updated_at: string
}

export interface WorkflowTemplate {
  id: string
  tenant_id: string
  name: string
  description: string | null
  logic_mode: LogicGateMode
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface TemplateStep {
  id: string
  template_id: string
  name: string
  description: string | null
  step_type: StepType
  step_order: number
  is_required: boolean
  config: Record<string, unknown>
  created_at: string
}

export interface Client {
  id: string
  tenant_id: string
  template_id: string | null
  email: string
  name: string
  company_name: string | null
  phone: string | null
  status: ClientStatus
  portal_token: string
  logic_mode: LogicGateMode
  completion_percentage: number
  invited_at: string
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ClientTask {
  id: string
  client_id: string
  template_step_id: string | null
  name: string
  description: string | null
  step_type: StepType
  step_order: number
  status: TaskStatus
  is_required: boolean
  config: Record<string, unknown>
  response_data: Record<string, unknown>
  completed_at: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  task_id: string | null
  tenant_id: string
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  uploaded_at: string
  created_at: string
}

export interface Notification {
  id: string
  tenant_id: string
  client_id: string | null
  type: NotificationType
  title: string
  message: string | null
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface DomainRequest {
  id: string
  tenant_id: string
  domain: string
  ssl_status: SSLStatus
  dns_status: DNSStatus
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface SuperAdmin {
  id: string
  user_id: string
  email: string
  created_at: string
}

export interface TeamMember {
  id: string
  tenant_id: string
  user_id: string
  role: TeamRole
  invited_by: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export interface InviteToken {
  id: string
  tenant_id: string
  email: string
  role: TeamRole
  token: string
  invited_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface ClientPortal {
  id: string
  client_id: string
  token: string
  is_active: boolean
  last_accessed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface ClientWithTasks extends Client {
  tasks: ClientTask[]
}

export interface ClientWithTemplate extends Client {
  template: WorkflowTemplate | null
}

export interface TenantWithClients extends Tenant {
  clients: Client[]
}

export interface WorkflowTemplateWithSteps extends WorkflowTemplate {
  steps: TemplateStep[]
}

export interface TeamMemberWithUser extends TeamMember {
  user_email: string
  user_name?: string
}

export interface InviteTokenWithTenant extends InviteToken {
  tenant: Tenant
}

export interface TenantWithRole extends Tenant {
  role: TeamRole
}

// Form types
export interface CreateTenantInput {
  name: string
  slug: string
  logo_url?: string
  brand_color?: string
  plan?: PlanTier
  default_logic_mode?: LogicGateMode
  industry?: IndustryType
}

export interface CreateClientInput {
  tenant_id: string
  template_id?: string
  email: string
  name: string
  company_name?: string
  phone?: string
  logic_mode?: LogicGateMode
}

export interface CreateWorkflowTemplateInput {
  tenant_id: string
  name: string
  description?: string
  logic_mode?: LogicGateMode
  is_default?: boolean
}

export interface CreateTemplateStepInput {
  template_id: string
  name: string
  description?: string
  step_type: StepType
  step_order: number
  is_required?: boolean
  config?: Record<string, unknown>
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Dashboard Stats
export interface TenantStats {
  totalClients: number
  activeClients: number
  completedClients: number
  averageCompletionTime: number // in days
  completionRate: number // percentage
}

export interface SuperAdminStats {
  totalTenants: number
  totalClients: number
  activeTenants: number
  pendingDomainRequests: number
  revenueByPlan: Record<PlanTier, number>
}
