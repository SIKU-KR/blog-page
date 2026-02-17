import { logger } from './logger';

const DRAFTS_KEY = 'velog-drafts';

export interface DraftSnapshot {
  title: string;
  content: string;
  summary: string;
  slug: string;
  scheduledAt?: string | null;
}

export interface Draft extends DraftSnapshot {
  id: string;
  timestamp: string;
  displayName: string;
  isAutoSave?: boolean;
}

export const draftStorage = {
  getDrafts(): Draft[] {
    try {
      const saved = localStorage.getItem(DRAFTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('Failed to load drafts from storage', error);
      return [];
    }
  },

  saveDrafts(drafts: Draft[]): void {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (error) {
      logger.error('Failed to save drafts to storage', error);
    }
  },

  addDraft(draft: Draft): void {
    const drafts = this.getDrafts();
    // Remove auto-save if this is one, or remove existing with same title if manual
    let filtered: Draft[];
    if (draft.isAutoSave) {
      filtered = drafts.filter(d => !d.isAutoSave);
    } else {
      filtered = drafts.filter(d => d.title !== draft.title);
    }
    this.saveDrafts([draft, ...filtered]);
  },

  deleteDraft(id: string): void {
    const drafts = this.getDrafts();
    this.saveDrafts(drafts.filter(d => d.id !== id));
  },

  clearAll(): void {
    this.saveDrafts([]);
  },
};
