import type { VoiceAudioStatus } from '@/lib/admin/template-actions';

interface Props {
  status: VoiceAudioStatus;
}

/**
 * Badge hiển thị trạng thái audio của 1 voice cho 1 template.
 * - Xanh: đủ audio
 * - Vàng: thiếu một phần
 * - Đỏ: chưa có audio nào
 */
export function AudioStatusBadge({ status }: Props) {
  const { voice_label, ready_count, total_static, is_complete } = status;

  let colorClass: string;
  let icon: string;

  if (total_static === 0) {
    colorClass = 'bg-stone-100 text-stone-500 border-stone-200';
    icon = '–';
  } else if (is_complete) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = '✓';
  } else if (ready_count === 0) {
    colorClass = 'bg-red-50 text-red-700 border-red-200';
    icon = '✗';
  } else {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = '⚠';
  }

  const tooltip =
    total_static === 0
      ? `${voice_label}: chưa có segment static`
      : is_complete
        ? `${voice_label}: đã đủ ${ready_count}/${total_static} segments`
        : `${voice_label}: thiếu ${total_static - ready_count} segments — cần Gen lại`;

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      <span className="font-bold">{icon}</span>
      <span>{voice_label}</span>
      <span className="text-[10px] opacity-70">
        {ready_count}/{total_static}
      </span>
    </span>
  );
}