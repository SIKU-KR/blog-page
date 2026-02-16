'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github.css';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
  ImageIcon,
  LinkIcon,
  ChevronLeft,
  TableIcon,
} from 'lucide-react';

import { api } from '@/lib/api/index';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { useEditorStore } from '@/features/posts/store';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import { type Draft } from '@/lib/utils/draft-storage';
import { dateUtils } from '@/lib/utils/date';
import { proseClasses } from '@/components/ui/data-display/prose-classes';

const lowlight = createLowlight(common);
const PREVIEW_DATA_KEY = 'blog-preview-data';
const editorStyles = {
  outlineButton:
    'px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors',
  outlineButtonDisabled:
    'px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors',
  primaryButton:
    'px-3 sm:px-4 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors',
  toolbarSelect:
    'h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-gray-400',
  bubbleMenu: 'flex items-center gap-0.5 bg-white shadow-lg border border-gray-200 rounded-lg p-1',
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
  publishModalContainer:
    'bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto',
  draftModalContainer:
    'bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto',
  formTextarea:
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none',
  formInput:
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm',
  formInputMonospace:
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm',
  aiSummaryButton:
    'text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors',
  aiSlugButton:
    'text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 transition-colors',
  textActionButton: 'px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors',
  draftLoadButton:
    'px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors',
  draftDeleteButton:
    'px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors',
  draftDeleteAllButton:
    'px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors',
  draftCard: 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors',
};

const CODE_BLOCK_LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'bash', label: 'Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' },
] as const;

interface TiptapEditorProps {
  initialValues: {
    title: string;
    content: string;
    summary?: string;
    slug?: string;
    createdAt?: string;
  };
  onSave: (data: {
    title: string;
    content: string;
    summary: string;
    slug: string;
    createdAt?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function TiptapEditor({
  initialValues,
  onSave,
  onCancel,
  isSubmitting,
}: TiptapEditorProps) {
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Zustand store
  const {
    title,
    setTitle,
    content,
    setContent,
    summary,
    setSummary,
    slug,
    setSlug,
    scheduledAt,
    setScheduledAt,
    isUploading,
    setIsUploading,
    showPublishModal,
    openPublishModal,
    closePublishModal,
    showDraftModal,
    setShowDraftModal,
    isManualSaving,
    setIsManualSaving,
    isSummarizing,
    setIsSummarizing,
    isGeneratingSlug,
    setIsGeneratingSlug,
    loadDraft,
    initializeFromProps,
    getSnapshot,
  } = useEditorStore();

  // Draft management hook
  const {
    lastAutoSavedAt,
    getDraftsList,
    saveDraft,
    deleteDraft: deleteDraftById,
    deleteAllDrafts,
  } = useDraftManagement(getSnapshot());

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isExternalUpdate = useRef(false);

  // Tiptap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown,
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: '당신의 이야기를 적어보세요...' }),
    ],
    content: initialValues.content,
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        const md = editor.getMarkdown();
        setContent(md);
      }
    },
    editorProps: {
      attributes: {
        class: `${proseClasses} min-h-[60vh] outline-none focus:outline-none px-4 py-6`
          .replace(/\s+/g, ' ')
          .trim(),
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        imageFiles.forEach(handleImageUpload);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        if (imageItems.length === 0) return false;

        event.preventDefault();
        imageItems.forEach(item => {
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
        });
        return true;
      },
    },
  });

  // Initialize from props on mount
  useEffect(() => {
    const isFutureDate = initialValues.createdAt && new Date(initialValues.createdAt) > new Date();
    initializeFromProps({
      title: initialValues.title,
      content: initialValues.content,
      summary: initialValues.summary,
      slug: initialValues.slug,
      scheduledAt: isFutureDate ? initialValues.createdAt : null,
    });
  }, []);

  // slug 생성 함수
  const generateSlug = useCallback((titleText: string): string => {
    return titleText
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');
  }, []);

  // 초기 slug 생성 (한 번만)
  useEffect(() => {
    if (initialValues.title && !initialValues.slug) {
      setSlug(generateSlug(initialValues.title));
    }
  }, []);

  // Store → Tiptap 동기화 (드래프트 로드 등 외부 변경)
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(
      state => state.content,
      newContent => {
        if (editor && !editor.isDestroyed) {
          const current = editor.getMarkdown();
          if (newContent !== current) {
            isExternalUpdate.current = true;
            editor.commands.setContent(newContent, {
              emitUpdate: false,
              contentType: 'markdown',
            });
            isExternalUpdate.current = false;
          }
        }
      }
    );
    return unsubscribe;
  }, [editor]);

  // 수동 임시저장
  const handleManualSave = useCallback(() => {
    if (!title.trim() && !content.trim()) {
      addToast('제목 또는 내용을 입력해주세요.', 'warning');
      return;
    }

    setIsManualSaving(true);
    try {
      const success = saveDraft();
      if (success) {
        addToast('임시저장되었습니다.', 'success');
      } else {
        addToast('임시저장에 실패했습니다.', 'error');
      }
    } finally {
      setIsManualSaving(false);
    }
  }, [title, content, saveDraft, addToast, setIsManualSaving]);

  // 임시저장 글 불러오기
  const handleLoadDraft = useCallback(
    (draft: Draft) => {
      loadDraft({
        title: draft.title || '',
        content: draft.content || '',
        summary: draft.summary || '',
        slug: draft.slug || '',
        scheduledAt: null,
      });
    },
    [loadDraft]
  );

  // 임시저장 글 삭제
  const handleDeleteDraft = useCallback(
    async (draftId: string, draftTitle: string) => {
      const confirmed = await confirm({
        title: '임시저장 삭제',
        message: `"${draftTitle}"을(를) 삭제하시겠습니까?`,
        confirmText: '삭제',
        cancelText: '취소',
      });

      if (!confirmed) return;

      deleteDraftById(draftId);
      setShowDraftModal(false);
      setTimeout(() => setShowDraftModal(true), 0);
    },
    [deleteDraftById, confirm, setShowDraftModal]
  );

  // 모든 임시저장 글 삭제
  const handleDeleteAllDrafts = useCallback(async () => {
    const drafts = getDraftsList();
    if (drafts.length === 0) {
      addToast('삭제할 임시저장이 없습니다.', 'warning');
      return;
    }

    const confirmed = await confirm({
      title: '전체 삭제',
      message: `총 ${drafts.length}개의 임시저장을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '전체 삭제',
      cancelText: '취소',
    });

    if (!confirmed) return;

    deleteAllDrafts();
    setShowDraftModal(false);
    setTimeout(() => setShowDraftModal(true), 0);
  }, [getDraftsList, deleteAllDrafts, confirm, addToast, setShowDraftModal]);

  // 제목 자동 높이 조정
  const adjustTitleHeight = useCallback(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTitleHeight();
  }, [title, adjustTitleHeight]);

  // 제목 변경 핸들러
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const { compressImage } = await import('@/lib/utils/imageCompression');
      const compressedFile = await compressImage(file, {
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048,
        preferredFormat: 'webp',
      });

      const response = await api.images.upload(compressedFile);
      editor?.chain().focus().setImage({ src: response.url, alt: compressedFile.name }).run();
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      addToast('이미지 업로드에 실패했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // 출간 모달 열기
  const handlePublish = useCallback(() => {
    if (!title.trim()) {
      addToast('제목을 입력해주세요.', 'warning');
      titleRef.current?.focus();
      return;
    }

    if (!content.trim()) {
      addToast('내용을 입력해주세요.', 'warning');
      editor?.commands.focus();
      return;
    }

    openPublishModal();
  }, [title, content, addToast, openPublishModal, editor]);

  // 새 탭에서 미리보기 열기
  const handleOpenPreview = useCallback(() => {
    const previewData = {
      title,
      content,
      summary,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(PREVIEW_DATA_KEY, JSON.stringify(previewData));
      window.open('/preview', '_blank');
    } catch (error) {
      console.error('미리보기 데이터 저장 오류:', error);
      addToast('미리보기를 열 수 없습니다.', 'error');
    }
  }, [title, content, summary, addToast]);

  // slug 유효성 검증
  const validateSlug = (slugValue: string): string | null => {
    if (!slugValue.trim()) return 'URL 주소는 필수입니다.';
    if (slugValue.length < 1 || slugValue.length > 100)
      return 'URL 주소는 1-100자 사이여야 합니다.';
    if (!/^[a-z0-9가-힣-]+$/.test(slugValue))
      return 'URL 주소는 영문 소문자, 숫자, 한글, 하이픈만 포함할 수 있습니다.';
    if (slugValue.startsWith('-') || slugValue.endsWith('-'))
      return 'URL 주소는 하이픈으로 시작하거나 끝날 수 없습니다.';
    if (slugValue.includes('--')) return 'URL 주소에는 연속된 하이픈을 사용할 수 없습니다.';
    return null;
  };

  // 실제 저장 처리
  const handleActualSave = async () => {
    if (!summary.trim()) {
      addToast('요약을 입력해주세요.', 'warning');
      return;
    }

    const slugError = validateSlug(slug);
    if (slugError) {
      addToast(slugError, 'error');
      return;
    }

    try {
      await onSave({
        title,
        content,
        summary,
        slug,
        createdAt: scheduledAt || undefined,
      });

      try {
        const drafts = getDraftsList();
        drafts
          .filter(draft => draft.title === title.trim())
          .forEach(draft => deleteDraftById(draft.id));
      } catch (error) {
        console.error('임시저장 정리 오류:', error);
      }

      closePublishModal();
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 링크 삽입
  const handleInsertLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요:', previousUrl || 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleCodeBlockLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!editor) return;

      const language = e.target.value;
      const attrs = { language };

      if (editor.isActive('codeBlock')) {
        editor.chain().focus().updateAttributes('codeBlock', attrs).run();
        return;
      }

      editor.chain().focus().setCodeBlock(attrs).run();
    },
    [editor]
  );

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleManualSave();
        } else {
          handlePublish();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setShowDraftModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, handlePublish, setShowDraftModal]);

  // 툴바 버튼 컴포넌트
  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title: buttonTitle,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={buttonTitle}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );

  const iconSize = 18;
  const currentCodeBlockLanguage = editor?.isActive('codeBlock')
    ? ((editor.getAttributes('codeBlock').language as string | undefined) ?? 'plaintext')
    : 'plaintext';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 z-10 bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">나가기</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setShowDraftModal(true)}
                  className={editorStyles.outlineButton}
                >
                  <span className="hidden sm:inline">불러오기</span>
                  <span className="sm:hidden text-base">📂</span>
                </button>

                <button
                  onClick={handleManualSave}
                  disabled={isManualSaving}
                  className={editorStyles.outlineButtonDisabled}
                >
                  {isManualSaving ? (
                    '저장 중...'
                  ) : (
                    <>
                      <span className="hidden sm:inline">임시저장</span>
                      <span className="sm:hidden text-base">💾</span>
                    </>
                  )}
                </button>

                <button onClick={handleOpenPreview} className={editorStyles.outlineButton}>
                  <span className="hidden sm:inline">미리보기</span>
                  <span className="sm:hidden text-base">👁</span>
                </button>

                <button
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className={editorStyles.primaryButton}
                >
                  {isSubmitting ? '출간 중...' : '출간하기'}
                </button>
              </div>
              {lastAutoSavedAt && (
                <span className="hidden sm:block text-xs text-gray-500">
                  자동 저장 {lastAutoSavedAt.toLocaleTimeString()} 저장됨
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 제목 입력 */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <textarea
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="제목을 입력하세요"
          className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold placeholder-gray-300 border-none outline-none resize-none overflow-hidden bg-transparent"
          rows={1}
        />
      </div>

      {/* 툴바 */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-0.5 flex-wrap border-b border-gray-200 pb-2">
          {/* 인라인 포맷팅 */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold') ?? false}
            title="Bold (Cmd+B)"
          >
            <Bold size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic') ?? false}
            title="Italic (Cmd+I)"
          >
            <Italic size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            isActive={editor?.isActive('strike') ?? false}
            title="Strikethrough"
          >
            <Strikethrough size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            isActive={editor?.isActive('code') ?? false}
            title="Inline Code (Cmd+E)"
          >
            <Code size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* 헤딩 */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor?.isActive('heading', { level: 2 }) ?? false}
            title="Heading 2"
          >
            <Heading2 size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor?.isActive('heading', { level: 3 }) ?? false}
            title="Heading 3"
          >
            <Heading3 size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* 리스트 */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList') ?? false}
            title="Bullet List"
          >
            <List size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList') ?? false}
            title="Ordered List"
          >
            <ListOrdered size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* 블록 요소 */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive('blockquote') ?? false}
            title="Blockquote"
          >
            <Quote size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            isActive={editor?.isActive('codeBlock') ?? false}
            title="Code Block"
          >
            <CodeSquare size={iconSize} />
          </ToolbarButton>
          <select
            aria-label="코드 블록 언어 선택"
            value={currentCodeBlockLanguage}
            onChange={handleCodeBlockLanguageChange}
            className={editorStyles.toolbarSelect}
          >
            {CODE_BLOCK_LANGUAGES.map(({ value, label }) => (
              <option key={value || 'empty'} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* 미디어/링크/표 */}
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="이미지 추가"
          >
            <ImageIcon size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleInsertLink}
            isActive={editor?.isActive('link') ?? false}
            title="링크 삽입"
          >
            <LinkIcon size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title="표 삽입"
          >
            <TableIcon size={iconSize} />
          </ToolbarButton>

          {isUploading && <span className="text-xs text-blue-600 ml-2">업로드 중...</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Tiptap 에디터 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {editor && (
            <BubbleMenu editor={editor} className={editorStyles.bubbleMenu}>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <Bold size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <Italic size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strike"
              >
                <Strikethrough size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Code"
              >
                <Code size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={handleInsertLink}
                isActive={editor.isActive('link')}
                title="Link"
              >
                <LinkIcon size={16} />
              </ToolbarButton>
            </BubbleMenu>
          )}

          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 하단 글자 수 */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-right">
          <span className="text-sm text-gray-500">{content.length.toLocaleString()} 자</span>
        </div>
      </div>

      {/* 출간 모달 */}
      {showPublishModal && (
        <div className={editorStyles.modalOverlay}>
          <div className={editorStyles.publishModalContainer}>
            <h3 className="text-lg font-bold mb-4">포스트 출간</h3>

            <div className="space-y-4 mb-6">
              {/* 요약 입력 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    요약 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!content.trim()) {
                        addToast('요약할 내용이 필요합니다.', 'warning');
                        return;
                      }
                      setIsSummarizing(true);
                      try {
                        const { summary: generated } = await api.ai.generateSummary({
                          text: content,
                        });
                        if (generated) {
                          setSummary(generated);
                          addToast('AI 요약이 생성되었습니다.', 'success');
                        } else {
                          addToast('요약 생성에 실패했습니다.', 'error');
                        }
                      } catch (err) {
                        console.error('요약 생성 오류:', err);
                        addToast('요약 생성 중 오류가 발생했습니다.', 'error');
                      } finally {
                        setIsSummarizing(false);
                      }
                    }}
                    disabled={isSummarizing || !content.trim()}
                    className={editorStyles.aiSummaryButton}
                  >
                    {isSummarizing ? '생성 중...' : 'AI 요약 생성'}
                  </button>
                </div>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="포스트 요약을 입력하세요..."
                  className={editorStyles.formTextarea}
                  rows={3}
                />
              </div>

              {/* URL 주소 입력 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL 주소 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!title.trim() || !content.trim()) {
                        addToast('제목과 내용을 입력해주세요.', 'warning');
                        return;
                      }
                      setIsGeneratingSlug(true);
                      try {
                        const { slug: generated } = await api.ai.generateSlug({
                          title: title.trim(),
                          text: content.trim(),
                        });
                        if (generated) {
                          setSlug(generated);
                          addToast('AI slug가 생성되었습니다.', 'success');
                        } else {
                          addToast('slug 생성에 실패했습니다.', 'error');
                        }
                      } catch (err) {
                        console.error('slug 생성 오류:', err);
                        addToast('slug 생성 중 오류가 발생했습니다.', 'error');
                      } finally {
                        setIsGeneratingSlug(false);
                      }
                    }}
                    disabled={isGeneratingSlug || !title.trim() || !content.trim()}
                    className={editorStyles.aiSlugButton}
                  >
                    {isGeneratingSlug ? '생성 중...' : 'AI slug 생성'}
                  </button>
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase())}
                  placeholder="url-friendly-slug"
                  className={editorStyles.formInputMonospace}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {slug && (
                    <span className="text-green-600">
                      미리보기: <code className="bg-gray-100 px-1 rounded">/{slug}</code>
                    </span>
                  )}
                </div>
              </div>

              {/* 예약 발행 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">발행 일시</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="publishTiming"
                        checked={!scheduledAt}
                        onChange={() => setScheduledAt(null)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">즉시 발행</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="publishTiming"
                        checked={!!scheduledAt}
                        onChange={() => setScheduledAt(new Date().toISOString())}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">예약 발행</span>
                    </label>
                  </div>

                  {scheduledAt && (
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        value={dateUtils.toDatetimeLocal(scheduledAt)}
                        onChange={e => setScheduledAt(dateUtils.fromDatetimeLocal(e.target.value))}
                        min={dateUtils.getMinDatetimeLocal()}
                        className={editorStyles.formInput}
                      />
                      <div className="text-xs text-blue-600">
                        예약 발행: {dateUtils.formatKorean(scheduledAt)}{' '}
                        {new Date(scheduledAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={closePublishModal}
                className={`${editorStyles.textActionButton} order-2 sm:order-1`}
              >
                취소
              </button>
              <button
                onClick={handleActualSave}
                disabled={isSubmitting || !summary.trim() || !slug.trim()}
                className={`${editorStyles.primaryButton} order-1 sm:order-2`}
              >
                {isSubmitting
                  ? scheduledAt
                    ? '예약 중...'
                    : '출간 중...'
                  : scheduledAt
                    ? '예약 발행'
                    : '출간하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 임시저장 목록 모달 */}
      {showDraftModal && (
        <div className={editorStyles.modalOverlay}>
          <div className={editorStyles.draftModalContainer}>
            <h3 className="text-lg font-bold mb-4">임시저장된 글 목록</h3>

            <div className="space-y-3 mb-6">
              {getDraftsList().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>임시저장된 글이 없습니다.</p>
                </div>
              ) : (
                getDraftsList().map(draft => (
                  <div key={draft.id} className={editorStyles.draftCard}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleLoadDraft(draft)}>
                        <h4 className="font-medium text-gray-900 mb-1">{draft.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {draft.content
                            ? draft.content.substring(0, 100) +
                              (draft.content.length > 100 ? '...' : '')
                            : '내용 없음'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(draft.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleLoadDraft(draft);
                          }}
                          className={editorStyles.draftLoadButton}
                        >
                          불러오기
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteDraft(draft.id, draft.title);
                          }}
                          className={editorStyles.draftDeleteButton}
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between">
              {getDraftsList().length > 0 && (
                <button
                  onClick={handleDeleteAllDrafts}
                  className={editorStyles.draftDeleteAllButton}
                >
                  모두 삭제
                </button>
              )}
              <div className={getDraftsList().length > 0 ? '' : 'w-full flex justify-end'}>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className={editorStyles.textActionButton}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
}
