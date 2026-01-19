import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 🔎 Debug: on marque que le middleware est passé
  res.headers.set('x-mw', '1')

  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Routes publiques (accessibles sans être connecté)
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/manifest.json',
    '/favicon.ico',
    '/icon-192.png',
    '/icon-512.png',
    '/logo-appli.png',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // ✅ Pas connecté -> on force /login
  if (!session && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  // ✅ matcher simple & fiable (le filtre assets se fait dans le code)
  matcher: ['/:path*'],
}