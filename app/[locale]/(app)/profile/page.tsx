import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, gender, address')
    .eq('id', user!.id)
    .single();

  const { data: people } = await supabase
    .from('people')
    .select('id, full_name, relationship, death_date, is_lunar_death')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        Cá Nhân
      </h1>
      <div className="mb-6 h-[1px] w-16 bg-amber-500/50" />

      {/* Thông tin Tín chủ */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg text-stone-800">Tín chủ</h2>
        <InfoRow label="Họ tên" value={profile?.display_name} />
        <InfoRow label="Giới tính" value={profile?.gender === 'male' ? 'Nam' : profile?.gender === 'female' ? 'Nữ' : null} />
        <InfoRow label="Địa chỉ" value={profile?.address} />
        <InfoRow label="Email" value={user!.email ?? null} />
      </section>

      {/* Gia tiên */}
      <section className="mb-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg text-stone-800">Gia Tiên</h2>
          <span className="text-sm text-stone-500">{people?.length ?? 0} người</span>
        </div>

        {!people || people.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
            Chưa có Hương linh nào
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="font-serif text-base text-stone-800">
                  {p.relationship} {p.full_name}
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {p.death_date && `${p.is_lunar_death ? 'Âm lịch' : 'Dương lịch'} ${formatDate(p.death_date)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Voice test quick link */}
      <Link
        href="/voice"
        className="block rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/40 to-white p-5 text-center shadow-sm transition hover:shadow-md"
      >
        <div className="font-serif text-base font-medium text-amber-700">
          → Lưu giữ giọng nói
        </div>
        <div className="mt-1 text-xs text-stone-500">
          Đọc sớ bằng chính giọng của bạn
        </div>
      </Link>

      {/* Logout */}
      <form action="/api/auth/signout" method="post" className="mt-8">
        <button
          type="submit"
          className="w-full rounded-xl border border-stone-300 py-3 text-sm text-stone-600 transition hover:border-red-300 hover:text-red-600"
        >
          Đăng xuất
        </button>
      </form>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between border-b border-stone-100 py-2 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm text-stone-800">{value || '—'}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}