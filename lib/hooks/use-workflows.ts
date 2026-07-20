'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/providers'
import type { 
  WorkflowTemplate, 
  WorkflowTemplateWithSteps, 
  TemplateStep,
  CreateWorkflowTemplateInput,
  CreateTemplateStepInput 
} from '@/lib/types/database'

const supabase = createClient()

export function useWorkflows() {
  const { tenant } = useTenant()

  const { data, error, isLoading, mutate } = useSWR(
    tenant ? `workflows-${tenant.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as WorkflowTemplate[]
    },
    {
      revalidateOnFocus: true,
    }
  )

  const createWorkflow = async (input: CreateWorkflowTemplateInput) => {
    const { data: newWorkflow, error } = await supabase
      .from('workflow_templates')
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    await mutate()
    return { data: newWorkflow as WorkflowTemplate, error: null }
  }

  const updateWorkflow = async (id: string, updates: Partial<WorkflowTemplate>) => {
    const { error } = await supabase
      .from('workflow_templates')
      .update(updates)
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const deleteWorkflow = async (id: string) => {
    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const setDefaultWorkflow = async (id: string) => {
    // First, unset all other defaults
    await supabase
      .from('workflow_templates')
      .update({ is_default: false })
      .eq('tenant_id', tenant!.id)

    // Then set this one as default
    const { error } = await supabase
      .from('workflow_templates')
      .update({ is_default: true })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  return {
    workflows: data || [],
    isLoading,
    error: error?.message,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setDefaultWorkflow,
    refresh: mutate,
  }
}

export function useWorkflow(workflowId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    workflowId ? `workflow-${workflowId}` : null,
    async () => {
      const { data: workflow, error: workflowError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', workflowId!)
        .single()

      if (workflowError) throw workflowError

      const { data: steps } = await supabase
        .from('template_steps')
        .select('*')
        .eq('template_id', workflowId!)
        .order('step_order', { ascending: true })

      return {
        ...workflow,
        steps: steps || [],
      } as WorkflowTemplateWithSteps
    },
    {
      revalidateOnFocus: true,
    }
  )

  const addStep = async (input: CreateTemplateStepInput) => {
    const { data: newStep, error } = await supabase
      .from('template_steps')
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    await mutate()
    return { data: newStep as TemplateStep, error: null }
  }

  const updateStep = async (stepId: string, updates: Partial<TemplateStep>) => {
    const { error } = await supabase
      .from('template_steps')
      .update(updates)
      .eq('id', stepId)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const deleteStep = async (stepId: string) => {
    const { error } = await supabase
      .from('template_steps')
      .delete()
      .eq('id', stepId)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const reorderSteps = async (stepIds: string[]) => {
    const updates = stepIds.map((id, index) => ({
      id,
      step_order: index + 1,
    }))

    for (const update of updates) {
      await supabase
        .from('template_steps')
        .update({ step_order: update.step_order })
        .eq('id', update.id)
    }

    await mutate()
    return { error: null }
  }

  return {
    workflow: data || null,
    isLoading,
    error: error?.message,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    refresh: mutate,
  }
}
