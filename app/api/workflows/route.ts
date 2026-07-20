import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = request.nextUrl.searchParams.get('tenant_id')
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workflow_templates')
    .select('*, template_steps(count)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tenant_id, name, description, logic_mode, is_default } = body

  if (!tenant_id || !name) {
    return NextResponse.json(
      { error: 'tenant_id and name are required' },
      { status: 400 }
    )
  }

  // If setting as default, unset other defaults
  if (is_default) {
    await supabase
      .from('workflow_templates')
      .update({ is_default: false })
      .eq('tenant_id', tenant_id)
  }

  const { data, error } = await supabase
    .from('workflow_templates')
    .insert({
      tenant_id,
      name,
      description: description || null,
      logic_mode: logic_mode || 'strict',
      is_default: is_default || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
