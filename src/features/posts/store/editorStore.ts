import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
export interface DraftSnapshot {
  title: string;
  content: string;
  summary: string;
  slug: string;
  scheduledAt: string | null;
}

interface EditorState {
  // Content
  title: string;
  content: string;
  summary: string;
  slug: string;
  scheduledAt: string | null;

  // Loading States
  isUploading: boolean;
  isManualSaving: boolean;
  isSummarizing: boolean;
  isGeneratingSlug: boolean;

  // Modal States
  showPublishModal: boolean;
  showDraftModal: boolean;

  // Feedback
  isDragging: boolean;
  lastAutoSavedAt: Date | null;
}

interface EditorActions {
  // Content Actions
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setSummary: (summary: string) => void;
  setSlug: (slug: string) => void;
  setScheduledAt: (date: string | null) => void;

  // Loading State Actions
  setIsUploading: (value: boolean) => void;
  setIsManualSaving: (value: boolean) => void;
  setIsSummarizing: (value: boolean) => void;
  setIsGeneratingSlug: (value: boolean) => void;

  // Modal Actions
  openPublishModal: () => void;
  closePublishModal: () => void;
  openDraftModal: () => void;
  closeDraftModal: () => void;
  setShowDraftModal: (value: boolean) => void;

  // Feedback Actions
  setIsDragging: (value: boolean) => void;
  setLastAutoSavedAt: (date: Date | null) => void;

  // Batch Actions
  loadDraft: (draft: DraftSnapshot) => void;
  initializeFromProps: (values: Partial<DraftSnapshot>) => void;
  reset: () => void;
  getSnapshot: () => DraftSnapshot;
}

const initialState: EditorState = {
  title: '',
  content: '',
  summary: '',
  slug: '',
  scheduledAt: null,
  isUploading: false,
  isManualSaving: false,
  isSummarizing: false,
  isGeneratingSlug: false,
  showPublishModal: false,
  showDraftModal: false,
  isDragging: false,
  lastAutoSavedAt: null,
};

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Content Actions
    setTitle: title => set({ title }),
    setContent: content => set({ content }),
    setSummary: summary => set({ summary }),
    setSlug: slug => set({ slug }),
    setScheduledAt: scheduledAt => set({ scheduledAt }),

    // Loading State Actions
    setIsUploading: value => set({ isUploading: value }),
    setIsManualSaving: value => set({ isManualSaving: value }),
    setIsSummarizing: value => set({ isSummarizing: value }),
    setIsGeneratingSlug: value => set({ isGeneratingSlug: value }),

    // Modal Actions
    openPublishModal: () => set({ showPublishModal: true }),
    closePublishModal: () => set({ showPublishModal: false }),
    openDraftModal: () => set({ showDraftModal: true }),
    closeDraftModal: () => set({ showDraftModal: false }),
    setShowDraftModal: value => set({ showDraftModal: value }),

    // Feedback Actions
    setIsDragging: value => set({ isDragging: value }),
    setLastAutoSavedAt: date => set({ lastAutoSavedAt: date }),

    // Batch Actions
    loadDraft: draft =>
      set({
        title: draft.title || '',
        content: draft.content || '',
        summary: draft.summary || '',
        slug: draft.slug || '',
        scheduledAt: draft.scheduledAt || null,
        showDraftModal: false,
      }),

    initializeFromProps: values =>
      set({
        title: values.title || '',
        content: values.content || '',
        summary: values.summary || '',
        slug: values.slug || '',
        scheduledAt: values.scheduledAt || null,
      }),

    reset: () => set(initialState),

    getSnapshot: () => {
      const { title, content, summary, slug, scheduledAt } = get();
      return { title, content, summary, slug, scheduledAt };
    },
  }))
);

// Selector hooks for optimized re-renders
export const useEditorContent = () =>
  useEditorStore(state => ({
    title: state.title,
    content: state.content,
    summary: state.summary,
    slug: state.slug,
    scheduledAt: state.scheduledAt,
  }));

export const useEditorModals = () =>
  useEditorStore(state => ({
    showPublishModal: state.showPublishModal,
    showDraftModal: state.showDraftModal,
  }));
