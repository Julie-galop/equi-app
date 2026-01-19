import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // On prépare une response mutable pour que Supabase puisse écrire les cookies si besoin
  const response = NextResponse.next();
  if (pathname.startsWith("/auth/callback")) return response;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ 1) Racine du site : "/" -> login si pas connecté, sinon dashboard
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // ✅ 2) Routes protégées : si pas connecté -> /login
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/horses");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ 3) Optionnel : si connecté et va sur /login -> /dashboard
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

// On applique le middleware sur "/" + pages protégées + /login
export const config = {
  matcher: ["/", "/dashboard/:path*", "/horses/:path*", "/login"],
};