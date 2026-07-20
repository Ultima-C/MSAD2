'use client'

import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { TeamMember, TeamMemberWithUser, InviteToken, TeamRole } from '@/lib/types/database'

const supabase = createClient()

// Fetch team members for a tenant
async function fetchTeamMembers(tenantId: string): Promise<TeamMemberWithUser[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      user:auth.users!user_id (
        email,
        raw_user_meta_data
      )
    `)
    .eq('tenant_id', tenantId)
    .order('joined_at', { ascending: true })

  if (error) throw error

  return (data || []).map((member: any) => ({
    ...member,
    user_email: member.user?.email || 'Unknown',
    user_name: member.user?.raw_user_meta_data?.full_name || member.user?.raw_user_meta_data?.name,
  }))
}

// Fetch pending invites for a tenant
async function fetchInvites(tenantId: string): Promise<InviteToken[]> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export function useTeamMembers(tenantId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    tenantId ? `team-members-${tenantId}` : null,
    () => fetchTeamMembers(tenantId!),
    {
      revalidateOnFocus: true,
    }
  )

  const updateMemberRole = async (memberId: string, newRole: TeamRole) => {
    if (!tenantId) return

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) throw error
    mutate(`team-members-${tenantId}`)
  }

  const removeMember = async (memberId: string) => {
    if (!tenantId) return

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
    mutate(`team-members-${tenantId}`)
  }

  return {
    members: data || [],
    isLoading,
    error,
    updateMemberRole,
    removeMember,
  }
}

export function useTeamInvites(tenantId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    tenantId ? `team-invites-${tenantId}` : null,
    () => fetchInvites(tenantId!),
    {
      revalidateOnFocus: true,
    }
  )

  const sendInvite = async (email: string, role: TeamRole) => {
    if (!tenantId) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('invite_tokens')
      .insert({
        tenant_id: tenantId,
        email,
        role,
        invited_by: userData.user.id,
      })

    if (error) throw error
    mutate(`team-invites-${tenantId}`)
  }

  const revokeInvite = async (inviteId: string) => {
    if (!tenantId) return

    const { error } = await supabase
      .from('invite_tokens')
      .delete()
      .eq('id', inviteId)

    if (error) throw error
    mutate(`team-invites-${tenantId}`)
  }

  const resendInvite = async (inviteId: string) => {
    if (!tenantId) return

    // Update expires_at to extend the invite
    const { error } = await supabase
      .from('invite_tokens')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', inviteId)

    if (error) throw error
    mutate(`team-invites-${tenantId}`)
    // TODO: Send email notification
  }

  return {
    invites: data || [],
    isLoading,
    error,
    sendInvite,
    revokeInvite,
    resendInvite,
  }
}

// Hook to accept an invite
export function useAcceptInvite() {
  const acceptInvite = async (token: string) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    // Find the invite by token
    const { data: invite, error: fetchError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !invite) {
      throw new Error('Invalid or expired invite')
    }

    // Check if user email matches invite email
    if (userData.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error('This invite was sent to a different email address')
    }

    // Add user as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        tenant_id: invite.tenant_id,
        user_id: userData.user.id,
        role: invite.role,
        invited_by: invite.invited_by,
      })

    if (memberError) {
      if (memberError.code === '23505') {
        throw new Error('You are already a member of this team')
      }
      throw memberError
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from('invite_tokens')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (updateError) throw updateError

    return invite.tenant_id
  }

  const getInviteDetails = async (token: string) => {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select(`
        *,
        tenant:tenants (
          id,
          name,
          logo_url
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .single()

    if (error) throw error
    return data
  }

  return { acceptInvite, getInviteDetails }
}

// Hook to get user's tenants with their roles
export function useUserTenants() {
  const fetchUserTenants = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return []

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        role,
        tenant:tenants (*)
      `)
      .eq('user_id', userData.user.id)

    if (error) throw error

    return (data || []).map((item: any) => ({
      ...item.tenant,
      role: item.role,
    }))
  }

  const { data, error, isLoading } = useSWR('user-tenants', fetchUserTenants, {
    revalidateOnFocus: true,
  })

  return {
    tenants: data || [],
    isLoading,
    error,
  }
}

// Permission helper functions
export const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ['manage_team', 'manage_billing', 'manage_settings', 'manage_clients', 'view_clients', 'manage_workflows', 'view_workflows', 'manage_vault', 'view_vault'],
  admin: ['manage_team', 'manage_settings', 'manage_clients', 'view_clients', 'manage_workflows', 'view_workflows', 'manage_vault', 'view_vault'],
  hr_manager: ['manage_clients', 'view_clients', 'manage_workflows', 'view_workflows', 'view_vault'],
  support: ['view_clients', 'view_workflows', 'view_vault'],
  viewer: ['view_clients', 'view_workflows'],
}

export function hasPermission(role: TeamRole | undefined, permission: string): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

export function canManageRole(currentRole: TeamRole, targetRole: TeamRole): boolean {
  const roleHierarchy: Record<TeamRole, number> = {
    owner: 5,
    admin: 4,
    hr_manager: 3,
    support: 2,
    viewer: 1,
  }
  return roleHierarchy[currentRole] > roleHierarchy[targetRole]
}
