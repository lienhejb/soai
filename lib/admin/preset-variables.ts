/**
 * Định nghĩa types và preset variables cho hệ thống văn khấn.
 * - PRESET_VARIABLES: list 10 biến common, admin chọn từ đây khi tạo template
 * - Admin có thể thêm biến custom (ngoài preset)
 */

export type VariableType = 'text' | 'date' | 'number' | 'select';

export type AutoFromProfile = 'display_name' | 'address' | 'birth_year' | 'gender';

export type AutoCompute = 'lunar_full' | 'lunar_date_from_solar';

export interface RequiredVariable {
  /** Key trong template, dùng cho substitution {{key}}. snake_case. */
  key: string;

  /** Label tiếng Việt hiển thị trong UI form. */
  label: string;

  /** Loại input. */
  type: VariableType;

  /** Có bắt buộc user nhập không. */
  required: boolean;

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
    label: 'Địa chỉ hành lễ',
    type: 'text',
    required: true,
    auto_from_profile: 'address',
    helper_text: 'Tự lấy từ profile của user',
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