import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { token } = await params

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        brand_color
      ),
      client_tasks (*)
    `)
    .eq('portal_token', token)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
  }

  await supabase
    .from('clients')
    .update({ 
      started_at: client.started_at || new Date().toISOString(),
      status: client.status === 'invited' ? 'in_progress' : client.status
    })
    .eq('id', client.id)

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.full_name,
      email: client.email,
      status: client.status,
      completion_percentage: 0,
      logic_mode: 'parallel',
    },
    company: client.companies,
    tasks: client.client_tasks.sort((a: any, b: any) => a.step_order - b.step_order),
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const { token } = await params
  const body = await request.json()
  const { task_id, status, response_data } = body

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('portal_token', token)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
  }

  const updateData: Record<string, any> = { status }
  if (response_data) {
    updateData.response_data = response_data
  }
  if (status === 'complete') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error: taskError } = await supabase
    .from('client_tasks')
    .update(updateData)
    .eq('id', task_id)
    .eq('client_id', client.id)

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 })
  }

  const { data: allTasks } = await supabase
    .from('client_tasks')
    .select('status')
    .eq('client_id', client.id)

  if (allTasks) {
    const completed = allTasks.filter((t: any) => t.status === 'complete').length
    const percentage = Math.round((completed / allTasks.length) * 100)
    
    await supabase
      .from('clients')
      .update({ 
        completion_percentage: percentage,
        status: percentage === 100 ? 'awaiting_review' : 'in_progress'
      })
      .eq('id', client.id)
  }

  return NextResponse.json({ success: true })
}