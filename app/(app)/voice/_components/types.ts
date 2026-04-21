import type { Ancestor } from '@app\(onboarding)\gia-dao\_components\types';

export type RecordingStep = 'owner' | 'idle' | 'recording' | 'review';

export type VoiceOwner =
  | { kind: 'user' }
  | { kind: 'ancestor'; ancestor_id: string; display_name: string };

export interface RecordingScript {
  id: string;
  title: string;
  content: string;
  min_duration_sec: number;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  ancestor_id: string | null;
  display_name: string;
  audio_sample_url: string;
  provider_voice_id: string | null;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
}

// Re-export để component khác dùng, anh chỉnh path import Ancestor cho đúng
export type { Ancestor };