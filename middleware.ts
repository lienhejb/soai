import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes cần đăng nhập
const PROTECTED_PATHS = ['/dashboard', '/calendar', '/so', '/voice', '/profile'];
// Routes onboarding (đã login nhưng chưa hoàn tất)
const ONBOARDING_PATHS = ['/gia-dao'];
// Routes auth (chưa login)
const AUTH_PATHS = ['/auth/login', '/auth/verify'];

function stripLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && routing.locales.includes(segments[0] as (typeof routing.locales)[number])) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  // 1. Chạy i18n middleware trước — xử lý locale redirect
  const response = intlMiddleware(request);

  // 2. Setup Supabase client với cookies
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

  // 3. Lấy session
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Logic redirect
  const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
  const pathWithoutLocale = stripLocale(request.nextUrl.pathname);

  const isProtected = matchPath(pathWithoutLocale, PROTECTED_PATHS);
  const isOnboarding = matchPath(pathWithoutLocale, ONBOARDING_PATHS);
  const isAuth = matchPath(pathWithoutLocale, AUTH_PATHS);

  // Chưa login + vào protected/onboarding → redirect login
  if (!user && (isProtected || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  // Đã login + vào trang auth → redirect về dashboard
  if (user && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Đã login + vào protected → kiểm tra onboarded
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

  // Đã login + đã onboarded + vào onboarding → về dashboard
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