// Types cho Hành Lễ — đồng bộ với kiến trúc stitching

export type SegmentType = 'STATIC' | 'DYNAMIC';

export interface AudioSegment {
  segment_id: string;
  order: number;
  type: SegmentType;
  audio_url: string;            // URL blob / file
  duration_ms: number;
  // Karaoke lines bên trong segment (1 segment có thể có nhiều dòng)
  lines: KaraokeLine[];
}

export interface KaraokeLine {
  line_id: string;
  text: string;
  start_ms: number;             // tính từ đầu segment (không phải đầu bài)
  end_ms: number;
}

export interface SoPlaybackData {
  user_so_id: string;
  title: string;                // "Hành Lễ Rằm Tháng 3"
  segments: AudioSegment[];
  total_duration_ms: number;
}
