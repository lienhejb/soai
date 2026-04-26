// Đồng bộ với Supabase schema

export type EventType =
  | 'RAM'         // Rằm (15 âm)
  | 'MONG'        // Mùng 1
  | 'GIO'         // Giỗ
  | 'TAT_NIEN'    // Tất niên
  | 'CUNG_GIA_TIEN'
  | 'LE_TET'      // Lễ Tết cổ truyền
  | 'KHAI_TRUONG'
  | 'NHAP_TRACH'
  | 'KHAC';

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  RAM: 'Rằm',
  MONG: 'Mùng 1',
  GIO: 'Giỗ',
  TAT_NIEN: 'Tất niên',
  CUNG_GIA_TIEN: 'Cúng gia tiên',
  LE_TET: 'Lễ Tết',
  KHAI_TRUONG: 'Khai trương',
  NHAP_TRACH: 'Nhập trạch',
  KHAC: 'Khác',
};

export interface UpcomingEvent {
  event_id: string;
  event_type: EventType;
  title: string;
  date_display: string;   // "15/03 Âm lịch"
  days_left: number;
  is_hero: boolean;       // event gần nhất để featured
}

export interface UserSo {
  user_so_id: string;       // = template.slug — dùng cho /so/[slug]
  template_id: string;
  nickname: string;          // = template.title
  event_type: EventType;
  is_default: boolean;       // = template.is_featured
  has_rendered: boolean;     // user đã từng gen sớ này chưa
  last_rendered_at: string | null;
  updated_at: string;
}
