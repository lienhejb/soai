'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateProfileInput {
  display_name: string;
  gender: 'male' | 'female' | null;
  birth_year: number | null;
  address: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.display_name || null,
      gender: input.gender,
      birth_year: input.birth_year,
      address: input.address || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('[updateProfile]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/vi/dashboard');
  revalidatePath('/vi/profile');
  return { ok: true };
}

/**
 * Partial update — dùng cho popup biến trong template.
 * Chỉ update field nào có giá trị (không null hoá field khác).
 */
interface UpdateProfilePartialInput {
  display_name?: string;
  address?: string;
  ceremony_address?: string;
}

export async function updateMyProfilePartial(
  input: UpdateProfilePartialInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const updates: Record<string, string> = {};
  if (input.display_name?.trim()) updates.display_name = input.display_name.trim();
  if (input.address?.trim()) updates.address = input.address.trim();
  if (input.ceremony_address?.trim()) updates.ceremony_address = input.ceremony_address.trim();

  if (Object.keys(updates).length === 0) return { ok: true };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('[updateMyProfilePartial]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/vi/dashboard');
  return { ok: true };
}