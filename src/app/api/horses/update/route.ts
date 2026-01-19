import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // important (évite edge)

type Body = {
  id: string;
  name: string;
  affixe: string;
  sire?: string | null;
  dam?: string | null;
  dam_sire?: string | null;
  birthdate?: string | null; // YYYY-MM-DD ou null
  birth_year?: number | null;
};

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.id) {
      return NextResponse.json({ error: 'Missing horse id' }, { status: 400 });
    }
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    }
    if (!body?.affixe?.trim()) {
      return NextResponse.json({ error: "L'affixe est obligatoire." }, { status: 400 });
    }

    // Nettoyage naissance (cohérence)
    const payload: any = {
      name: body.name.trim(),
      affixe: body.affixe.trim(),
      sire: body.sire ?? null,
      dam: body.dam ?? null,
      dam_sire: body.dam_sire ?? null,
      birthdate: body.birthdate ?? null,
      birth_year: body.birth_year ?? null,
    };

    // Si birthdate est rempli => birth_year null (optionnel mais propre)
    if (payload.birthdate) payload.birth_year = null;
    // Si birth_year est rempli => birthdate null
    if (payload.birth_year) payload.birthdate = null;

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from('horses')
      .update(payload)
      .eq('id', body.id)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}