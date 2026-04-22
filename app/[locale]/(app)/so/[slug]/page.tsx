import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { PlayButton } from './_components/PlayButton';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch template
  const { data: template } = await supabase
    .from('templates')
    .select('id, title, content, required_variables')
    .eq('slug', slug)
    .eq('locale', 'vi')
    .eq('is_active', true)
    .single();

  if (!template) notFound();

  // Fetch profile để render biến động
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address')
    .eq('id', user!.id)
    .single();

  // Render content với variables
  const rendered = renderTemplate(template.content, {
    owner_name: profile?.display_name || '[Tín chủ]',
    address: profile?.address || '[Địa chỉ]',
  });

  return (
    <div className="px-5 pt-6 pb-24">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-stone-500 hover:text-stone-800">
        ← Trang chủ
      </Link>

      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        {template.title}
      </h1>
      <div className="mb-6 h-[1px] w-16 bg-amber-500/50" />

      {/* Nội dung sớ */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/30 to-white p-6 shadow-sm">
        <p className="whitespace-pre-line font-serif text-lg leading-loose text-stone-800">
          {rendered}
        </p>
      </div>

      {/* Nút nghe thử — chưa active */}
      <div className="mt-6">
  <PlayButton slug={slug} />
</div>
    </div>
  );
}

/**
 * Replace {{variable}} trong template content
 */
function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return vars[key] ?? `[${key}]`;
  });
}