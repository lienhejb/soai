export interface BackgroundSound {
  key: string;
  label: string;
  url: string;
  default_volume: number; // 0-100
  icon: 'mo' | 'chuong'; // map icon trong AudioControls
}

export const BACKGROUND_SOUNDS: readonly BackgroundSound[] = [
  {
    key: 'mo',
    label: 'Tiếng mõ',
    url: '/audio/tieng-mo.mp3',
    default_volume: 40,
    icon: 'mo',
  },
  {
    key: 'chuong',
    label: 'Tiếng chuông',
    url: '/audio/tieng-chuong.mp3',
    default_volume: 30,
    icon: 'chuong',
  },
] as const;

export const VOCAL_DEFAULT_VOLUME = 100;
export const AUDIO_PREFS_STORAGE_KEY = 'soai_audio_prefs_v1';