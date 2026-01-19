import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type VaccType = "GRIPPE" | "RHINO";

export async function POST(req: Request) {
  // ✅ Next 15/16 : cookies() est ASYNC
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // ✅ IMPORTANT : on laisse Supabase écrire ses cookies si besoin
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // ✅ sécurité : si pas loggé, stop
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      affixe,
      name,
      sire,
      dam,
      damSire,
      birthMode,
      birthdate,
      birthYear,
      vaccinations,
    } = body as {
      affixe: string;
      name: string;
      sire: string | null;
      dam: string | null;
      damSire: string | null;
      birthMode: "FULL" | "YEAR";
      birthdate: string | null;
      birthYear: number | null;
      vaccinations: { type: VaccType; date: string }[];
    };

    if (!name?.trim()) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
    if (!affixe?.trim()) return NextResponse.json({ error: "Affixe obligatoire" }, { status: 400 });

    const { data: horseInserted, error: horseErr } = await supabase
      .from("horses")
      .insert({
        name: name.trim(),
        affixe: affixe.trim(),
        sire: sire?.trim() || null,
        dam: dam?.trim() || null,
        dam_sire: damSire?.trim() || null,
        birthdate: birthMode === "FULL" ? birthdate : null,
        birth_year: birthMode === "YEAR" ? birthYear : null,
      })
      .select("id")
      .single();

    if (horseErr) return NextResponse.json({ error: horseErr.message }, { status: 500 });

    const horseId = horseInserted.id as string;

    if (Array.isArray(vaccinations) && vaccinations.length > 0) {
      const rows = vaccinations.map(v => ({
        horse_id: horseId,
        type: v.type,
        date: v.date,
      }));

      const { error: vaccErr } = await supabase.from("vaccinations").insert(rows);
      if (vaccErr) return NextResponse.json({ error: vaccErr.message }, { status: 500 });
    }

    return NextResponse.json({ horseId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur inconnue" }, { status: 500 });
  }
}