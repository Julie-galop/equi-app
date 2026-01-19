import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: horse, error } = await supabase
      .from("horses")
      .select("id, name, affixe, sire, dam, dam_sire, birthdate, birth_year")
      .eq("id", id)
      .single();

    if (error || !horse) {
      return NextResponse.json(
        { error: error?.message ?? "Cheval introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ horse });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur." },
      { status: 500 }
    );
  }
}