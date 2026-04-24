import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { SoPlayer } from './_components/SoPlayer';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('templates')
    .select('id, title, content')
    .eq('slug', slug)
    .eq('locale', 'vi')
    .eq('is_active', true)
    .single();

  if (!template) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address, gender')
    .eq('id', user!.id)
    .single();

  const rendered = renderTemplate(template.content, {
    owner_name: profile?.display_name || '[Tín chủ]',
    address: profile?.address || '[Địa chỉ]',
  });

  // MOCK — sau này fetch từ DB user_voices/system_voices
  const availableVoices = [
  { id: 'KVzG2JMdZJKi6y7cwERP', label: 'Thầy Thích Thiện', gender: 'male', type: 'system' },
  { id: '6adFm46eyy74snVn6YrT', label: 'Thầy Bảo Phúc', gender: 'male', type: 'system' },
  { id: 'jdlxsPOZOHdGEfcItXVu', label: 'Cô Diệu Tâm', gender: 'female', type: 'system' },
] as const;

  // MOCK default — sau này lấy từ profile.default_voice_id
  const defaultVoiceId = profile?.gender === 'female' ? 'jdlxsPOZOHdGEfcItXVu' : 'KVzG2JMdZJKi6y7cwERP';

  return (
    <div className="px-5 pt-6 pb-24">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-800">
        ← Trang chủ
      </Link>

      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        {template.title}
      </h1>
      <div className="mb-6 h-[1px] w-16 bg-amber-500/50" />

      <SoPlayer
        templateSlug={slug}
        templateTitle={template.title}
        voices={availableVoices}
        defaultVoiceId={defaultVoiceId}
      />

      {/* Nội dung sớ */}
      <div className="mt-6 rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/30 to-white p-6 shadow-sm">
        <div className="mb-3 text-xs uppercase tracking-widest text-stone-400">
          Nội dung
        </div>
        <p className="whitespace-pre-line font-serif text-lg leading-loose text-stone-800">
          {rendered}
        </p>
      </div>
    </div>
  );
}

function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `[${k}]`);
}