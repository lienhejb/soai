import { DashboardGreeting } from './_components/DashboardGreeting';
import { HeroEventCard } from './_components/HeroEventCard';
import { UpcomingEvents } from './_components/UpcomingEvents';
import { SoLibrary } from './_components/SoLibrary';
import type { UpcomingEvent, UserSo } from './_components/types';

// Mock — sẽ thay bằng Supabase query
const MOCK_USER = {
  full_name: 'Nguyễn Văn A',
  honorific: 'bác', // hoặc 'cô', 'anh' — chọn lúc onboarding
};

const TODAY_LUNAR = '14/03';

const MOCK_UPCOMING: UpcomingEvent[] = [
  {
    event_id: 'e1',
    event_type: 'RAM',
    title: 'Rằm tháng 3',
    date_display: '15/03 Âm lịch',
    days_left: 1,
    is_hero: true,
  },
  {
    event_id: 'e2',
    event_type: 'GIO',
    title: 'Giỗ cụ Nguyễn Văn B',
    date_display: '20/03 Âm lịch',
    days_left: 6,
    is_hero: false,
  },
  {
    event_id: 'e3',
    event_type: 'MONG',
    title: 'Mùng 1 tháng 4',
    date_display: '01/04 Âm lịch',
    days_left: 17,
    is_hero: false,
  },
];

const MOCK_SO_LIBRARY: UserSo[] = [
  { user_so_id: 's1', nickname: 'Sớ Rằm cầu an', event_type: 'RAM', is_default: true, updated_at: '2025-02-15' },
  { user_so_id: 's2', nickname: 'Giỗ cụ B', event_type: 'GIO', is_default: true, updated_at: '2025-01-20' },
  { user_so_id: 's3', nickname: 'Sớ Rằm cầu tài', event_type: 'RAM', is_default: false, updated_at: '2025-03-01' },
  { user_so_id: 's4', nickname: 'Mùng 1 hàng tháng', event_type: 'MONG', is_default: true, updated_at: '2025-03-01' },
];

export default function DashboardPage() {
  const heroEvent = MOCK_UPCOMING.find((e) => e.is_hero)!;
  const otherEvents = MOCK_UPCOMING.filter((e) => !e.is_hero);

  return (
    <>
      <DashboardGreeting
        honorific={MOCK_USER.honorific}
        fullName={MOCK_USER.full_name}
        todayLunar={TODAY_LUNAR}
      />
      <div className="px-4">
        <HeroEventCard event={heroEvent} />
      </div>
      <UpcomingEvents events={otherEvents} />
      <SoLibrary sos={MOCK_SO_LIBRARY} />
    </>
  );
}
