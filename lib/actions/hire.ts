'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  HireMilestone, 
  CompanyHubConfig, 
  HireTask, 
  HireActionResult,
  HireTaskStatus
} from '@/lib/types/hire'

export async function markCandidateAsHired(clientId: string): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('clients')
    .update({ 
      status: 'hired', 
      hired_at: new Date().toISOString() 
    })
    .eq('id', clientId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/tenantdashboard')
  revalidatePath('/clientdashboard')
  return { success: true, data: null }
}

export async function upsertCompanyHub(
  clientId: string, 
  payload: Partial<CompanyHubConfig>
): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Get company_id from client
  const { data: client } = await supabase
    .from('clients')
    .select('company_id')
    .eq('id', clientId)
    .single()

  if (!client) return { success: false, error: 'Client not found' }

  const { data, error } = await supabase
    .from('company_hub_config')
    .upsert({
      client_id: clientId,
      company_id: client.company_id,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'client_id' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data }
}

export async function addHireMilestone(
  clientId: string, 
  payload: Partial<HireMilestone>
): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: client } = await supabase
    .from('clients')
    .select('company_id')
    .eq('id', clientId)
    .single()

  if (!client) return { success: false, error: 'Client not found' }

  const { data, error } = await supabase
    .from('hire_milestones')
    .insert({
      client_id: clientId,
      company_id: client.company_id,
      ...payload
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data }
}

export async function deleteHireMilestone(milestoneId: string): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('hire_milestones')
    .delete()
    .eq('id', milestoneId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data: null }
}

export async function addHireTask(
  clientId: string, 
  payload: Partial<HireTask>
): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: client } = await supabase
    .from('clients')
    .select('company_id')
    .eq('id', clientId)
    .single()

  if (!client) return { success: false, error: 'Client not found' }

  const { data, error } = await supabase
    .from('hire_tasks')
    .insert({
      client_id: clientId,
      company_id: client.company_id,
      ...payload
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data }
}

export async function deleteHireTask(taskId: string): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('hire_tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data: null }
}

export async function markCandidateWelcomed(clientId: string): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('clients')
    .update({ welcomed_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data: null }
}

export async function updateHireTaskStatus(
  taskId: string, 
  status: HireTaskStatus
): Promise<HireActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const updateData: any = { status }
  if (status === 'done') {
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_at = null
  }

  const { data, error } = await supabase
    .from('hire_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/clientdashboard')
  return { success: true, data }
}

export async function updateCandidateProfile(
  clientId: string,
  payload: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  }
): Promise<HireActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // 1. Update Supabase Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      email: payload.email,
      data: { 
        full_name: payload.fullName,
        avatar_url: payload.avatarUrl 
      }
    });

    if (authError) throw authError;

    // 2. Update clients table
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        full_name: payload.fullName,
        email: payload.email,
        avatar_url: payload.avatarUrl
      })
      .eq('id', clientId);

    if (clientError) {
      console.warn("Could not update avatar_url in clients table (column might be missing), but Auth metadata was updated.");
    }

    revalidatePath('/clientdashboard');
    return { success: true, data: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}