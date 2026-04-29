/**
 * Định nghĩa types và preset variables cho hệ thống văn khấn.
 * - PRESET_VARIABLES: list 10 biến common, admin chọn từ đây khi tạo template
 * - Admin có thể thêm biến custom (ngoài preset)
 */

export type VariableType = 'text' | 'date' | 'number' | 'select';

export type AutoFromProfile = 
  | 'display_name' 
  | 'address' 
  | 'ceremony_address'
  | 'birth_year' 
  | 'gender'
  | 'display_name_first_word';

export type AutoCompute = 'lunar_full' | 'lunar_date_from_solar' | 'solar_full' | 'quan_cai_quan';

export interface RequiredVariable {
  /** Key trong template, dùng cho substitution {{key}}. snake_case. */
  key: string;

  /** Label tiếng Việt hiển thị trong UI form. */
  label: string;

  /** Loại input. */
  type: VariableType;

  /** Có bắt buộc user nhập không. */
  required: boolean;

  /**
 * Resolve auto_from_profile mappings:
 * - display_name              → profiles.display_name
 * - address                   → profiles.address (= "Địa chỉ hiện tại")
 * - ceremony_address          → profiles.ceremony_address
 *     ⚠️ FALLBACK: nếu profiles.ceremony_address IS NULL
 *        → return profiles.address (gợi ý "lễ tại nhà")
 *        → KHÔNG ghi DB tại bước này. UI front-end sẽ hỏi user 
 *          confirm/sửa, sau đó submit mới UPDATE profiles.ceremony_address.
 * - birth_year                → profiles.birth_year
 * - gender                    → profiles.gender
 * - display_name_first_word   → profiles.display_name.split(' ')[0]
 */
  /** Auto fill từ profile user (priority cao nhất sau user_input). */
  auto_from_profile?: AutoFromProfile;

  /**
   * Auto compute giá trị tại runtime.
   * 'lunar_full' = "ngày Rằm tháng Giêng năm Bính Ngọ" từ today (hoặc event_date nếu có).
   * 'lunar_date_from_solar' = convert ngày dương user nhập → string âm lịch tự nhiên.
   */
  auto_compute?: AutoCompute;

  /** Giá trị mặc định nếu user không nhập. */
  default_value?: string;

  /** Options cho type='select'. */
  options?: string[];

  /** Placeholder UI input. */
  placeholder?: string;

  /** Helper text dưới input. */
  helper_text?: string;
}

/**
 * 10 biến preset cho Phase 1.
 * Admin tạo template mới sẽ thấy gợi ý từ list này.
 * Có thể thêm biến custom (ngoài preset) qua UI.
 */
export const PRESET_VARIABLES: RequiredVariable[] = [
  // === Auto từ profile ===
  {
    key: 'owner_name',
    label: 'Tên gia chủ',
    type: 'text',
    required: true,
    auto_from_profile: 'display_name',
    helper_text: 'Tự lấy từ profile của user',
  },
  {
    key: 'address',
    label: 'Địa chỉ hiện tại của Tín chủ',
    type: 'text',
    required: true,
    auto_from_profile: 'address',
    helper_text: 'Nơi ở hiện tại của Tín chủ. Tự lấy từ profile.',
  },
  {
    key: 'address_ceremony',
    label: 'Địa chỉ hành lễ',
    type: 'text',
    required: true,
    auto_from_profile: 'ceremony_address',
    placeholder: 'Nơi đang đứng khấn (nếu khác địa chỉ hiện tại)',
    helper_text: 'Tự lấy từ profile. Nếu chưa có, gợi ý dùng "Địa chỉ hiện tại". User có thể sửa và lưu lại cho lần sau.',
  },
  // Họ gia đình — user nhập 1 lần, lưu profile
  {
    key: 'family_surname',
    label: 'Họ gia đình',
    type: 'text',
    required: false,
    auto_from_profile: 'display_name_first_word',
    placeholder: 'VD: Nguyễn, Trần, Lê',
    helper_text: 'Tự lấy từ chữ đầu của tên gia chủ. VD: "Nguyễn Văn A" → họ "Nguyễn"',
  },
  {
    key: 'owner_birth_year',
    label: 'Năm sinh gia chủ',
    type: 'number',
    required: false,
    auto_from_profile: 'birth_year',
  },

  // === Auto compute ===
  {
    key: 'lunar_date_full',
    label: 'Ngày âm lịch đầy đủ',
    type: 'text',
    required: true,
    auto_compute: 'lunar_full',
    helper_text: 'Tự động: "ngày Rằm tháng Giêng năm Bính Ngọ" — từ ngày user chọn làm lễ',
  },
  {
    key: 'solar_date_full',
    label: 'Ngày dương lịch đầy đủ',
    type: 'text',
    required: false,
    auto_compute: 'solar_full',
    helper_text: 'Tự động: "ngày 25 tháng 4 năm 2026" — từ ngày user chọn làm lễ',
  },
  {
    key: 'quan_hanh_khien',
    label: 'Quan Hành khiển (theo năm)',
    type: 'text',
    required: false,
    auto_compute: 'quan_cai_quan',
    helper_text: 'Tự tra theo chi năm âm lịch. VD: năm Bính Ngọ 2026 → "Tần"',
  },
  {
    key: 'quan_hanh_binh',
    label: 'Quan Hành binh (theo năm)',
    type: 'text',
    required: false,
    auto_compute: 'quan_cai_quan',
    helper_text: 'Tự tra theo chi năm âm lịch. VD: năm Bính Ngọ 2026 → "Thiên Mao"',
  },
  {
    key: 'quan_phan_quan',
    label: 'Quan Phán quan (theo năm)',
    type: 'text',
    required: false,
    auto_compute: 'quan_cai_quan',
    helper_text: 'Tự tra theo chi năm âm lịch. VD: năm Bính Ngọ 2026 → "Ngọc"',
  },

  // === Auto default ===
  {
    key: 'le_vat',
    label: 'Lễ vật dâng cúng',
    type: 'text',
    required: false,
    default_value: 'hương hoa trà quả',
    helper_text: 'Mặc định: "hương hoa trà quả" nếu user không nhập',
  },

  // === User nhập (không auto được) ===
  {
    key: 'nguoi_mat',
    label: 'Tên người đã mất',
    type: 'text',
    required: false,
    placeholder: 'VD: Nguyễn Văn A',
  },
  {
    key: 'chuc_danh_nguoi_mat',
    label: 'Quan hệ với người đã mất',
    type: 'select',
    required: false,
    options: [
      'Cha', 'Mẹ',
      'Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại',
      'Cụ ông', 'Cụ bà',
      'Chồng', 'Vợ',
      'Anh', 'Chị', 'Em', 'Con',
    ],
  },
  {
    key: 'ngay_mat_lunar',
    label: 'Ngày mất (chọn ngày dương, hệ thống tự đọc âm)',
    type: 'date',
    required: false,
    helper_text: 'User chọn ngày dương lịch, hệ thống tự convert sang chuỗi âm lịch tự nhiên',
  },
  {
    key: 'house_direction',
    label: 'Hướng nhà (Nhập trạch)',
    type: 'select',
    required: false,
    options: ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'],
  },
  {
    key: 'business_name',
    label: 'Tên doanh nghiệp (Khai trương)',
    type: 'text',
    required: false,
    placeholder: 'VD: Công ty TNHH ABC',
  },
];

/** Lookup nhanh preset theo key. */
export const PRESET_VARIABLES_MAP: Record<string, RequiredVariable> = Object.fromEntries(
  PRESET_VARIABLES.map((v) => [v.key, v])
);

/** Validation: key phải snake_case, không trùng. */
export function isValidVariableKey(key: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(key);
}