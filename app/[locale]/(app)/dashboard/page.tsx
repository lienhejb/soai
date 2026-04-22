import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single();

  return (
    <div className="px-5 pt-8">
      <div className="mb-10">
        <p className="text-sm text-stone-500">Chào mừng</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-800">
          {profile?.display_name || 'Tín chủ'}
        </h1>
      </div>

      <h2 className="mb-4 font-serif text-xl text-stone-800">
        Dâng sớ hôm nay
      </h2>

      <div className="space-y-3">
        <SoCard slug="khan-ram-hang-thang" title="Văn khấn Rằm" subtitle="Ngày Rằm hàng tháng" />
        <SoCard slug="khan-mung-mot-hang-thang" title="Văn khấn Mùng 1" subtitle="Mùng 1 đầu tháng" />
      </div>
    </div>
  );
}

function SoCard({ slug, title, subtitle }: { slug: string; title: string; subtitle: string }) {
  return (
    <Link
      href={`/so/${slug}`}
      className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <h3 className="font-serif text-lg font-semibold text-stone-800">{title}</h3>
      <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      <div className="mt-3 text-sm font-medium text-amber-600">
        Xem sớ →
      </div>
    </Link>
  );
}