// app/api/auth/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*, companies(name, brand_color)')
      .eq('temp_password', code.trim().toUpperCase())
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    return NextResponse.json({ 
      clientId: client.id,
      email: client.email, 
      name: client.companies?.name || "Organization",
      primaryColor: client.companies?.brand_color || "#0F766E"
    });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}