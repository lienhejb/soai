import type { SoPlaybackData } from './types';

// Mock sớ Rằm tháng 3 — kiến trúc stitching
// 5 segments: STATIC intro + DYNAMIC personal + STATIC body + DYNAMIC ancestors + STATIC outro

export const MOCK_SO_DATA: SoPlaybackData = {
  user_so_id: 'mock-so-ram-3',
  title: 'Hành Lễ Live: Rằm Tháng 3',
  total_duration_ms: 45000,
  segments: [
    {
      segment_id: 'seg-1-intro',
      order: 1,
      type: 'STATIC',
      audio_url: '/mock-audio/silent.mp3',
      duration_ms: 10000,
      lines: [
        { line_id: 'l1', text: 'Nam mô A Di Đà Phật.', start_ms: 0, end_ms: 3000 },
        { line_id: 'l2', text: 'Con kính lạy chín phương Trời, mười phương Chư Phật.', start_ms: 3000, end_ms: 7000 },
        { line_id: 'l3', text: 'Kính lạy Hoàng Thiên Hậu Thổ, chư vị Tôn Thần.', start_ms: 7000, end_ms: 10000 },
      ],
    },
    {
      segment_id: 'seg-2-personal',
      order: 2,
      type: 'DYNAMIC',
      audio_url: '/mock-audio/silent.mp3',
      duration_ms: 8000,
      lines: [
        { line_id: 'l4', text: 'Hôm nay là ngày Rằm tháng Ba niên hiệu Giáp Thìn.', start_ms: 0, end_ms: 4000 },
        { line_id: 'l5', text: 'Tín chủ con là Nguyễn Văn A, ngụ tại số 12 Hà Nội.', start_ms: 4000, end_ms: 8000 },
      ],
    },
    {
      segment_id: 'seg-3-body',
      order: 3,
      type: 'STATIC',
      audio_url: '/mock-audio/silent.mp3',
      duration_ms: 12000,
      lines: [
        { line_id: 'l6', text: 'Thành tâm sửa biện hương hoa lễ vật, kim ngân trà quả.', start_ms: 0, end_ms: 5000 },
        { line_id: 'l7', text: 'Thắp nén tâm hương, dâng lên trước án.', start_ms: 5000, end_ms: 8000 },
        { line_id: 'l8', text: 'Cúi xin chư vị giáng lâm trước án, chứng giám lòng thành.', start_ms: 8000, end_ms: 12000 },
      ],
    },
    {
      segment_id: 'seg-4-ancestors',
      order: 4,
      type: 'DYNAMIC',
      audio_url: '/mock-audio/silent.mp3',
      duration_ms: 8000,
      lines: [
        { line_id: 'l9', text: 'Kính mời hương linh Cụ ông Nguyễn Văn B.', start_ms: 0, end_ms: 4000 },
        { line_id: 'l10', text: 'Giáng lâm hưởng thụ lễ vật.', start_ms: 4000, end_ms: 8000 },
      ],
    },
    {
      segment_id: 'seg-5-outro',
      order: 5,
      type: 'STATIC',
      audio_url: '/mock-audio/silent.mp3',
      duration_ms: 7000,
      lines: [
        { line_id: 'l11', text: 'Dãi tấm lòng thành, cúi xin chứng giám.', start_ms: 0, end_ms: 4000 },
        { line_id: 'l12', text: 'Cẩn cáo. Nam mô A Di Đà Phật.', start_ms: 4000, end_ms: 7000 },
      ],
    },
  ],
};
