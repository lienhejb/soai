import { Lunar, Solar } from 'lunar-javascript';

export interface DateInfo {
  solar: string;
  lunar: string;
}

/**
 * Format ngày dương + âm cho header Dashboard
 */
export function getTodayInfo(date: Date = new Date()): DateInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  const lunarDay = String(lunar.getDay()).padStart(2, '0');
  const lunarMonth = String(lunar.getMonth()).padStart(2, '0');
  const yearName = `${lunar.getYearInGanZhi()}`;

  return {
    solar: `${dd}/${mm}/${yyyy}`,
    lunar: `${lunarDay}/${lunarMonth} năm ${yearName}`,
  };
}

/**
 * Tính events trong N ngày tới từ:
 * - Rằm (15 âm) kế tiếp
 * - Mùng 1 (1 âm) kế tiếp
 * - Giỗ của từng người trong bảng people
 */
export interface ComputedEvent {
  event_id: string;            // "ram_2026-05-31" hoặc "gio_{personId}_2026-04-15"
  event_type: 'RAM' | 'MONG' | 'GIO' | 'KHAC';
  title: string;
  date_display: string;        // "31/05 · 15/04 ÂL"
  days_left: number;
  is_hero: boolean;
  target_slug?: string;        // template slug để điều hướng
}

interface PersonInput {
  id: string;
  full_name: string;
  relationship: string;
  death_date: string | null;    // ISO YYYY-MM-DD
  is_lunar_death: boolean;
  is_leap_month_death: boolean;
}

export function computeUpcomingEvents(
  people: PersonInput[],
  withinDays: number = 30,
  today: Date = new Date()
): ComputedEvent[] {
  const events: ComputedEvent[] = [];
  const todayMs = startOfDay(today).getTime();
  const maxMs = todayMs + withinDays * 86400000;

  // Rằm kế tiếp
  const ramDate = findNextLunarDay(today, 15);
  if (ramDate.getTime() <= maxMs) {
    events.push({
      event_id: `ram_${formatISO(ramDate)}`,
      event_type: 'RAM',
      title: `Văn khấn Rằm tháng ${Solar.fromDate(ramDate).getLunar().getMonth()}`,
      date_display: formatDual(ramDate),
      days_left: daysBetween(today, ramDate),
      is_hero: false,
      target_slug: 'khan-ram-hang-thang',
    });
  }

  // Mùng 1 kế tiếp
  const mongDate = findNextLunarDay(today, 1);
  if (mongDate.getTime() <= maxMs) {
    events.push({
      event_id: `mong_${formatISO(mongDate)}`,
      event_type: 'MONG',
      title: `Văn khấn Mùng 1 tháng ${Solar.fromDate(mongDate).getLunar().getMonth()}`,
      date_display: formatDual(mongDate),
      days_left: daysBetween(today, mongDate),
      is_hero: false,
      target_slug: 'khan-mung-mot-hang-thang',
    });
  }

  // Giỗ từng người
  for (const person of people) {
    if (!person.death_date) continue;
    const nextGio = computeNextAnniversary(person.death_date, person.is_lunar_death, today);
    if (!nextGio || nextGio.getTime() > maxMs) continue;

    events.push({
      event_id: `gio_${person.id}_${formatISO(nextGio)}`,
      event_type: 'GIO',
      title: `Giỗ ${person.relationship} ${person.full_name}`,
      date_display: formatDual(nextGio),
      days_left: daysBetween(today, nextGio),
      is_hero: false,
      target_slug: 'khan-gio-cha',
    });
  }

  // Sort theo days_left → sự kiện gần nhất = hero
  events.sort((a, b) => a.days_left - b.days_left);
  if (events.length > 0) events[0].is_hero = true;

  return events;
}

// ============ HELPERS ============

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDual(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const lunar = Solar.fromDate(d).getLunar();
  const lDay = String(lunar.getDay()).padStart(2, '0');
  const lMonth = String(lunar.getMonth()).padStart(2, '0');
  return `${dd}/${mm} · ${lDay}/${lMonth} ÂL`;
}

/**
 * Tìm ngày dương lịch kế tiếp có ngày âm = lunarDay (1 hoặc 15)
 */
function findNextLunarDay(from: Date, lunarDay: number): Date {
  let cur = startOfDay(from);
  for (let i = 0; i < 45; i++) {
    const lunar = Solar.fromDate(cur).getLunar();
    if (lunar.getDay() === lunarDay) return cur;
    cur = new Date(cur.getTime() + 86400000);
  }
  return cur;
}

/**
 * Tính ngày giỗ kế tiếp của 1 người
 * - Nếu âm lịch: giữ ngày/tháng âm, đổi năm âm sao cho >= today
 * - Nếu dương lịch: giữ ngày/tháng dương, đổi năm dương
 */
function computeNextAnniversary(
  deathDateISO: string,
  isLunar: boolean,
  today: Date
): Date | null {
  const [y, m, d] = deathDateISO.split('-').map(Number);
  if (!y || !m || !d) return null;
  const todayStart = startOfDay(today);

  if (!isLunar) {
    // Dương lịch
    let year = todayStart.getFullYear();
    let candidate = new Date(year, m - 1, d);
    if (candidate.getTime() < todayStart.getTime()) {
      candidate = new Date(year + 1, m - 1, d);
    }
    return candidate;
  }

  // Âm lịch
  const origLunarDay = d;
  const origLunarMonth = m;
  let lunarYear = Solar.fromDate(todayStart).getLunar().getYear();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const lunar = Lunar.fromYmd(lunarYear, origLunarMonth, origLunarDay);
      const solar = lunar.getSolar();
      const candidate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
      if (candidate.getTime() >= todayStart.getTime()) return candidate;
      lunarYear++;
    } catch {
      lunarYear++;
    }
  }
  return null;
}