import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Redirect về gia-dao (public, có nút "Đăng nhập")
  const url = new URL('/vi/gia-dao', request.url);
  return NextResponse.redirect(url, { status: 303 });
}