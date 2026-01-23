import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // On prépare la réponse de redirection
  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // ✅ Next donne les cookies via l'en-tête "cookie"
          const cookieHeader = request.headers.get("cookie") ?? "";
          return cookieHeader
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const [name, ...rest] = c.split("=");
              return { name, value: rest.join("=") };
            });
        },
        setAll(cookiesToSet) {
          // ✅ IMPORTANT : écrit la session dans les cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}