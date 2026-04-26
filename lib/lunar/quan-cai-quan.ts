/**
 * Bảng tra Quan cai quản theo chi năm âm lịch.
 * Dùng cho 3 biến preset: quan_hanh_khien, quan_hanh_binh, quan_phan_quan.
 */

export interface QuanCaiQuan {
  hanh_khien: string;   // Vd: "Ngô" → render "Quan Ngô Vương hành khiển"
  hanh_binh: string;    // Vd: "Thiên Hao" → "Thiên Hao hành binh chi thần"
  phan_quan: string;    // Vd: "Hứa" → "Hứa Tào phán quan"
}

/**
 * Index 0..11 theo thứ tự chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi.
 * Khớp với value lunar.getYearZhiIndex() của thư viện lunar-javascript.
 */
const QUAN_TABLE: QuanCaiQuan[] = [
  { hanh_khien: 'Chu',   hanh_binh: 'Thiên Ôn',            phan_quan: 'Lý' },        // Tý
  { hanh_khien: 'Triệu', hanh_binh: 'Tam Thập lục thương', phan_quan: 'Khúc' },      // Sửu
  { hanh_khien: 'Ngụy',  hanh_binh: 'Mộc Tinh',            phan_quan: 'Tiêu' },      // Dần
  { hanh_khien: 'Trịnh', hanh_binh: 'Thạch Tinh',          phan_quan: 'Liễu' },      // Mão
  { hanh_khien: 'Sở',    hanh_binh: 'Hỏa Tinh',            phan_quan: 'Biểu' },      // Thìn
  { hanh_khien: 'Ngô',   hanh_binh: 'Thiên Hao',           phan_quan: 'Hứa' },       // Tỵ
  { hanh_khien: 'Tần',   hanh_binh: 'Thiên Mao',           phan_quan: 'Ngọc' },      // Ngọ
  { hanh_khien: 'Tống',  hanh_binh: 'Ngũ Đạo',             phan_quan: 'Lâm' },       // Mùi
  { hanh_khien: 'Tề',    hanh_binh: 'Ngũ Miếu',            phan_quan: 'Tống' },      // Thân
  { hanh_khien: 'Lỗ',    hanh_binh: 'Ngũ Nhạc',            phan_quan: 'Cự' },        // Dậu
  { hanh_khien: 'Việt',  hanh_binh: 'Thiên Bá',            phan_quan: 'Thành' },     // Tuất
  { hanh_khien: 'Lưu',   hanh_binh: 'Ngũ Ôn',              phan_quan: 'Nguyễn' },    // Hợi
];

/**
 * Tra quan cai quản theo zhi index (0=Tý, 5=Tỵ, 6=Ngọ, ...).
 */
export function getQuanByZhiIndex(zhiIndex: number): QuanCaiQuan {
  const idx = ((zhiIndex % 12) + 12) % 12;
  return QUAN_TABLE[idx];
}