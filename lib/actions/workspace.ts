'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { IndustryType } from '@/lib/types/database'

// Global workflow templates that get seeded for each new workspace
const GLOBAL_WORKFLOW_TEMPLATES: Record<IndustryType, { name: string; description: string; steps: { name: string; description: string; step_type: string; is_required: boolean }[] }[]> = {
  legal: [
    {
      name: 'Legal Client Onboarding',
      description: 'Standard onboarding workflow for legal clients',
      steps: [
        { name: 'Engagement Letter', description: 'Sign the engagement letter', step_type: 'signature_upload', is_required: true },
        { name: 'Client Intake Form', description: 'Complete client information form', step_type: 'form', is_required: true },
        { name: 'ID Verification', description: 'Upload government-issued ID', step_type: 'file_upload', is_required: true },
        { name: 'Retainer Payment', description: 'Submit initial retainer payment', step_type: 'payment', is_required: true },
        { name: 'Initial Consultation', description: 'Schedule your first consultation', step_type: 'scheduling', is_required: true },
      ],
    },
    {
      name: 'Document Collection',
      description: 'Collect necessary legal documents from clients',
      steps: [
        { name: 'Proof of Identity', description: 'Upload valid ID documents', step_type: 'file_upload', is_required: true },
        { name: 'Proof of Address', description: 'Upload utility bill or bank statement', step_type: 'file_upload', is_required: true },
        { name: 'Supporting Documents', description: 'Upload any additional relevant documents', step_type: 'file_upload', is_required: false },
      ],
    },
  ],
  creative: [
    {
      name: 'Creative Project Onboarding',
      description: 'Onboard new creative project clients',
      steps: [
        { name: 'Project Brief', description: 'Complete the project brief questionnaire', step_type: 'form', is_required: true },
        { name: 'Brand Assets', description: 'Upload your brand guidelines and assets', step_type: 'file_upload', is_required: true },
        { name: 'Contract Signature', description: 'Sign the project agreement', step_type: 'signature_upload', is_required: true },
        { name: 'Deposit Payment', description: 'Submit project deposit (50%)', step_type: 'payment', is_required: true },
        { name: 'Kickoff Call', description: 'Schedule the project kickoff meeting', step_type: 'scheduling', is_required: true },
      ],
    },
    {
      name: 'Freelancer Onboarding',
      description: 'Onboard freelance collaborators',
      steps: [
        { name: 'Portfolio Submission', description: 'Submit your portfolio link', step_type: 'form', is_required: true },
        { name: 'NDA Signature', description: 'Sign non-disclosure agreement', step_type: 'signature_upload', is_required: true },
        { name: 'Tax Documents', description: 'Upload W9 or equivalent tax form', step_type: 'file_upload', is_required: true },
        { name: 'Payment Setup', description: 'Complete payment information', step_type: 'form', is_required: true },
      ],
    },
  ],
  financial: [
    {
      name: 'Financial Client Onboarding',
      description: 'Standard onboarding for financial advisory clients',
      steps: [
        { name: 'KYC Form', description: 'Complete Know Your Customer form', step_type: 'form', is_required: true },
        { name: 'ID Verification', description: 'Upload government ID and proof of address', step_type: 'file_upload', is_required: true },
        { name: 'Risk Assessment', description: 'Complete risk tolerance questionnaire', step_type: 'form', is_required: true },
        { name: 'Service Agreement', description: 'Sign the service agreement', step_type: 'signature_upload', is_required: true },
        { name: 'Bank Statements', description: 'Upload recent bank statements', step_type: 'file_upload', is_required: true },
        { name: 'Initial Consultation', description: 'Book your first consultation', step_type: 'scheduling', is_required: true },
      ],
    },
    {
      name: 'Business Account Setup',
      description: 'Onboard business clients',
      steps: [
        { name: 'Business Registration', description: 'Upload business registration documents', step_type: 'file_upload', is_required: true },
        { name: 'Authorized Signers', description: 'Submit authorized signer information', step_type: 'form', is_required: true },
        { name: 'Corporate Resolution', description: 'Upload corporate resolution document', step_type: 'file_upload', is_required: true },
        { name: 'Agreement Signature', description: 'Sign business account agreement', step_type: 'signature_upload', is_required: true },
      ],
    },
  ],
  general: [
    {
      name: 'Standard Client Onboarding',
      description: 'General purpose client onboarding workflow',
      steps: [
        { name: 'Welcome Form', description: 'Complete the welcome questionnaire', step_type: 'form', is_required: true },
        { name: 'Service Agreement', description: 'Review and sign service agreement', step_type: 'signature_upload', is_required: true },
        { name: 'Document Upload', description: 'Upload any required documents', step_type: 'file_upload', is_required: false },
        { name: 'Initial Payment', description: 'Complete initial payment', step_type: 'payment', is_required: true },
        { name: 'Onboarding Call', description: 'Schedule your onboarding call', step_type: 'scheduling', is_required: true },
      ],
    },
    {
      name: 'Quick Start',
      description: 'Minimal onboarding for fast setup',
      steps: [
        { name: 'Basic Information', description: 'Provide basic contact information', step_type: 'form', is_required: true },
        { name: 'Agreement', description: 'Accept terms and conditions', step_type: 'signature_upload', is_required: true },
      ],
    },
  ],
}

export interface ProvisionWorkspaceInput {
  name: string
  slug: string
  industry: IndustryType
  default_logic_mode: 'strict' | 'parallel'
  brand_color?: string
}

export interface ProvisionWorkspaceResult {
  success: boolean
  tenantId?: string
  error?: string
}

export async function provisionWorkspace(input: ProvisionWorkspaceInput): Promise<ProvisionWorkspaceResult> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if slug is already taken
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existingTenant) {
    return { success: false, error: 'This workspace URL is already taken. Please choose another.' }
  }

  // Create the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: input.name,
      slug: input.slug,
      owner_id: user.id,
      industry: input.industry,
      default_logic_mode: input.default_logic_mode,
      brand_color: input.brand_color || '#2563EB',
      plan: 'starter',
    })
    .select()
    .single()

  if (tenantError) {
    console.error('[provisionWorkspace] Tenant creation error:', tenantError)
    return { success: false, error: tenantError.message }
  }

  // Verify the trigger added the user as owner in team_members
  // This is critical - the RLS SELECT policy on tenants depends on this row existing
  const { data: memberCheck, error: memberError } = await supabase
    .from('team_members')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (memberError || !memberCheck) {
    // If trigger didn't fire, manually insert the team_members row
    console.warn('[provisionWorkspace] Trigger did not create team_members row, inserting manually')
    const { error: manualInsertError } = await supabase
      .from('team_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      })

    if (manualInsertError) {
      console.error('[provisionWorkspace] Failed to create team_members row:', manualInsertError)
      // Clean up the orphaned tenant
      await supabase.from('tenants').delete().eq('id', tenant.id)
      return { success: false, error: 'Failed to assign workspace owner. Please try again.' }
    }
  }

  // Now seed the workflow templates for this industry
  const templates = GLOBAL_WORKFLOW_TEMPLATES[input.industry] || GLOBAL_WORKFLOW_TEMPLATES.general

  for (const template of templates) {
    // Create the workflow template
    const { data: workflowTemplate, error: templateError } = await supabase
      .from('workflow_templates')
      .insert({
        tenant_id: tenant.id,
        name: template.name,
        description: template.description,
        logic_mode: input.default_logic_mode,
        is_default: templates.indexOf(template) === 0, // First template is default
      })
      .select()
      .single()

    if (templateError) {
      console.error('[provisionWorkspace] Template creation error:', templateError)
      continue // Continue with other templates even if one fails
    }

    // Create the template steps
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i]
      await supabase
        .from('template_steps')
        .insert({
          template_id: workflowTemplate.id,
          name: step.name,
          description: step.description,
          step_type: step.step_type,
          step_order: i + 1,
          is_required: step.is_required,
        })
    }
  }

  // Revalidate all dashboard paths with layout to clear cache globally
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/configurator', 'layout')
  revalidatePath('/dashboard/settings', 'layout')

  return { success: true, tenantId: tenant.id }
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  return !data // Returns true if slug is available (no tenant found)
}
