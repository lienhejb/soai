/**
 * Resolve variables cho template rendering.
 *
 * Priority order (cao → thấp):
 *   1. user_input (form submit)
 *   2. auto_from_profile (lấy từ profile user)
 *   3. auto_compute (tính runtime: lunar_full, solar_full, quan_cai_quan...)
 *   4. default_value
 *   5. '' (rỗng)
 *
 * Sau khi có map vars → substituteText() thay {{key}} trong content.
 */

import {
  getLunarDateFullString,
  getSolarDateFullString,
  getQuanCaiQuanAtDate,
  formatDateForKhanText,
  isBirthDateKey,
} from '@/lib/lunar';
import type {
  RequiredVariable,
  AutoFromProfile,
  AutoCompute,
} from './preset-variables';

export interface UserProfile {
  display_name?: string | null;
  address?: string | null;
  ceremony_address?: string | null;
  birth_year?: number | null;
  gender?: string | null;
}

export interface RenderVarsInput {
  /** Required variables list từ template. */
  requiredVars: RequiredVariable[];
  /** Giá trị user nhập từ form. Key = variable.key. */
  userInput: Record<string, string>;
  /** Profile user. Null nếu là guest. */
  profile: UserProfile | null;
  /** Map các biến user đã khai trước (từ bảng user_variables). Null nếu guest. */
  userVariables?: Record<string, string> | null;
  /** Ngày làm lễ (user chọn). Nếu không có → today. Dùng cho lunar/solar/quan compute. */
  eventDate?: Date;
}

/**
 * Resolve toàn bộ vars → map { key: value }.
 */
export function renderVariables(input: RenderVarsInput): Record<string, string> {
  const { requiredVars, userInput, profile, userVariables, eventDate } = input;
  const date = eventDate ?? new Date();

  // Cache quan cai quản — 1 lần per render (3 biến cùng dùng)
  let quanCache: ReturnType<typeof getQuanCaiQuanAtDate> | null = null;
  const getQuan = () => {
    if (!quanCache) quanCache = getQuanCaiQuanAtDate(date);
    return quanCache;
  };

  const result: Record<string, string> = {};

  for (const v of requiredVars) {
    // 1. User input (ưu tiên cao nhất)
    const userVal = userInput[v.key];
    if (userVal !== undefined && userVal.trim() !== '') {
      // Biến type='date' → format đặc biệt (cụm "ngày X tháng Y... dương lịch (tức...)")
      if (v.type === 'date') {
        const showLunarRaw = userInput[`${v.key}__show_lunar`];
        const showLunar = showLunarRaw !== undefined
          ? showLunarRaw === '1'
          : !isBirthDateKey(v.key); // default: ngày sinh bỏ tick, còn lại tick
        result[v.key] = formatDateForKhanText(userVal.trim(), showLunar);
      } else {
        result[v.key] = userVal.trim();
      }
      continue;
    }

    // 2. Auto từ profile (nếu biến có khai báo auto_from_profile)
    if (v.auto_from_profile) {
      const fromProfile = resolveFromProfile(v.auto_from_profile, profile);
      if (fromProfile) {
        result[v.key] = fromProfile;
        continue;
      }
    }

    // 2b. Lookup user_variables theo key (biến user đã khai trước ở template khác)
    if (userVariables && userVariables[v.key]) {
      // Biến type='date' → format đặc biệt
      if (v.type === 'date') {
        const showLunarRaw = userVariables[`${v.key}__show_lunar`];
        const showLunar = showLunarRaw !== undefined
          ? showLunarRaw === '1'
          : !isBirthDateKey(v.key);
        result[v.key] = formatDateForKhanText(userVariables[v.key], showLunar);
      } else {
        result[v.key] = userVariables[v.key];
      }
      continue;
    }

    // 3. Auto compute
    if (v.auto_compute) {
      const computed = resolveAutoCompute(v.auto_compute, v.key, date, getQuan);
      if (computed) {
        result[v.key] = computed;
        continue;
      }
    }

    // 4. Default value
    if (v.default_value) {
      result[v.key] = v.default_value;
      continue;
    }

    // 5. Rỗng (substitute sẽ thay {{key}} bằng '')
    result[v.key] = '';
  }

  return result;
}

/**
 * Resolve auto_from_profile.
 */
function resolveFromProfile(
  source: AutoFromProfile,
  profile: UserProfile | null
): string | null {
  if (!profile) return null;

  switch (source) {
    case 'display_name':
      return profile.display_name?.trim() || null;
    case 'address':
      return profile.address?.trim() || null;
    case 'ceremony_address':
      // Fallback: nếu chưa khai → dùng address (gợi ý "lễ tại nhà"). 
      // UI sẽ hỏi user confirm/sửa, sau đó UPDATE profiles.ceremony_address.
      return profile.ceremony_address?.trim() || profile.address?.trim() || null;
    case 'birth_year':
      return profile.birth_year ? String(profile.birth_year) : null;
    case 'gender':
      return profile.gender?.trim() || null;
    case 'display_name_first_word': {
      // VD: "Nguyễn Văn A" → "Nguyễn"
      const name = profile.display_name?.trim();
      if (!name) return null;
      const firstWord = name.split(/\s+/)[0];
      return firstWord || null;
    }
    default:
      return null;
  }
}

/**
 * Resolve auto_compute.
 * `key` cần thiết để phân biệt 3 biến quan_cai_quan share chung token.
 */
function resolveAutoCompute(
  type: AutoCompute,
  key: string,
  date: Date,
  getQuan: () => ReturnType<typeof getQuanCaiQuanAtDate>
): string | null {
  switch (type) {
    case 'lunar_full':
      return getLunarDateFullString(date);

    case 'solar_full':
      return getSolarDateFullString(date);

    case 'lunar_date_from_solar':
      // User nhập ngày dương → convert sang chuỗi âm lịch tự nhiên.
      // Hiện tại chưa hỗ trợ ở đây vì cần `userInput[v.key]` — caller phải parse trước.
      // Phase này: trả null, để default_value handle. Phase sau: nâng cấp.
      return null;

    case 'quan_cai_quan': {
      const quan = getQuan();
      switch (key) {
        case 'quan_hanh_khien': return quan.hanh_khien;
        case 'quan_hanh_binh':  return quan.hanh_binh;
        case 'quan_phan_quan':  return quan.phan_quan;
        default:
          console.warn(`[render-vars] quan_cai_quan token nhưng key không khớp: ${key}`);
          return null;
      }
    }

    default:
      return null;
  }
}

/**
 * Thay {{key}} trong text bằng giá trị từ vars map.
 * - Token không match → giữ nguyên hoặc thay '' tùy `keepUnknown`.
 * - Whitespace trong {{ key }} cũng được trim.
 */
export function substituteText(
  text: string,
  vars: Record<string, string>,
  options: { keepUnknown?: boolean } = {}
): string {
  return text.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/gi, (match, key: string) => {
    const k = key.toLowerCase();
    if (k in vars) return vars[k];
    return options.keepUnknown ? match : '';
  });
}

/**
 * Helper kết hợp: resolve vars + substitute trong 1 lần gọi.
 */
export function renderTemplate(
  text: string,
  input: RenderVarsInput,
  options?: { keepUnknown?: boolean }
): { rendered: string; vars: Record<string, string> } {
  const vars = renderVariables(input);
  const rendered = substituteText(text, vars, options);
  return { rendered, vars };
}