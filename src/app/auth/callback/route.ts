import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token");
  const type = (url.searchParams.get("type") ?? "magiclink") as
    | "magiclink"
    | "recovery"
    | "invite"
    | "email_change";

  const origin = url.origin;

  // réponse de base (on la modifie avec cookies)
  const response = NextResponse.redirect(new URL("/dashboard", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // ✅ Flow moderne (code)
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return response;
    }

    // ✅ Flow token (magic link "verify")
    if (token) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type,
      });

      if (error) {
        return NextResponse.redirect(new URL("/login?error=otp", origin));
      }

      return response;
    }

    // Aucun paramètre attendu
    return NextResponse.redirect(new URL("/login", origin));
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback", origin));
  }
}