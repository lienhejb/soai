import { createClient } from '@/lib/supabase/server';
import { VoiceRecorderSimple } from './_components/VoiceRecorderSimple';

export default async function VoicePage() {
  const supabase = await createClient();

  // Fetch script mẫu (script đã seed với 3 segments)
  const { data: script } = await supabase
    .from('recording_scripts')
    .select('id, title, content, min_duration_sec')
    .eq('is_active', true)
    .eq('locale', 'vi')
    .order('sort_order')
    .limit(1)
    .single();

  // Fetch 1 text khác để TTS test (template Rằm)
  const { data: testTemplate } = await supabase
    .from('templates')
    .select('content')
    .eq('slug', 'khan-ram-hang-thang')
    .eq('locale', 'vi')
    .single();

  if (!script || !testTemplate) {
    return (
      <div className="p-8 text-center text-stone-500">
        Chưa có script hoặc template để test.
      </div>
    );
  }

  // Render text test (thay biến tạm)
  const testText = testTemplate.content
    .replace(/\{\{\s*owner_name\s*\}\}/g, 'Nguyễn Văn A')
    .replace(/\{\{\s*address\s*\}\}/g, 'Hà Nội');

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        Lưu Giữ Giọng Nói
      </h1>
      <div className="mb-6 h-[1px] w-16 bg-amber-500/50" />
      <p className="mb-8 text-sm text-stone-500">
        Đọc đoạn dưới đây để AI học giọng của bạn.
      </p>

      <VoiceRecorderSimple
        scriptContent={script.content}
        minDurationSec={script.min_duration_sec}
        testText={testText}
      />
    </div>
  );
}