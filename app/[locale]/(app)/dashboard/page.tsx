import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './_components/DashboardClient';
import { getTodayInfo, computeUpcomingEvents } from '@/lib/lunar';
import type { UserSo, EventType } from './_components/types';

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
  // Lấy toàn bộ templates active + count rendered của user
const [templatesRes, renderedRes] = await Promise.all([
  supabase
    .from('templates')
    .select('id, slug, title, purpose, is_featured, created_at')
    .eq('locale', 'vi')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false }),
  supabase
    .from('user_rendered_audio')
    .select('template_id, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false }),
]);

// Map template_id → last_rendered_at
const renderedMap = new Map<string, string>();
for (const r of renderedRes.data ?? []) {
  if (!renderedMap.has(r.template_id)) {
    renderedMap.set(r.template_id, r.created_at);
  }
}

const userSos: UserSo[] = (templatesRes.data ?? []).map((t) => {
  const lastRendered = renderedMap.get(t.id) ?? null;
  return {
    user_so_id: t.slug,
    template_id: t.id,
    nickname: t.title,
    event_type: purposeToEventType(t.purpose),
    is_default: false,
    has_rendered: lastRendered !== null,
    last_rendered_at: lastRendered,
    updated_at: lastRendered ?? t.created_at,
  };
});

  const today = getTodayInfo();
  const events = computeUpcomingEvents(people, 30);
  const heroEvent = events.find((e) => e.is_hero);
  const otherEvents = events.filter((e) => !e.is_hero);

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
      userSos={userSos}
      initialProfile={{
        display_name: profile?.display_name || '',
        gender: profile?.gender ?? null,
        birth_year: profile?.birth_year ?? null,
        address: profile?.address || '',
      }}
    />
  );
}

function purposeToEventType(purpose: string | null): EventType {
  switch (purpose) {
    case 'ram': return 'RAM';
    case 'mung_mot': return 'MONG';
    case 'gio': return 'GIO';
    case 'tat_nien': return 'TAT_NIEN';
    case 'cung_gia_tien': return 'CUNG_GIA_TIEN';
    case 'le_tet': return 'LE_TET';
    case 'khai_truong': return 'KHAI_TRUONG';
    case 'nhap_trach': return 'NHAP_TRACH';
    default: return 'KHAC';
  }
}