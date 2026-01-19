import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type Body = {
  horse_id: string;
  type: 'GRIPPE' | 'RHINO';
  date: string; // YYYY-MM-DD
  note?: string | null;
};

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // 🔒 validations
    if (!body?.horse_id) {
      return NextResponse.json({ error: 'horse_id manquant' }, { status: 400 });
    }
    if (!body?.type || !['GRIPPE', 'RHINO'].includes(body.type)) {
      return NextResponse.json({ error: 'Type de vaccin invalide' }, { status: 400 });
    }
    if (!body?.date) {
      return NextResponse.json({ error: 'Date obligatoire' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('vaccinations')
      .insert({
        horse_id: body.horse_id,
        type: body.type,
        date: body.date,
        note: body.note ?? null,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Server error' },
      { status: 500 }
    );
  }
}