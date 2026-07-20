// Imports
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Handlers
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, inviteCode } = await request.json()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, company_id, status')
      .eq('email', email)
      .eq('temp_password', inviteCode.toUpperCase())
      .is('user_id', null)
      .single()

    console.log("DEBUG [Backend]: Fetched Client Record:", client)
    console.log("DEBUG [Backend]: Client Error:", clientError)

    if (clientError || !client) {
      return NextResponse.json({ error: "Invalid, used, or expired invite code" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName,
        is_candidate: true
      }
    })

    if (authError) {
      console.error("DEBUG [Backend]: Auth Creation Error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        user_id: authData.user.id,
        full_name: fullName,
        temp_password: null 
      })
      .eq('id', client.id)

    if (updateError) {
      console.error("DEBUG [Backend]: Client Update Error:", updateError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('candidate_access_tokens')
      .insert({
        candidate_id: client.id,
        company_id: client.company_id
      })
      .select('token')
      .single()

    if (tokenError) {
      console.error("DEBUG [Backend]: Token Generation Error:", tokenError)
    }

    const finalResponsePayload = { 
      success: true, 
      token: tokenData?.token,
      status: client.status
    }
    
    console.log("DEBUG [Backend]: Final Response Payload:", finalResponsePayload)

    return NextResponse.json(finalResponsePayload)

  } catch (err: any) {
    console.error("DEBUG [Backend]: Catch Block Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}