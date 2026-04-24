import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminTemplateCard } from './_components/AdminTemplateCard';

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

  // Fetch templates + segments + existing static_audio status
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

  // Fetch static_audio aggregated per template
  const { data: audioRows } = await supabase
    .from('static_audio')
    .select(`
      voice_key,
      segment_id,
      template_segments!inner(template_id)
    `);

  // Map template_id → { voice_key → count }
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

      <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Quản lý Template &amp; Static Audio</p>
        <p className="mt-1 text-xs">
          Mỗi template có nút <span className="font-medium">Gen Static Audio</span> riêng.
          Sau khi gen, audio được lưu Supabase Storage + bảng <code>static_audio</code>.
        </p>
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