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

  // Migrate draft nếu có
  if (draft) {
    const userId = data.user.id;

    // 1. Update profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        display_name: draft.owner_name || null,
        address: draft.address || null,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileErr) {
      console.error('[migrate] profile update failed:', profileErr);
      return { ok: false, error: 'Lỗi lưu hồ sơ Tín chủ' };
    }

    // 2. Bulk insert people (Hương linh)
    if (draft.ancestors && draft.ancestors.length > 0) {
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
  } else {
    // Không có draft — vẫn mark onboarded nếu chưa
    await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return { ok: true };
}