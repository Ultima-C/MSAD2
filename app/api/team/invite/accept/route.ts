import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  // Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('invite_tokens')
    .select('*, tenants(*)')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  // Check if invite is expired
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
  }

  // Check if email matches
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address' },
      { status: 403 }
    )
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('tenant_id', invite.tenant_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // Mark invite as accepted even if already a member
    await supabase
      .from('invite_tokens')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Already a member',
      tenant: invite.tenants 
    })
  }

  // Add user as team member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      tenant_id: invite.tenant_id,
      user_id: user.id,
      role: invite.role,
      invited_by: invite.invited_by,
    })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Mark invite as accepted
  await supabase
    .from('invite_tokens')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ 
    success: true, 
    tenant: invite.tenants,
    role: invite.role 
  })
}
