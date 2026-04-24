'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SystemVoice {
  id: string;
  voice_key: string;
  display_name: string;
  description: string | null;
  gender: 'male' | 'female';
  provider_voice_id: string | null;
  preview_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function updateSystemVoice(
  id: string,
  input: {
    display_name?: string;
    description?: string;
    provider_voice_id?: string;
    preview_url?: string;
    is_active?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Không có quyền admin' };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.display_name !== undefined) updates.display_name = input.display_name;
  if (input.description !== undefined) updates.description = input.description || null;
  if (input.provider_voice_id !== undefined) updates.provider_voice_id = input.provider_voice_id || null;
  if (input.preview_url !== undefined) updates.preview_url = input.preview_url || null;
  if (input.is_active !== undefined) updates.is_active = input.is_active;

  const { error } = await supabase
    .from('system_voices')
    .update(updates)
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/vi/admin');
  return { ok: true };
}