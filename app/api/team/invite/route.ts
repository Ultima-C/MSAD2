// Imports
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Route Handlers
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { company_id, email, role } = body

  if (!company_id || !email || !role) {
    return NextResponse.json(
      { error: 'company_id, email, and role are required' },
      { status: 400 }
    )
  }

  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('company_id', company_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('company_id', company_id)
    .eq('user_id', (
      await supabase.from('auth.users').select('id').eq('email', email).single()
    ).data?.id)
    .single()

  if (existingMember) {
    return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
  }

  const { data: existingInvite } = await supabase
    .from('invite_tokens')
    .select('id')
    .eq('company_id', company_id)
    .eq('email', email)
    .is('accepted_at', null)
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('invite_tokens')
    .insert({
      company_id,
      email,
      role,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  const inviteUrl = `${request.nextUrl.origin}/invite/${invite.token}`
  
  return NextResponse.json({ invite, inviteUrl }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inviteId = request.nextUrl.searchParams.get('id')
  if (!inviteId) {
    return NextResponse.json({ error: 'invite id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('invite_tokens')
    .delete()
    .eq('id', inviteId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}