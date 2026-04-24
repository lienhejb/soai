import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './_components/DashboardClient';
import { getTodayInfo, computeUpcomingEvents } from '@/lib/lunar';
import type { UserSo } from './_components/types';

const MOCK_USER_SOS: UserSo[] = [
  {
    user_so_id: 'khan-ram-hang-thang',
    nickname: 'Sớ Rằm cầu an',
    event_type: 'RAM',
    is_default: true,
    updated_at: new Date().toISOString(),
  },
  {
    user_so_id: 'khan-mung-mot-hang-thang',
    nickname: 'Sớ Mùng 1',
    event_type: 'MONG',
    is_default: false,
    updated_at: new Date().toISOString(),
  },
  {
    user_so_id: 'khan-gio-cha',
    nickname: 'Sớ Giỗ Cha',
    event_type: 'GIO',
    is_default: false,
    updated_at: new Date().toISOString(),
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, peopleRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, gender, birth_year, address, role')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('people')
      .select('id, full_name, relationship, death_date, is_lunar_death, is_leap_month_death')
      .eq('user_id', user!.id),
  ]);

  const profile = profileRes.data;
  const people = peopleRes.data ?? [];

  const today = getTodayInfo();
  const events = computeUpcomingEvents(people, 30);
  // Fetch templates cho event type của hero
let availableTemplates: Array<{ id: string; slug: string; title: string }> = [];
if (heroEvent) {
  const purposeMap: Record<string, string> = {
    RAM: 'ram',
    MONG: 'mung_mot',
    GIO: 'gio',
    KHAC: '',
  };
  const purpose = purposeMap[heroEvent.event_type];
  if (purpose) {
    const { data } = await supabase
      .from('templates')
      .select('id, slug, title')
      .eq('locale', 'vi')
      .eq('purpose', purpose)
      .eq('is_active', true);
    availableTemplates = data ?? [];
  }
}
  const heroEvent = events.find((e) => e.is_hero);
  const otherEvents = events.filter((e) => !e.is_hero);

  const honorific = profile?.gender === 'female' ? 'Bà' : 'Ông';
  const fullName = profile?.display_name || 'Tín chủ';
  const isAdmin = profile?.role === 'admin';

  return (
    <DashboardClient
      honorific={honorific}
      fullName={fullName}
      isAdmin={isAdmin}
      todaySolar={today.solar}
      todayLunar={today.lunar}
      heroEvent={heroEvent ?? null}
      otherEvents={otherEvents}
      availableTemplates={availableTemplates}
      userSos={MOCK_USER_SOS}
      initialProfile={{
        display_name: profile?.display_name || '',
        gender: profile?.gender ?? null,
        birth_year: profile?.birth_year ?? null,
        address: profile?.address || '',
      }}
    />
  );
}