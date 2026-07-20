// Imports
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Handlers
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = request.nextUrl.searchParams.get('tenant_id')
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*, client_tasks(count)')
    .eq('company_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, companyId, isInstantHire, selectedTrack } = body

    // 1. Log what the API actually received
    console.log("API Received payload:", { email, companyId, isInstantHire, selectedTrack });

    if (!companyId || !email) {
      return NextResponse.json(
        { error: 'companyId and email are required. Check your frontend props.' },
        { status: 400 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const magicCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const tempFullName = email.split('@')[0]
    
    const insertPayload = {
      company_id: companyId,
      full_name: tempFullName,
      email: email,
      status: isInstantHire ? 'hired' : 'pending',
      hired_at: isInstantHire ? new Date().toISOString() : null,
      assigned_track_id: selectedTrack || null,   
      temp_password: magicCode,
    }
    
    const { data: client, error: clientError } = await supabaseAdmin 
      .from('clients')
      .insert(insertPayload)
      .select()
      .single()

    // 2. Log exact Supabase failures to your VSCode Terminal
    if (clientError) {
      console.error("Supabase Database Error:", clientError)
      return NextResponse.json({ error: clientError.message }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Onboarding Invitation Code',
      html: `
        <h2>Welcome!</h2>
        <p>You have been invited to onboard.</p>
        <p>Your magic login code is: <strong>${magicCode}</strong></p>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ client, magicCode }, { status: 201 })

  } catch (err: any) {
    console.error("Internal API Catch Error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}