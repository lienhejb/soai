'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { splitTemplate, findStaleSegmentIndices, extractVariableKeys } from './split-template';
import type { RequiredVariable } from './preset-variables';
import { revalidatePath } from 'next/cache';

const STATIC_BUCKET = 'audio-static';

// ============ TYPES ============

export type Frequency = 'monthly' | 'yearly' | 'rare' | 'other';

export interface TemplateInput {
  title: string;
  slug: string;
  category: string;          // free-text, vd "Gia tiên", "Thần tài"
  purpose?: string;           // optional, legacy
  frequency: Frequency;
  content: string;
  required_variables: RequiredVariable[];
  is_featured?: boolean;
}

export interface TemplateListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  frequency: Frequency;
  is_active: boolean;
  is_featured: boolean;
  segment_count: number;
  audio_status: VoiceAudioStatus[];
}

export interface VoiceAudioStatus {
  voice_key: string;
  voice_label: string;
  ready_count: number;       // segments static có audio
  total_static: number;      // tổng segments static template này
  is_complete: boolean;       // ready_count === total_static
}

export interface ActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

// ============ AUTH HELPER ============

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' as string };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Không có quyền admin' as string };
  }

  return { ok: true, supabase, user };
}

// ============ LIST ============

/**
 * Lấy danh sách templates kèm audio status per voice.
 * Dùng cho trang admin list.
 */
export async function listTemplatesWithStatus(): Promise<ActionResult<TemplateListItem[]>> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.supabase) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  // Fetch templates
  const { data: templates, error: tErr } = await supabase
    .from('templates')
    .select('id, slug, title, category, frequency, is_active, is_featured')
    .eq('locale', 'vi')
    .order('created_at', { ascending: false });

  if (tErr) return { ok: false, error: tErr.message };
  if (!templates || templates.length === 0) return { ok: true, data: [] };

  // Fetch all system_voices (active)
  const { data: voices } = await supabase
    .from('system_voices')
    .select('voice_key, display_name')
    .eq('is_active', true)
    .order('sort_order');

  const voiceList = voices ?? [];

  // Fetch all segments (count static per template)
  const templateIds = templates.map((t) => t.id);
  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, template_id, segment_type')
    .in('template_id', templateIds);

  // Fetch all static_audio for these segments
  const segmentIds = (segments ?? []).map((s) => s.id);
  const { data: audioRows } = await supabase
    .from('static_audio')
    .select('segment_id, voice_key')
    .in('segment_id', segmentIds);

  // Compute status per template
  const result: TemplateListItem[] = templates.map((tmpl) => {
    const tmplSegments = (segments ?? []).filter((s) => s.template_id === tmpl.id);
    const staticSegIds = tmplSegments.filter((s) => s.segment_type === 'static').map((s) => s.id);

    const audio_status: VoiceAudioStatus[] = voiceList.map((v) => {
      const ready = (audioRows ?? []).filter(
        (a) => a.voice_key === v.voice_key && staticSegIds.includes(a.segment_id)
      ).length;
      return {
        voice_key: v.voice_key,
        voice_label: v.display_name,
        ready_count: ready,
        total_static: staticSegIds.length,
        is_complete: staticSegIds.length > 0 && ready === staticSegIds.length,
      };
    });

    return {
      id: tmpl.id,
      slug: tmpl.slug,
      title: tmpl.title,
      category: tmpl.category,
      frequency: tmpl.frequency,
      is_active: tmpl.is_active,
      is_featured: tmpl.is_featured,
      segment_count: tmplSegments.length,
      audio_status,
    };
  });

  return { ok: true, data: result };
}

// ============ GET ONE ============

export interface TemplateDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  frequency: Frequency;
  content: string;            // composed lại từ segments
  required_variables: RequiredVariable[];
  is_active: boolean;
  is_featured: boolean;
  segments: Array<{
    id: string;
    order_index: number;
    segment_type: 'static' | 'dynamic';
    text: string;
    text_hash: string;
  }>;
}

/**
 * Lấy chi tiết 1 template (cho form edit).
 * Compose lại `content` từ segments để admin edit ở 1 textarea.
 */
export async function getTemplate(id: string): Promise<ActionResult<TemplateDetail>> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.supabase) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const { data: tmpl, error: tErr } = await supabase
    .from('templates')
    .select('id, slug, title, category, frequency, required_variables, is_active, is_featured')
    .eq('id', id)
    .single();

  if (tErr || !tmpl) return { ok: false, error: tErr?.message ?? 'Template không tồn tại' };

  const { data: segments, error: sErr } = await supabase
    .from('template_segments')
    .select('id, order_index, segment_type, text, text_hash')
    .eq('template_id', id)
    .order('order_index');

  if (sErr) return { ok: false, error: sErr.message };

  // Compose content = nối các segment.text theo order_index, ngăn cách " " (space)
  const content = (segments ?? [])
    .map((s) => s.text)
    .join(' ');

  return {
    ok: true,
    data: {
      id: tmpl.id,
      slug: tmpl.slug,
      title: tmpl.title,
      category: tmpl.category,
      frequency: tmpl.frequency as Frequency,
      content,
      required_variables: (tmpl.required_variables ?? []) as RequiredVariable[],
      is_active: tmpl.is_active,
      is_featured: tmpl.is_featured,
      segments: (segments ?? []).map((s) => ({
        id: s.id,
        order_index: s.order_index,
        segment_type: s.segment_type as 'static' | 'dynamic',
        text: s.text,
        text_hash: s.text_hash,
      })),
    },
  };
}

// ============ CREATE ============

/**
 * Tạo template mới + auto-split content thành segments.
 */
export async function createTemplate(input: TemplateInput): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.supabase || !auth.user) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  // Validate
  const validation = validateInput(input);
  if (!validation.ok) return { ok: false, error: validation.error };

  // Check slug unique
  const { data: existing } = await supabase
    .from('templates')
    .select('id')
    .eq('slug', input.slug)
    .eq('locale', 'vi')
    .maybeSingle();

  if (existing) return { ok: false, error: `Slug "${input.slug}" đã tồn tại` };

  // Insert template
  const { data: tmpl, error: tErr } = await supabase
    .from('templates')
    .insert({
      slug: input.slug,
      locale: 'vi',
      title: input.title,
      category: input.category,
      purpose: input.purpose ?? null,
      frequency: input.frequency,
      content: input.content,        // lưu raw content cho legacy /api/tts
      required_variables: input.required_variables,
      is_featured: input.is_featured ?? false,
      is_active: true,
      created_by: 'admin',
    })
    .select('id')
    .single();

  if (tErr || !tmpl) return { ok: false, error: tErr?.message ?? 'Tạo template thất bại' };

  // Auto-split + insert segments
  const splitResult = splitTemplate(input.content);
  if (splitResult.length === 0) {
    // Rollback template (xóa)
    await supabase.from('templates').delete().eq('id', tmpl.id);
    return { ok: false, error: 'Content rỗng hoặc không tách được segment' };
  }

  const segmentRows = splitResult.map((s) => ({
    template_id: tmpl.id,
    order_index: s.order_index,
    segment_type: s.segment_type,
    text: s.text,
    text_hash: s.text_hash,
    required_variables: extractVariableKeys(s.text),
  }));

  const { error: sErr } = await supabase.from('template_segments').insert(segmentRows);
  if (sErr) {
    await supabase.from('templates').delete().eq('id', tmpl.id);
    return { ok: false, error: `Lỗi tạo segments: ${sErr.message}` };
  }

  revalidatePath('/vi/admin/templates');
  return { ok: true, data: { id: tmpl.id } };
}

// ============ UPDATE ============

/**
 * Update template với smart diff:
 * - So sánh segments cũ vs mới (text_hash)
 * - Nếu count khác → nuke + rebuild
 * - Nếu count match → chỉ update segments stale
 * - Stale segments → xóa static_audio cũ (regen sau qua admin gen)
 */
export async function updateTemplate(
  id: string,
  input: TemplateInput
): Promise<ActionResult<{ stale_segments: number[] }>> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.supabase) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const validation = validateInput(input);
  if (!validation.ok) return { ok: false, error: validation.error };

  // Fetch segments cũ
  const { data: oldSegments } = await supabase
    .from('template_segments')
    .select('id, order_index, segment_type, text, text_hash')
    .eq('template_id', id)
    .order('order_index');

  if (!oldSegments) return { ok: false, error: 'Không tìm thấy segments cũ' };

  // Split content mới
  const newSegments = splitTemplate(input.content);
  if (newSegments.length === 0) {
    return { ok: false, error: 'Content rỗng hoặc không tách được segment' };
  }

  // Update template metadata
  const { error: tErr } = await supabase
    .from('templates')
    .update({
      title: input.title,
      category: input.category,
      purpose: input.purpose ?? null,
      frequency: input.frequency,
      content: input.content,
      required_variables: input.required_variables,
      is_featured: input.is_featured ?? false,
    })
    .eq('id', id);

  if (tErr) return { ok: false, error: tErr.message };

  // Smart diff
  const countMatch = oldSegments.length === newSegments.length;
  let staleIndices: number[];

  if (countMatch) {
    // Same count → diff theo order_index
    staleIndices = findStaleSegmentIndices(oldSegments, newSegments);
  } else {
    // Count khác → nuke all (toàn bộ stale)
    staleIndices = newSegments.map((s) => s.order_index);
  }

  if (countMatch && staleIndices.length === 0) {
    // Không có segment nào đổi → chỉ update metadata, segments giữ nguyên
    revalidatePath('/vi/admin/templates');
    return { ok: true, data: { stale_segments: [] } };
  }

  // Xóa static_audio của các segment_id stale (nếu count match)
  if (countMatch) {
    const staleSegmentIds = oldSegments
      .filter((s) => staleIndices.includes(s.order_index))
      .map((s) => s.id);

    if (staleSegmentIds.length > 0) {
      await deleteStaticAudioForSegments(supabase, staleSegmentIds);
    }

    // Update text + text_hash của các segment stale
    for (const newSeg of newSegments) {
      if (!staleIndices.includes(newSeg.order_index)) continue;
      const oldSeg = oldSegments.find((s) => s.order_index === newSeg.order_index);
      if (!oldSeg) continue;

      await supabase
        .from('template_segments')
        .update({
          segment_type: newSeg.segment_type,
          text: newSeg.text,
          text_hash: newSeg.text_hash,
          required_variables: extractVariableKeys(newSeg.text),
        })
        .eq('id', oldSeg.id);
    }
  } else {
    // Count khác → nuke segments cũ + insert mới
    const allOldIds = oldSegments.map((s) => s.id);
    await deleteStaticAudioForSegments(supabase, allOldIds);

    await supabase.from('template_segments').delete().eq('template_id', id);

    const newRows = newSegments.map((s) => ({
      template_id: id,
      order_index: s.order_index,
      segment_type: s.segment_type,
      text: s.text,
      text_hash: s.text_hash,
      required_variables: extractVariableKeys(s.text),
    }));

    const { error: insErr } = await supabase.from('template_segments').insert(newRows);
    if (insErr) return { ok: false, error: `Lỗi insert segments mới: ${insErr.message}` };
  }

  // Invalidate user_rendered_audio của template này (vì segments fingerprint sẽ đổi)
  await supabase.from('user_rendered_audio').delete().eq('template_id', id);

  revalidatePath('/vi/admin/templates');
  return { ok: true, data: { stale_segments: staleIndices } };
}

// ============ DELETE ============

/**
 * Soft delete: set is_active = false.
 * Hard delete (purge audio + segments) là action riêng để cẩn trọng.
 */
export async function deleteTemplate(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.supabase) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const { error } = await supabase
    .from('templates')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/vi/admin/templates');
  return { ok: true };
}

// ============ HELPERS ============

function validateInput(input: TemplateInput): { ok: boolean; error?: string } {
  if (!input.title?.trim()) return { ok: false, error: 'Thiếu tiêu đề' };
  if (!input.slug?.trim()) return { ok: false, error: 'Thiếu slug' };
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return { ok: false, error: 'Slug chỉ chứa a-z, 0-9, dấu gạch ngang' };
  }
  if (!input.content?.trim()) return { ok: false, error: 'Thiếu nội dung' };
  if (!['monthly', 'yearly', 'rare', 'other'].includes(input.frequency)) {
    return { ok: false, error: 'Frequency không hợp lệ' };
  }

  // Check biến trong content phải khớp với required_variables declare
  const contentVars = extractVariableKeys(input.content);
  const declaredKeys = new Set(input.required_variables.map((v) => v.key));
  const undeclared = contentVars.filter((k) => !declaredKeys.has(k));
  if (undeclared.length > 0) {
    return {
      ok: false,
      error: `Biến chưa khai báo: ${undeclared.map((k) => `{{${k}}}`).join(', ')}`,
    };
  }

  return { ok: true };
}

/**
 * Xóa static_audio + Storage files cho list segment_ids.
 * Dùng khi update template có segment stale.
 */
async function deleteAllAudioForSegments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  segmentIds: string[]
): Promise<void> {
  if (segmentIds.length === 0) return;
  const admin = createAdminClient();

  // 1. Static audio: xóa Storage + DB
  const { data: staticAudios } = await supabase
    .from('static_audio')
    .select('segment_id, voice_key')
    .in('segment_id', segmentIds);

  if (staticAudios && staticAudios.length > 0) {
    const staticPaths = staticAudios.map((a) => `${a.segment_id}/${a.voice_key}.mp3`);
    await admin.storage.from(STATIC_BUCKET).remove(staticPaths);
  }
  await supabase.from('static_audio').delete().in('segment_id', segmentIds);

  // 2. Dynamic audio: chỉ xóa DB (Storage path có user_id, không enumerate được hết)
  // Phase 2: cron job dọn orphan dynamic files
  await supabase.from('dynamic_audio').delete().in('segment_id', segmentIds);
}