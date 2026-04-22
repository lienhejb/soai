const DRAFT_KEY = 'soai_draft';
const CURRENT_VERSION = 1;

export interface DraftAncestor {
  temp_id: string;
  full_name: string;
  relationship: string;
  death_date: string;
  is_lunar: boolean;
  is_leap_month: boolean;
}

export interface DraftData {
  version: number;
  owner_name: string;
  address: string;
  voice_id: string;
  ancestors: DraftAncestor[];
  updated_at: string;
}

export function saveDraft(data: Omit<DraftData, 'version' | 'updated_at'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: DraftData = {
      ...data,
      version: CURRENT_VERSION,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[draft] save failed:', e);
  }
}

export function loadDraft(): DraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftData;
    if (parsed.version !== CURRENT_VERSION) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function hasDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(DRAFT_KEY);
  } catch {
    return false;
  }
}