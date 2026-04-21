import { VoiceRecorder } from './_components/VoiceRecorder';
import type { Ancestor, RecordingScript } from './_components/types';

// MOCK — thay bằng Supabase query
const MOCK_ANCESTORS: Ancestor[] = [
  { id: 'anc-1', full_name: 'Nguyễn Văn B', role: 'Cha', death_date: '1990-05-20', is_lunar: true, is_leap_month: false },
  { id: 'anc-2', full_name: 'Trần Thị C', role: 'Mẹ', death_date: '2005-11-03', is_lunar: true, is_leap_month: false },
];

const MOCK_SCRIPT: RecordingScript = {
  id: 'script-01',
  title: 'Đoạn khấn ngắn',
  content:
    'Nam mô Bổn Sư Thích Ca Mâu Ni Phật. Con xin kính cẩn nghiêng mình trước anh linh tổ tiên, nguyện giữ gìn gia đạo bình an.',
  min_duration_sec: 15,
};

export default function VoicePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-paper)]">
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-8 md:pt-12">
        <VoiceRecorder ancestors={MOCK_ANCESTORS} script={MOCK_SCRIPT} />
      </main>
    </div>
  );
}