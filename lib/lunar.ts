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

/**
 * Format ngày dương → chuỗi âm lịch đầy đủ tự nhiên cho văn khấn TTS
 * Ví dụ: "ngày Rằm tháng Giêng năm Bính Ngọ"
 *        "ngày mùng Một tháng Bảy năm Giáp Thìn"
 *        "ngày mùng Tám tháng Chạp năm Quý Mão"
 */
export function getLunarDateFullString(date: Date = new Date()): string {
  const lunar = Solar.fromDate(date).getLunar();
  const day = lunar.getDay();
  const month = lunar.getMonth();
  const yearGanZhi = lunar.getYearInGanZhi();

  return `ngày ${formatLunarDay(day)} tháng ${formatLunarMonth(month)} năm ${yearGanZhi}`;
}

/**
 * Format ngày âm thành chữ tự nhiên cho TTS
 * 1 → "mùng Một", 5 → "mùng Năm", 10 → "mùng Mười"
 * 11 → "mười Một", 15 → "Rằm", 20 → "hai mươi"
 * 21 → "hai mươi mốt", 30 → "ba mươi"
 */
function formatLunarDay(day: number): string {
  if (day === 15) return 'Rằm';

  const digits = ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín'];

  if (day >= 1 && day <= 10) {
    return day === 10 ? 'mùng Mười' : `mùng ${digits[day]}`;
  }
  if (day === 11) return 'mười Một';
  if (day >= 12 && day <= 19) return `mười ${digits[day - 10]}`;
  if (day === 20) return 'hai mươi';
  if (day === 21) return 'hai mươi mốt';
  if (day >= 22 && day <= 29) return `hai mươi ${digits[day - 20]}`;
  if (day === 30) return 'ba mươi';

  return String(day); // fallback
}

/**
 * Format tháng âm: dùng tên cổ truyền cho tháng 1 (Giêng), 11 (Một?), 12 (Chạp)
 * Tháng còn lại đọc số.
 */
function formatLunarMonth(month: number): string {
  const monthNames: Record<number, string> = {
    1: 'Giêng',
    2: 'Hai',
    3: 'Ba',
    4: 'Tư',
    5: 'Năm',
    6: 'Sáu',
    7: 'Bảy',
    8: 'Tám',
    9: 'Chín',
    10: 'Mười',
    11: 'Mười Một',
    12: 'Chạp',
  };
  return monthNames[month] ?? String(month);
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

/**
 * Lấy danh sách solar dates ứng với 1 ngày âm cụ thể trong N tháng tới
 * Ví dụ: getNextLunarOccurrences(15, 3) → 3 ngày Rằm sắp tới (tháng này + 2 tháng sau)
 */
export function getNextLunarOccurrences(
  lunarDay: number,
  monthsAhead: number = 3,
  from: Date = new Date()
): Date[] {
  const results: Date[] = [];
  let cur = startOfDay(from);
  const maxMs = cur.getTime() + monthsAhead * 31 * 86400000;

  while (cur.getTime() <= maxMs && results.length < monthsAhead + 1) {
    const lunar = Solar.fromDate(cur).getLunar();
    if (lunar.getDay() === lunarDay) {
      results.push(new Date(cur));
      // Nhảy ~25 ngày để qua tháng âm tiếp theo
      cur = new Date(cur.getTime() + 25 * 86400000);
    } else {
      cur = new Date(cur.getTime() + 86400000);
    }
  }
  return results;
}

/**
 * Format Date thành "31/05/2026"
 */
export function formatSolarShort(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Check 2 Date có cùng ngày không (so sánh y/m/d, bỏ qua giờ)
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}