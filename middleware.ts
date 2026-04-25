//middleware.ts

import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { updateSession } from './lib/supabase/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/calendar', '/so', '/voice', '/profile', '/admin'];

function stripLocale(pathname: string): { locale: string; path: string } {
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    return {
      locale: maybeLocale,
      path: '/' + segments.slice(1).join('/'),
    };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  // Bước 1: i18n trước (rewrite locale prefix nếu cần)
  const intlResponse = intlMiddleware(request);

  const { locale, path } = stripLocale(request.nextUrl.pathname);
  const isProtected = matchPath(path, PROTECTED_PATHS);

  // Public route → trả intlResponse, không đụng auth
  if (!isProtected) {
    return intlResponse;
  }

  // Bước 2: refresh session (pass intlResponse làm base để giữ headers từ intl)
  const { supabase, response, user } = await updateSession(request, intlResponse);

  // Bước 3: route guards
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/gia-dao`;
    // Dùng NextResponse.redirect copy cookies từ response (chuẩn pattern)
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c);
    });
    return redirect;
  }

  // Admin guard + onboarded check — gộp 1 query duy nhất
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarded_at')
    .eq('id', user.id)
    .single();

  if (isAdminPath && profile?.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (!profile?.onboarded_at) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/gia-dao`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};