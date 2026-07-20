import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*, client_tasks(*)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  
  const { data, error } = await supabase
    .from('clients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch the client to get their auth.users ID
    const { data: clientData, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // 2. Delete the Auth User (Cascade will automatically delete the clients row)
    if (clientData.user_id) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        clientData.user_id
      )

      if (deleteAuthError) {
        return NextResponse.json({ error: deleteAuthError.message }, { status: 400 })
      }
    } else {
      // Fallback: If they were added before auth integration, just delete the row
      const { error: dbError } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id)

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
