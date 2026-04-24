import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './_components/DashboardClient';
import type { UpcomingEvent, UserSo } from './_components/types';

const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    event_id: 'khan-ram-hang-thang',
    event_type: 'RAM',
    title: 'Văn khấn Rằm tháng Tư',
    date_display: '15/04 Âm lịch',
    days_left: 3,
    is_hero: true,
  },
  {
    event_id: 'khan-mung-mot-hang-thang',
    event_type: 'MONG',
    title: 'Văn khấn Mùng 1 tháng Năm',
    date_display: '01/05 Âm lịch',
    days_left: 18,
    is_hero: false,
  },
];

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, gender, birth_year, address, role')
    .eq('id', user!.id)
    .single();

  const heroEvent = MOCK_UPCOMING_EVENTS.find((e) => e.is_hero) ?? MOCK_UPCOMING_EVENTS[0];
  const otherEvents = MOCK_UPCOMING_EVENTS.filter((e) => !e.is_hero);

  const honorific = profile?.gender === 'female' ? 'Bà' : 'Ông';
  const fullName = profile?.display_name || 'Tín chủ';
  const isAdmin = profile?.role === 'admin';

  return (
    <DashboardClient
      honorific={honorific}
      fullName={fullName}
      isAdmin={isAdmin}
      todayLunar="15 Tháng 3 năm Bính Ngọ"
      heroEvent={heroEvent}
      suggestedTemplateSlug={heroEvent?.event_id}
      suggestedTemplateTitle={heroEvent?.title}
      otherEvents={otherEvents}
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