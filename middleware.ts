import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/calendar', '/so', '/voice', '/profile', '/admin'];
const ONBOARDING_PATHS: string[] = []; // Bỏ trống — /gia-dao giờ public cho guest

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

function redirectWithCookies(url: URL, response: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => {
    redirect.cookies.set(c.name, c.value);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const { locale, path } = stripLocale(request.nextUrl.pathname);

  const isProtected = matchPath(path, PROTECTED_PATHS);
  const isOnboarding = matchPath(path, ONBOARDING_PATHS);

  // Public routes (landing, try, api...) → không check auth
  if (!isProtected && !isOnboarding) {
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
    const persistentOptions = {
      ...options,
      maxAge: options.maxAge ?? 60 * 60 * 24 * 30, // 30 ngày
      sameSite: options.sameSite ?? 'lax' as const,
    };
    request.cookies.set(name, value);
    response.cookies.set(name, value, persistentOptions);
  });
},
      },
    }
  );

  await supabase.auth.getSession();  // ← thêm dòng này TRƯỚC
const { data: { user } } = await supabase.auth.getUser();

// ← THÊM BLOCK NÀY
// Chưa login + vào protected → redirect gia-dao
if (!user && isProtected) {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/gia-dao`;
  return redirectWithCookies(url, response);
}

// Check admin role cho /admin/*
const isAdminPath = path === '/admin' || path.startsWith('/admin/');
if (user && isAdminPath) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return redirectWithCookies(url, response);
  }
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
      return redirectWithCookies(url, response);
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
      return redirectWithCookies(url, response);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};