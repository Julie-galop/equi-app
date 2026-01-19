import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type Body = {
  horse_id: string;
  type: "GRIPPE" | "RHINO";
  date: string; // YYYY-MM-DD
  note?: string | null;
};

export async function POST(req: Request) {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // 🔐 user obligatoire (sinon RLS bloque)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Body;

    // ✅ validations
    if (!body?.horse_id) {
      return NextResponse.json({ error: "horse_id manquant" }, { status: 400 });
    }
    if (!body?.type || !["GRIPPE", "RHINO"].includes(body.type)) {
      return NextResponse.json({ error: "Type de vaccin invalide" }, { status: 400 });
    }
    if (!body?.date) {
      return NextResponse.json({ error: "Date obligatoire" }, { status: 400 });
    }

    const { error } = await supabase.from("vaccinations").insert({
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
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}