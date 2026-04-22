import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/calendar', '/so', '/voice', '/profile'];
const ONBOARDING_PATHS: string[] = []; // Bỏ trống — /gia-dao giờ public cho guest
const AUTH_PATHS = ['/auth/login', '/auth/verify', '/auth/callback'];

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
  const response = intlMiddleware(request);

  const { locale, path } = stripLocale(request.nextUrl.pathname);

  const isProtected = matchPath(path, PROTECTED_PATHS);
  const isOnboarding = matchPath(path, ONBOARDING_PATHS);
  const isAuth = matchPath(path, AUTH_PATHS);

  // Public routes (landing, try, api...) → không check auth
  if (!isProtected && !isOnboarding && !isAuth) {
    return response;
  }

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Chưa login + vào protected/onboarding → redirect login
  if (!user && (isProtected || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  // Đã login + vào auth → redirect dashboard
  if (user && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Đã login + vào protected → check onboarded
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/gia-dao`;
      return NextResponse.redirect(url);
    }
  }

  // Đã login + đã onboarded + vào onboarding → dashboard
  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();

    if (profile?.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};