import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * updateSession — pattern chuẩn từ Supabase docs.
 * - Refresh auth token tự động
 * - Set cookies đúng options (Supabase tự xử)
 * - Trả về { supabase, response, user } để middleware root dùng tiếp cho route guard
 *
 * Quy tắc vàng: KHÔNG tạo NextResponse mới rồi copy cookies. Phải reuse `supabaseResponse` này.
 */
export async function updateSession(request: NextRequest, baseResponse?: NextResponse) {
  let supabaseResponse =
    baseResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // QUAN TRỌNG: getUser() bắt buộc, không dùng getSession() để protect
  // Theo docs: getSession() KHÔNG verify token, getUser() có call về Supabase Auth verify
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, response: supabaseResponse, user };
}