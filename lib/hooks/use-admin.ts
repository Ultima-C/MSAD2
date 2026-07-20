'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

// Fetch functions
const supabase = createClient()

interface AdminStats {
  totalTenants: number
  totalClients: number
  totalDocuments: number
  pendingDomains: number
  revenueByPlan: {
    starter: number
    professional: number
    enterprise: number
  }
}

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(
    'admin-stats',
    async () => {
      const { count: totalTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })

      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      const { count: pendingDomains } = await supabase
        .from('domain_requests')
        .select('*', { count: 'exact', head: true })
        .eq('dns_status', 'propagating')

      return {
        totalTenants: totalTenants || 0,
        totalClients: totalClients || 0,
        totalDocuments: totalDocuments || 0,
        pendingDomains: pendingDomains || 0,
        revenueByPlan: {
          starter: 15,
          professional: 8,
          enterprise: 2,
        },
      }
    },
    {
      revalidateOnFocus: true,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  }
}

export function useAdminTenants() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'admin-tenants',
    async () => {
      const { data: adminOverview, error } = await supabase
        .from('v_super_admin_overview')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!adminOverview) return []

      const tenantsWithStats = await Promise.all(
        adminOverview.map(async (tenant: any) => {
          const { count: docCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          return {
            ...tenant,
            clientCount: tenant.total_clients || 0,
            documentCount: docCount || 0,
            plan: tenant.plan_tier || 'starter',
          }
        })
      )

      return tenantsWithStats
    },
    {
      revalidateOnFocus: true,
    }
  )

  const updateTenantPlan = async (tenantId: string, plan: 'starter' | 'professional' | 'enterprise') => {
    const { error } = await supabase
      .from('tenants')
      .update({ plan_tier: plan })
      .eq('id', tenantId)

    if (error) throw error
    mutate()
  }

  const deleteTenant = async (tenantId: string) => {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) throw error
    mutate()
  }

  return {
    tenants: data || [],
    isLoading,
    error,
    updateTenantPlan,
    deleteTenant,
    mutate,
  }
}

export function useAdminDomains() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'admin-domains',
    async () => {
      const { data: requests, error } = await supabase
        .from('domain_requests')
        .select(`
          *,
          tenants (name)
        `)
        .order('requested_at', { ascending: false })

      if (error) throw error
      if (!requests) return []

      return requests.map((r: any) => ({
        id: r.id,
        domain: r.requested_domain,
        status: r.dns_status,
        tenantName: r.tenants?.name || 'Unknown Tenant',
        created_at: r.requested_at
      }))
    },
    {
      revalidateOnFocus: true,
    }
  )

  const approveDomain = async (domainId: string) => {
    const { error } = await supabase
      .from('domain_requests')
      .update({ dns_status: 'active', ssl_status: 'issued' })
      .eq('id', domainId)

    if (error) throw error
    mutate()
  }

  const rejectDomain = async (domainId: string) => {
    const { error } = await supabase
      .from('domain_requests')
      .update({ dns_status: 'error', ssl_status: 'failed' })
      .eq('id', domainId)

    if (error) throw error
    mutate()
  }

  const deleteDomain = async (domainId: string) => {
    const { error } = await supabase
      .from('domain_requests')
      .delete()
      .eq('id', domainId)

    if (error) throw error
    mutate()
  }

  return {
    domains: data || [],
    isLoading,
    error,
    approveDomain,
    rejectDomain,
    deleteDomain,
    mutate,
  }
}

export function useAdminTemplates() {
  const { data, error, isLoading, mutate } = useSWR(
    'admin-templates',
    async () => {
      const { data: templates, error } = await supabase
        .from('workflow_templates')
        .select(`
          *,
          tenants (name),
          workflow_steps (id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (templates || []).map((t: any) => ({
        ...t,
        tenantName: t.is_global ? 'Global System' : (t.tenants?.name || 'Unknown'),
        stepCount: t.workflow_steps?.length || 0,
      }))
    },
    {
      revalidateOnFocus: true,
    }
  )

  return {
    templates: data || [],
    isLoading,
    error,
    mutate,
  }
}