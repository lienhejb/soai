'use server';

import { createClient } from '@/lib/supabase/server';

// ============ Types ============

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  gender: string | null;
  birth_year: number | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  so_count: number;
  voice_count: number;
  dynamic_count: number;
}

export interface AdminUserDetail extends AdminUserRow {
  address: string | null;
  locale: string;
  country_code: string;
  timezone: string;
  default_voice_id: string | null;
  onboarded_at: string | null;
  updated_at: string;
  voice_profiles: Array<{
    id: string;
    display_name: string;
    provider: string;
    status: string;
    visibility: string;
    created_at: string;
  }>;
  recent_renders: Array<{
    id: string;
    template_title: string | null;
    template_slug: string | null;
    voice_key: string;
    duration_ms: number | null;
    created_at: string;
  }>;
}

export interface AdminUserStats {
  total_users: number;
  total_admins: number;
  new_7d: number;
  new_30d: number;
}

// ============ Actions ============

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Không có quyền admin');
  return supabase;
}

/**
 * List toàn bộ user + stats. Phase 1 không paginate (chỉ 2-vài chục user).
 */
export async function listUsersWithStats(): Promise<AdminUserRow[]> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from('admin_users_view')
    .select('id, email, display_name, phone, gender, birth_year, role, created_at, last_sign_in_at, last_active_at, so_count, voice_count, dynamic_count')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listUsersWithStats: ${error.message}`);
  return (data ?? []) as AdminUserRow[];
}

/**
 * Stats tổng cho 4 cards trên đầu page.
 */
export async function getAdminUserStats(): Promise<AdminUserStats> {
  const supabase = await assertAdmin();

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  // Đếm song song
  const [totalRes, adminRes, new7Res, new30Res] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
  ]);

  return {
    total_users: totalRes.count ?? 0,
    total_admins: adminRes.count ?? 0,
    new_7d: new7Res.count ?? 0,
    new_30d: new30Res.count ?? 0,
  };
}

/**
 * Chi tiết 1 user — cho drawer 3 chấm.
 */
export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const supabase = await assertAdmin();

  const { data: row, error: rowErr } = await supabase
    .from('admin_users_view')
    .select('*')
    .eq('id', userId)
    .single();

  if (rowErr) throw new Error(`getUserDetail (view): ${rowErr.message}`);
  if (!row) throw new Error('Không tìm thấy user');

  // Voice profiles
  const { data: voices } = await supabase
    .from('voice_profiles')
    .select('id, display_name, provider, status, visibility, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Rendered audio gần đây (10 mục) + JOIN templates để có title/slug
  const { data: renders } = await supabase
    .from('user_rendered_audio')
    .select(`
      id, voice_key, duration_ms, created_at,
      template:templates(title, slug)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  type RenderRow = {
    id: string;
    voice_key: string;
    duration_ms: number | null;
    created_at: string;
    template: { title: string | null; slug: string | null } | null;
  };

  const recent_renders = ((renders ?? []) as unknown as RenderRow[]).map((r) => ({
    id: r.id,
    template_title: r.template?.title ?? null,
    template_slug: r.template?.slug ?? null,
    voice_key: r.voice_key,
    duration_ms: r.duration_ms,
    created_at: r.created_at,
  }));

  return {
    ...(row as AdminUserDetail),
    voice_profiles: voices ?? [],
    recent_renders,
  };
}