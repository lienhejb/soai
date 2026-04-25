import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

export default async function SoListPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('templates')
    .select('slug, title, purpose, is_featured')
    .eq('locale', 'vi')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        Thư Viện Sớ
      </h1>
      <div className="mb-8 h-[1px] w-16 bg-amber-500/50" />

      {!templates || templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
          Chưa có bản sớ nào
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link
              key={t.slug}
              href={`/so/${t.slug}`}
              className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-lg font-semibold text-stone-800">
                  {t.title}
                </h3>
                {t.is_featured && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    Phổ biến
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm font-medium text-amber-600">
                Xem sớ →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}