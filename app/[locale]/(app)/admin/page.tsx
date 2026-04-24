import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminTemplateCard } from './_components/AdminTemplateCard';
import { VoiceManager } from './_components/VoiceManager';
import type { SystemVoice } from '@/lib/admin/voice-actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/vi/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/vi/dashboard');

  // Fetch system voices
  const { data: systemVoices } = await supabase
    .from('system_voices')
    .select('*')
    .order('sort_order');

  // Fetch templates + segments
  const { data: templates } = await supabase
    .from('templates')
    .select(`
      id,
      slug,
      title,
      purpose,
      is_active,
      template_segments (
        id,
        order_index,
        segment_type,
        text
      )
    `)
    .eq('locale', 'vi')
    .order('slug');

  // Fetch static_audio aggregated
  const { data: audioRows } = await supabase
    .from('static_audio')
    .select(`
      voice_key,
      segment_id,
      template_segments!inner(template_id)
    `);

  const statusMap = new Map<string, Map<string, number>>();
  for (const row of audioRows ?? []) {
    const tmplId = (row.template_segments as unknown as { template_id: string }).template_id;
    if (!statusMap.has(tmplId)) statusMap.set(tmplId, new Map());
    const voiceMap = statusMap.get(tmplId)!;
    voiceMap.set(row.voice_key, (voiceMap.get(row.voice_key) ?? 0) + 1);
  }

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        Admin
      </h1>
      <div className="mb-6 h-[1px] w-16 bg-amber-500/50" />

      <div className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Trung tâm quản trị SoAI</p>
        <p className="mt-1 text-xs">
          Quản lý giọng đọc preset + pre-gen static audio cho template.
          Edit template content qua Supabase Dashboard.
        </p>
      </div>

      {/* SECTION 1: Voice Manager */}
      <VoiceManager initialVoices={(systemVoices ?? []) as SystemVoice[]} />

      {/* SECTION 2: Template Audio */}
      <div className="mb-5 mt-10">
        <h2 className="font-serif text-xl font-bold text-stone-800">Template & Static Audio</h2>
        <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-amber-600 via-amber-500 to-transparent" />
      </div>

      {!templates || templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
          Chưa có template nào
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => {
            const segments = (t.template_segments ?? []) as Array<{
              id: string;
              order_index: number;
              segment_type: 'static' | 'dynamic';
              text: string;
            }>;
            const staticCount = segments.filter((s) => s.segment_type === 'static').length;
            const dynamicCount = segments.filter((s) => s.segment_type === 'dynamic').length;
            const audioStatus = Array.from(statusMap.get(t.id)?.entries() ?? []).map(
              ([voice_key, segment_count]) => ({ voice_key, segment_count })
            );

            return (
              <AdminTemplateCard
                key={t.id}
                templateSlug={t.slug}
                title={t.title}
                purpose={t.purpose}
                isActive={t.is_active}
                staticCount={staticCount}
                dynamicCount={dynamicCount}
                audioStatus={audioStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}