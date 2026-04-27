import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { ProfileTabs } from './_components/ProfileTabs';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, gender, address, dong_tho_address, house_direction, business_name')
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

        <ProfileTabs
      profile={profile}
      email={user!.email ?? null}
      people={people ?? []}
    />

    {/* Voice + Logout giữ nguyên */}
    <Link href="/voice" className="block rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/40 to-white p-5 text-center shadow-sm transition hover:shadow-md">
      <div className="font-serif text-base font-medium text-amber-700">→ Lưu giữ giọng nói</div>
      <div className="mt-1 text-xs text-stone-500">Đọc sớ bằng chính giọng của bạn</div>
    </Link>

    <form action="/api/auth/signout" method="post" className="mt-8">
      <button type="submit" className="w-full rounded-xl border border-stone-300 py-3 text-sm text-stone-600 transition hover:border-red-300 hover:text-red-600">
        Đăng xuất
      </button>
    </form>
  </div>
);

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
}}