// Single Source of Truth — đồng bộ với Supabase schema

export type VoiceGender = 'male' | 'female';

export interface Voice {
  voice_id: string;        // UUID — FK bất biến
  voice_slug: string;      // SEO slug, hiển thị URL
  display_name: string;
  description: string;
  gender: VoiceGender;
  preview_url: string;
}

export type AncestorRole =
  | 'Cha' | 'Mẹ'
  | 'Ông Nội' | 'Bà Nội' | 'Ông Ngoại' | 'Bà Ngoại'
  | 'Cụ Ông' | 'Cụ Bà'
  | 'Chồng' | 'Vợ'
  | 'Anh' | 'Chị' | 'Em' | 'Con'
  | 'Khác';

export const ANCESTOR_ROLES: AncestorRole[] = [
  'Cha', 'Mẹ',
  'Ông Nội', 'Bà Nội', 'Ông Ngoại', 'Bà Ngoại',
  'Cụ Ông', 'Cụ Bà',
  'Chồng', 'Vợ',
  'Anh', 'Chị', 'Em', 'Con',
  'Khác',
];

export interface Ancestor {
  id: string;              // tạm thời client-side; DB sẽ là UUID
  full_name: string;
  role: AncestorRole;
  death_date: string;      // ISO YYYY-MM-DD
  is_lunar: boolean;
  is_leap_month: boolean;  // tháng nhuận âm lịch
}
