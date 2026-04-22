import { createClient } from './supabase/server';
import { redirect } from '@/i18n/navigation';

/**
 * Lấy user hiện tại (null nếu chưa login)
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Lấy user + profile (null nếu chưa login)
 */
export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

/**
 * Bắt buộc phải login — redirect nếu chưa
 * Dùng trong Server Component của route protected
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/auth/login', locale: 'vi' });
  }
  return user!;
}