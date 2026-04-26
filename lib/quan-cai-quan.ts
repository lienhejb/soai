/**
 * Bảng tra Quan cai quản theo chi năm âm lịch.
 * Dùng cho 3 biến preset: quan_hanh_khien, quan_hanh_binh, quan_phan_quan.
 *
 * Value đã gộp sẵn cấu trúc cố định để admin viết template ngắn gọn:
 *   "Con kính lạy {{quan_hanh_khien}}, {{quan_hanh_binh}}, {{quan_phan_quan}}."
 *   → "Con kính lạy Tần Vương Hành khiển, Thiên Mao hành binh chi thần, Ngọc Tào phán quan."
 */

export interface QuanCaiQuan {
  hanh_khien: string;   // Vd: "Tần Vương Hành khiển"
  hanh_binh: string;    // Vd: "Thiên Mao hành binh chi thần"
  phan_quan: string;    // Vd: "Ngọc Tào phán quan"
}

/**
 * Index 0..11 theo thứ tự chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi.
 */
const QUAN_TABLE: QuanCaiQuan[] = [
  { hanh_khien: 'Chu Vương Hành khiển',   hanh_binh: 'Thiên Ôn hành binh chi thần',            phan_quan: 'Lý Tào phán quan' },        // Tý
  { hanh_khien: 'Triệu Vương Hành khiển', hanh_binh: 'Tam Thập lục thương hành binh chi thần', phan_quan: 'Khúc Tào phán quan' },      // Sửu
  { hanh_khien: 'Ngụy Vương Hành khiển',  hanh_binh: 'Mộc Tinh hành binh chi thần',            phan_quan: 'Tiêu Tào phán quan' },      // Dần
  { hanh_khien: 'Trịnh Vương Hành khiển', hanh_binh: 'Thạch Tinh hành binh chi thần',          phan_quan: 'Liễu Tào phán quan' },      // Mão
  { hanh_khien: 'Sở Vương Hành khiển',    hanh_binh: 'Hỏa Tinh hành binh chi thần',            phan_quan: 'Biểu Tào phán quan' },      // Thìn
  { hanh_khien: 'Ngô Vương Hành khiển',   hanh_binh: 'Thiên Hao hành binh chi thần',           phan_quan: 'Hứa Tào phán quan' },       // Tỵ
  { hanh_khien: 'Tần Vương Hành khiển',   hanh_binh: 'Thiên Mao hành binh chi thần',           phan_quan: 'Ngọc Tào phán quan' },      // Ngọ
  { hanh_khien: 'Tống Vương Hành khiển',  hanh_binh: 'Ngũ Đạo hành binh chi thần',             phan_quan: 'Lâm Tào phán quan' },       // Mùi
  { hanh_khien: 'Tề Vương Hành khiển',    hanh_binh: 'Ngũ Miếu hành binh chi thần',            phan_quan: 'Tống Tào phán quan' },      // Thân
  { hanh_khien: 'Lỗ Vương Hành khiển',    hanh_binh: 'Ngũ Nhạc hành binh chi thần',            phan_quan: 'Cự Tào phán quan' },        // Dậu
  { hanh_khien: 'Việt Vương Hành khiển',  hanh_binh: 'Thiên Bá hành binh chi thần',            phan_quan: 'Thành Tào phán quan' },     // Tuất
  { hanh_khien: 'Lưu Vương Hành khiển',   hanh_binh: 'Ngũ Ôn hành binh chi thần',              phan_quan: 'Nguyễn Tào phán quan' },    // Hợi
];

/**
 * Tra quan cai quản theo zhi index (0=Tý, 5=Tỵ, 6=Ngọ, ...).
 */
export function getQuanByZhiIndex(zhiIndex: number): QuanCaiQuan {
  const idx = ((zhiIndex % 12) + 12) % 12;
  return QUAN_TABLE[idx];
}