'use server';

import { createClient } from '@/lib/supabase/server';
import type { DraftData } from '@/lib/draft';

/**
 * Gửi OTP qua email
 */
export async function sendOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Email không hợp lệ' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Xác minh OTP + migrate draft nếu có
 */
export async function verifyOtp(
  email: string,
  token: string,
  draft: DraftData | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });

  if (error || !data.user) {
  return { ok: false, error: error?.message || 'Mã không đúng hoặc đã hết hạn' };
}

const userId = data.user.id;

  // ===== DB là tối cao =====
  // Check profile đã tồn tại chưa. Nếu có → giữ nguyên, bỏ qua toàn bộ draft.
  const { data: existingProfile, error: checkErr } = await supabase
    .from('profiles')
    .select('id, onboarded_at')
    .eq('id', userId)
    .maybeSingle();

  if (checkErr) {
    console.error('[auth] profile check failed:', checkErr);
    return { ok: false, error: 'Lỗi kiểm tra hồ sơ' };
  }

  // User CŨ (profile đã tồn tại) → giữ nguyên tuyệt đối, bỏ qua draft
  if (existingProfile) {
    // Edge case: user cũ chưa hoàn tất onboarding → chỉ set timestamp
    if (!existingProfile.onboarded_at) {
      await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', userId);
    }
    return { ok: true };
  }

  // User MỚI → tạo profile từ draft (nếu có)
  const profileInsert: Record<string, unknown> = {
    id: userId,
    onboarded_at: new Date().toISOString(),
  };

  if (draft?.owner_name?.trim()) profileInsert.display_name = draft.owner_name.trim();
  if (draft?.address?.trim()) profileInsert.address = draft.address.trim();
  if (draft?.gender) profileInsert.gender = draft.gender;

  const { error: insertErr } = await supabase.from('profiles').insert(profileInsert);
  if (insertErr) {
    console.error('[auth] profile insert failed:', insertErr);
    return { ok: false, error: 'Lỗi tạo hồ sơ' };
  }

  // Migrate people (gia tiên) cho user mới
  if (draft?.ancestors && draft.ancestors.length > 0) {
    const { error: peopleErr } = await supabase.from('people').insert(
      draft.ancestors.map((a) => ({
        user_id: userId,
        full_name: a.full_name,
        relationship: a.relationship,
        status: 'deceased' as const,
        death_date: a.death_date || null,
        is_lunar_death: a.is_lunar,
        is_leap_month_death: a.is_leap_month,
      }))
    );

    if (peopleErr) {
      console.error('[migrate] people insert failed:', peopleErr);
      return { ok: false, error: 'Lỗi lưu Hương linh' };
    }
  }

  return { ok: true };
}