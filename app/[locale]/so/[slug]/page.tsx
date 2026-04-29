import { SoContent } from './_components/SoContent';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { SoPlayer } from './_components/SoPlayer';
// đã xóa — dùng render-vars thay thế
import { GUEST_PROFILE } from '@/lib/guest';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('templates')
    .select('title')
    .eq('slug', slug)
    .eq('locale', 'vi')
    .eq('is_active', true)
    .single();

  if (!template) {
    return { title: 'Không tìm thấy sớ' };
  }

  const title = `${template.title} — Nghe tự động bằng AI | GiongDoc`;
  const description = `Nghe ${template.title} được đọc bằng giọng AI tự nhiên. Hành lễ tại gia tiện lợi cùng GiongDoc.`;
  const url = `https://giongdoc.com/${locale}/so/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'GiongDoc',
      locale: 'vi_VN',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('templates')
    .select(`
      id,
      title,
      required_variables,
      template_segments (
        order_index,
        segment_type,
        text
      )
    `)
    .eq('slug', slug)
    .eq('locale', 'vi')
    .eq('is_active', true)
    .order('order_index', { foreignTable: 'template_segments' })
    .single();

  if (!template) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;

  // Guest: hiển thị placeholder cố định "Nguyễn Văn A" / "Hà Nội"
  // User: query profile thật
  let displayName: string;
  let address: string;
  let gender: string | null = null;

  let ceremonyAddress: string | null = null;
if (isGuest) {
  displayName = GUEST_PROFILE.display_name;
  address = GUEST_PROFILE.address;
} else {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address, ceremony_address, gender')
    .eq('id', user.id)
    .single();
  displayName = profile?.display_name || '';
  address = profile?.address || '[Địa chỉ]';
  gender = profile?.gender ?? null;
  ceremonyAddress = profile?.ceremony_address ?? null;
}

  const fullText = (template.template_segments ?? [])
    .map((s) => s.text)
    .join('\n\n');

  const requiredVars = (template as any).required_variables ?? [];

  const { renderVariables, substituteText } = await import('@/lib/admin/render-vars');
  const resolvedVars = renderVariables({
    requiredVars,
    userInput: {},
    profile: isGuest ? null : { 
      display_name: displayName, 
      address, 
      ceremony_address: ceremonyAddress,
      gender 
    },
    eventDate: new Date(),
  });

  const rendered = substituteText(fullText, resolvedVars, { keepUnknown: false });

  const missingVars = requiredVars.filter(
    (v: any) => v.required && !resolvedVars[v.key]
  );

  // Fetch voices từ DB
  const { data: systemVoices } = await supabase
    .from('system_voices')
    .select('voice_key, display_name, description, gender, provider_voice_id')
    .eq('is_active', true)
    .order('sort_order');

  const availableVoices = (systemVoices ?? [])
    .filter((v) => v.provider_voice_id)
    .map((v) => ({
      id: v.provider_voice_id as string,
      voice_key: v.voice_key,
      label: v.display_name,
      gender: v.gender as 'male' | 'female',
      type: 'system' as const,
    }));

  const defaultVoice = availableVoices.find((v) =>
    v.gender === (gender === 'female' ? 'female' : 'male')
  ) ?? availableVoices[0];

  const defaultVoiceId = defaultVoice?.id ?? '';

  return (
    <div className="px-5 pt-6 pb-24">
      <Link
        href={isGuest ? '/' : '/dashboard'}
        className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
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
        isGuest={isGuest}
      />

      {/* Nội dung sớ */}
      <div className="mt-6 rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/30 to-white p-6 shadow-sm">
        <div className="mb-3 text-xs uppercase tracking-widest text-stone-400">
          Nội dung
        </div>
        <SoContent
          rawText={fullText}
          serverRendered={rendered}
          isGuest={isGuest}
          resolvedVars={resolvedVars}
          missingVars={missingVars}
          varLabels={Object.fromEntries(
            (requiredVars as any[]).map((v) => [v.key, v.label])
          )}
        />
      </div>
    </div>
  );
}
