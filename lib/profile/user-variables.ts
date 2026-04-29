'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Map các cột trong `profiles` table vs các biến nằm trong `user_variables`.
 * Biến nào KHÔNG thuộc set này → sẽ lưu vào user_variables.
 */
const PROFILE_COLUMNS = new Set([
  'display_name',
  'address',
  'ceremony_address',
  'birth_year',
  'gender',
  'house_direction',
  'business_name',
  'dong_tho_address',
]);

/**
 * Map từ variable key → tên cột trong profiles (nếu khác).
 * Vd: biến key 'owner_name' → cột profiles.display_name.
 */
const VAR_KEY_TO_PROFILE_COL: Record<string, string> = {
  owner_name: 'display_name',
};

function mapVarKeyToProfileCol(key: string): string | null {
  if (VAR_KEY_TO_PROFILE_COL[key]) return VAR_KEY_TO_PROFILE_COL[key];
  if (PROFILE_COLUMNS.has(key)) return key;
  return null; // không thuộc profiles
}

/**
 * Fetch toàn bộ user_variables của user → map { key: value }.
 * Server-side. Trả {} nếu guest hoặc không có biến nào.
 */
export async function getUserVariables(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('user_variables')
    .select('variable_key, variable_value')
    .eq('user_id', user.id);

  if (error) {
    console.error('[getUserVariables]', error);
    return {};
  }

  return Object.fromEntries(
    (data ?? []).map((r) => [r.variable_key, r.variable_value])
  );
}

/**
 * Save biến user nhập từ popup. Tự phân loại:
 *  - Key match cột profiles → UPDATE profiles
 *  - Key khác → UPSERT user_variables
 *
 * Bỏ qua key có value rỗng/whitespace.
 */
export async function saveUserVariables(
  vars: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const profileUpdates: Record<string, string> = {};
  const userVariableRows: Array<{ user_id: string; variable_key: string; variable_value: string }> = [];

  for (const [key, value] of Object.entries(vars)) {
    if (!value || !value.trim()) continue;
    const trimmed = value.trim();

    const profileCol = mapVarKeyToProfileCol(key);
    if (profileCol) {
      profileUpdates[profileCol] = trimmed;
    } else {
      userVariableRows.push({
        user_id: user.id,
        variable_key: key,
        variable_value: trimmed,
      });
    }
  }

  // 1. Update profiles
  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);
    if (error) {
      console.error('[saveUserVariables/profiles]', error);
      return { ok: false, error: error.message };
    }
  }

  // 2. Upsert user_variables
  if (userVariableRows.length > 0) {
    const { error } = await supabase
      .from('user_variables')
      .upsert(userVariableRows, { onConflict: 'user_id,variable_key' });
    if (error) {
      console.error('[saveUserVariables/user_variables]', error);
      return { ok: false, error: error.message };
    }
  }

  revalidatePath('/vi/dashboard');
  return { ok: true };
}