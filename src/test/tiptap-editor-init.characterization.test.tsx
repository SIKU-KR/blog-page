import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TiptapEditor from '@/components/admin/TiptapEditor';

const mocks = vi.hoisted(() => {
  const initializeFromProps = vi.fn();
  const setSlug = vi.fn();
  const getSnapshot = vi.fn();
  const subscribe = vi.fn(() => vi.fn());

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  [
    'focus',
    'toggleBold',
    'toggleItalic',
    'toggleStrike',
    'toggleCode',
    'toggleHeading',
    'toggleBulletList',
    'toggleOrderedList',
    'toggleBlockquote',
    'toggleCodeBlock',
    'setCodeBlock',
    'updateAttributes',
    'setHorizontalRule',
    'setImage',
    'extendMarkRange',
    'unsetLink',
    'setLink',
    'insertTable',
  ].forEach(method => {
    chain[method] = vi.fn(() => chain);
  });
  chain.run = vi.fn(() => true);

  const editor = {
    isDestroyed: false,
    getMarkdown: vi.fn(() => ''),
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
    },
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({})),
  };

  const storeState = {
    title: '',
    setTitle: vi.fn(),
    content: '',
    setContent: vi.fn(),
    summary: '',
    setSummary: vi.fn(),
    slug: '',
    setSlug: (value: string) => setSlug(value),
    scheduledAt: null as string | null,
    setScheduledAt: vi.fn(),
    isUploading: false,
    setIsUploading: vi.fn(),
    showPublishModal: false,
    openPublishModal: vi.fn(),
    closePublishModal: vi.fn(),
    showDraftModal: false,
    setShowDraftModal: vi.fn(),
    isManualSaving: false,
    setIsManualSaving: vi.fn(),
    isSummarizing: false,
    setIsSummarizing: vi.fn(),
    isGeneratingSlug: false,
    setIsGeneratingSlug: vi.fn(),
    loadDraft: vi.fn(),
    initializeFromProps: (values: unknown) => initializeFromProps(values),
    getSnapshot: () => getSnapshot(),
  };

  const useEditorStore = vi.fn(() => storeState);
  (useEditorStore as unknown as { subscribe: typeof subscribe }).subscribe = subscribe;

  return {
    initializeFromProps,
    setSlug,
    getSnapshot,
    subscribe,
    editor,
    useEditorStore,
  };
});

const onSaveMock = vi.fn(() => Promise.resolve());
const onCancelMock = vi.fn();

vi.mock('highlight.js/styles/github.css', () => ({}));

vi.mock('@tiptap/react', () => ({
  useEditor: () => mocks.editor,
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children }: { children: unknown }) => <div>{children as React.ReactNode}</div>,
}));

vi.mock('@/features/posts/store', () => ({
  useEditorStore: mocks.useEditorStore,
}));

vi.mock('@/hooks/useDraftManagement', () => ({
  useDraftManagement: () => ({
    lastAutoSavedAt: null,
    getDraftsList: () => [],
    saveDraft: () => true,
    deleteDraft: vi.fn(),
    deleteAllDrafts: vi.fn(),
  }),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: vi.fn(() => Promise.resolve(false)),
    confirmState: {
      isOpen: false,
      title: '',
      message: '',
      confirmText: '확인',
      cancelText: '취소',
    },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

vi.mock('@/components/ui/Modal', () => ({
  ConfirmModal: () => null,
}));

vi.mock('@/components/admin/tiptap/DraftsModal', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/tiptap/PublishPostModal', () => ({
  default: () => null,
}));

vi.mock('@/lib/api/index', () => ({
  api: {
    images: {
      upload: vi.fn(),
    },
    ai: {
      generateSummary: vi.fn(),
      generateSlug: vi.fn(),
    },
  },
}));

describe('TiptapEditor initialValues synchronization', () => {
  beforeEach(() => {
    mocks.initializeFromProps.mockReset();
    mocks.setSlug.mockReset();
    mocks.getSnapshot.mockReset();
    mocks.subscribe.mockClear();
  });

  it('re-initializes from changed initialValues when editor state is untouched', () => {
    const firstInitialValues = {
      title: 'First Post',
      content: 'first content',
      summary: 'first summary',
      slug: '',
    };
    const secondInitialValues = {
      title: 'Second Post',
      content: 'second content',
      summary: 'second summary',
      slug: '',
    };

    mocks.getSnapshot.mockReturnValue({
      title: firstInitialValues.title,
      content: firstInitialValues.content,
      summary: firstInitialValues.summary,
      slug: firstInitialValues.slug,
      scheduledAt: null,
    });

    const { rerender } = render(
      <TiptapEditor
        initialValues={firstInitialValues}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        isSubmitting={false}
      />
    );

    rerender(
      <TiptapEditor
        initialValues={secondInitialValues}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        isSubmitting={false}
      />
    );

    expect(mocks.initializeFromProps).toHaveBeenCalledTimes(2);
    expect(mocks.initializeFromProps).toHaveBeenNthCalledWith(1, {
      title: 'First Post',
      content: 'first content',
      summary: 'first summary',
      slug: '',
      scheduledAt: null,
    });
    expect(mocks.initializeFromProps).toHaveBeenNthCalledWith(2, {
      title: 'Second Post',
      content: 'second content',
      summary: 'second summary',
      slug: '',
      scheduledAt: null,
    });
    expect(mocks.setSlug).toHaveBeenNthCalledWith(1, 'first-post');
    expect(mocks.setSlug).toHaveBeenNthCalledWith(2, 'second-post');
  });

  it('does not reset from changed initialValues after user-edited state', () => {
    const firstInitialValues = {
      title: 'First Post',
      content: 'first content',
      summary: 'first summary',
      slug: '',
    };
    const secondInitialValues = {
      title: 'Second Post',
      content: 'second content',
      summary: 'second summary',
      slug: '',
    };

    mocks.getSnapshot.mockReturnValue({
      title: 'User Edited Title',
      content: firstInitialValues.content,
      summary: firstInitialValues.summary,
      slug: firstInitialValues.slug,
      scheduledAt: null,
    });

    const { rerender } = render(
      <TiptapEditor
        initialValues={firstInitialValues}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        isSubmitting={false}
      />
    );

    rerender(
      <TiptapEditor
        initialValues={secondInitialValues}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        isSubmitting={false}
      />
    );

    expect(mocks.initializeFromProps).toHaveBeenCalledTimes(1);
    expect(mocks.setSlug).toHaveBeenCalledTimes(1);
    expect(mocks.setSlug).toHaveBeenCalledWith('first-post');
  });
});
