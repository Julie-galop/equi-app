import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type Body = { id: string };

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.id) return NextResponse.json({ error: 'Missing vaccination id' }, { status: 400 });

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('vaccinations')
      .delete()
      .eq('id', body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}