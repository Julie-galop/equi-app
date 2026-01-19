import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");

  // Sécurité : s'il n'y a pas de code, retour login
  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  // On prépare la réponse de redirection finale
  const response = NextResponse.redirect(
    new URL("/dashboard", url.origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ cookies lus depuis NextRequest (FIABLE)
        getAll() {
          return request.cookies.getAll();
        },
        // ✅ cookies écrits sur la réponse (OBLIGATOIRE)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 🔑 échange le code contre une session (pose les cookies)
  await supabase.auth.exchangeCodeForSession(code);

  return response;
}