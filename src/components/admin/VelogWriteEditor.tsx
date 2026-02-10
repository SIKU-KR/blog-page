'use client';

import { useEffect, useRef, useCallback } from 'react';

import { api } from '@/lib/api/index';
import MarkdownRenderer from '@/components/ui/data-display/MarkdownRenderer';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { useEditorStore } from '@/features/posts/store';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import { type Draft } from '@/lib/utils/draft-storage';
import { dateUtils } from '@/lib/utils/date';

const PREVIEW_DATA_KEY = 'blog-preview-data';

interface VelogWriteEditorProps {
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

export default function VelogWriteEditor({
  initialValues,
  onSave,
  onCancel,
  isSubmitting,
}: VelogWriteEditorProps) {
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
    isDragging,
    setIsDragging,
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
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 스크롤 연동을 위한 refs
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  // Initialize from props on mount
  useEffect(() => {
    // createdAt이 미래 날짜인 경우에만 scheduledAt으로 설정
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

  // textarea 높이 자동 조절 (초기 로드 시)
  useEffect(() => {
    if (contentRef.current && editorPanelRef.current) {
      const scrollTop = editorPanelRef.current.scrollTop;
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
      editorPanelRef.current.scrollTop = scrollTop;
    }
  }, [content]);

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

  // 내용 변경 핸들러 + 자동 높이 조절
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // textarea 높이를 콘텐츠에 맞게 자동 조절 (스크롤 위치 보존)
    if (contentRef.current && editorPanelRef.current) {
      const scrollTop = editorPanelRef.current.scrollTop;
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
      editorPanelRef.current.scrollTop = scrollTop;
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Compress image before upload
      const { compressImage } = await import('@/lib/utils/imageCompression');
      const compressedFile = await compressImage(file, {
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048,
        preferredFormat: 'webp',
      });

      const response = await api.images.upload(compressedFile);
      const imageMarkdown = `![${compressedFile.name}](${response.url})`;

      // 커서 위치에 이미지 삽입
      if (contentRef.current) {
        const start = contentRef.current.selectionStart;
        const end = contentRef.current.selectionEnd;
        const newContent =
          content.slice(0, start) + '\n' + imageMarkdown + '\n' + content.slice(end);
        setContent(newContent);

        // 커서 위치 조정
        setTimeout(() => {
          if (contentRef.current) {
            const newCursorPos = start + imageMarkdown.length + 2;
            contentRef.current.setSelectionRange(newCursorPos, newCursorPos);
            contentRef.current.focus();
          }
        }, 0);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      addToast('이미지 업로드에 실패했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        imageFiles.forEach(handleImageUpload);
      }
    },
    [content]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault(); // 이미지가 있을 때만 기본 동작 차단

        imageItems.forEach(item => {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
        });
      }
    },
    [handleImageUpload]
  );

  // 출간 모달 열기
  const handlePublish = () => {
    if (!title.trim()) {
      addToast('제목을 입력해주세요.', 'warning');
      titleRef.current?.focus();
      return;
    }

    if (!content.trim()) {
      addToast('내용을 입력해주세요.', 'warning');
      contentRef.current?.focus();
      return;
    }

    // 모달 열 때 기본값 설정하지 않음 (사용자가 직접 생성하도록)

    openPublishModal();
  };

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
  const validateSlug = (slug: string): string | null => {
    if (!slug.trim()) {
      return 'URL 주소는 필수입니다.';
    }

    if (slug.length < 1 || slug.length > 100) {
      return 'URL 주소는 1-100자 사이여야 합니다.';
    }

    if (!/^[a-z0-9가-힣-]+$/.test(slug)) {
      return 'URL 주소는 영문 소문자, 숫자, 한글, 하이픈만 포함할 수 있습니다.';
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return 'URL 주소는 하이픈으로 시작하거나 끝날 수 없습니다.';
    }

    if (slug.includes('--')) {
      return 'URL 주소에는 연속된 하이픈을 사용할 수 없습니다.';
    }

    return null;
  };

  // 실제 저장 처리
  const handleActualSave = async () => {
    // 유효성 검증
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

      // 저장 성공시 해당 제목의 임시저장 삭제
      try {
        const drafts = getDraftsList();
        drafts
          .filter((draft) => draft.title === title.trim())
          .forEach((draft) => deleteDraftById(draft.id));
      } catch (error) {
        console.error('임시저장 정리 오류:', error);
      }

      closePublishModal();
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 텍스트 감싸기 함수
  const wrapSelectedText = useCallback(
    (prefix: string, suffix?: string) => {
      if (!contentRef.current) return;

      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);
      const actualSuffix = suffix || prefix;

      let newText;
      let newCursorPos;

      if (selectedText) {
        // 텍스트가 선택된 경우: 선택된 텍스트를 감싸기
        newText =
          content.slice(0, start) + prefix + selectedText + actualSuffix + content.slice(end);
        newCursorPos = end + prefix.length + actualSuffix.length;
      } else {
        // 텍스트가 선택되지 않은 경우: 커서 위치에 prefix+suffix 삽입하고 커서를 중간에 위치
        newText = content.slice(0, start) + prefix + actualSuffix + content.slice(start);
        newCursorPos = start + prefix.length;
      }

      setContent(newText);

      // 다음 렌더링 후 커서 위치 설정
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.setSelectionRange(newCursorPos, newCursorPos);
          contentRef.current.focus();
        }
      }, 0);
    },
    [content]
  );

  // 스크롤 연동 핸들러 (에디터 패널 <-> 미리보기 패널)
  const handleEditorScroll = useCallback(() => {
    if (isScrollingSyncRef.current) return;

    const editor = editorPanelRef.current;
    const preview = previewPanelRef.current;
    if (!editor || !preview) return;

    const maxEditorScroll = editor.scrollHeight - editor.clientHeight;
    if (maxEditorScroll <= 0) return;

    isScrollingSyncRef.current = true;

    const editorScrollRatio = editor.scrollTop / maxEditorScroll;
    const maxPreviewScroll = preview.scrollHeight - preview.clientHeight;
    preview.scrollTop = editorScrollRatio * maxPreviewScroll;

    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isScrollingSyncRef.current) return;

    const editor = editorPanelRef.current;
    const preview = previewPanelRef.current;
    if (!editor || !preview) return;

    const maxPreviewScroll = preview.scrollHeight - preview.clientHeight;
    if (maxPreviewScroll <= 0) return;

    isScrollingSyncRef.current = true;

    const previewScrollRatio = preview.scrollTop / maxPreviewScroll;
    const maxEditorScroll = editor.scrollHeight - editor.clientHeight;
    editor.scrollTop = previewScrollRatio * maxEditorScroll;

    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서 이벤트가 발생한 경우 마크다운 단축키 무시
      const isInInput =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          (e.target.tagName === 'TEXTAREA' && e.target !== contentRef.current));

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          // Cmd/Ctrl + Shift + S: 임시저장
          handleManualSave();
        } else {
          // Cmd/Ctrl + S: 출간
          handlePublish();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setShowDraftModal(true);
      }

      // 마크다운 포맷팅 단축키 (콘텐츠 에디터에서만)
      if (!isInInput && contentRef.current && e.target === contentRef.current) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
          e.preventDefault();
          wrapSelectedText('`');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
          e.preventDefault();
          wrapSelectedText('**');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, handlePublish, wrapSelectedText]);

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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">나가기</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setShowDraftModal(true)}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">불러오기</span>
                  <span className="sm:hidden">📂</span>
                </button>

                <button
                  onClick={handleManualSave}
                  disabled={isManualSaving}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {isManualSaving ? (
                    '저장 중...'
                  ) : (
                    <>
                      <span className="hidden sm:inline">임시저장</span>
                      <span className="sm:hidden">💾</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenPreview}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">미리보기</span>
                  <span className="sm:hidden">👁</span>
                </button>

                <button
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="px-3 sm:px-4 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
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

      {/* 메인 컨텐츠 - 스플릿 모드 전용 */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="hidden lg:grid lg:grid-cols-2">
          {/* 편집 영역 */}
          <div
              ref={editorPanelRef}
              onScroll={handleEditorScroll}
              className={`overflow-y-auto max-h-[calc(100vh-60px)] pr-4 lg:pr-8 ${isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isDragging && (
                <div className="text-center text-blue-600 font-medium py-8">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  이미지를 여기에 드롭하세요
                </div>
              )}

              {/* 제목 입력 */}
              <div className="flex-shrink-0 pt-4 sm:pt-6">
                <textarea
                  ref={titleRef}
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="제목을 입력하세요"
                  className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold placeholder-gray-300 border-none outline-none resize-none overflow-hidden bg-transparent"
                  rows={1}
                />
              </div>

              {/* 내용 입력 - Full Height textarea */}
              <div className="mt-6 pb-4">
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={handleContentChange}
                  onPaste={handlePaste}
                  placeholder="당신의 이야기를 적어보세요..."
                  className="w-full min-h-[60vh] text-base sm:text-lg leading-relaxed placeholder-gray-400 border-none outline-none resize-none bg-transparent overflow-hidden"
                />

                {/* 하단 툴바 */}
                <div className="flex-shrink-0 bg-white flex items-center justify-between py-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {isUploading ? '업로드 중...' : '이미지 추가'}
                    </button>
                  </div>

                  <div className="text-sm text-gray-500">
                    {content.length.toLocaleString()} 자
                  </div>
                </div>
              </div>
            </div>

          {/* 미리보기 영역 */}
          <div
            ref={previewPanelRef}
            onScroll={handlePreviewScroll}
            className="border-l border-gray-200 pl-4 lg:pl-8 overflow-y-auto max-h-[calc(100vh-60px)]"
          >
            <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                {title || '제목을 입력하세요'}
              </h1>

              <div className="border-t border-gray-200 pt-6">
                <MarkdownRenderer content={content || '당신의 이야기를 적어보세요...'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출간 모달 */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                  >
                    {isSummarizing ? '생성 중...' : 'AI 요약 생성'}
                  </button>
                </div>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="포스트 요약을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingSlug ? '생성 중...' : 'AI slug 생성'}
                  </button>
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase())}
                  placeholder="url-friendly-slug"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
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
                        onChange={(e) => setScheduledAt(dateUtils.fromDatetimeLocal(e.target.value))}
                        min={dateUtils.getMinDatetimeLocal()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors order-2 sm:order-1"
              >
                취소
              </button>
              <button
                onClick={handleActualSave}
                disabled={isSubmitting || !summary.trim() || !slug.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors order-1 sm:order-2"
              >
                {isSubmitting
                  ? (scheduledAt ? '예약 중...' : '출간 중...')
                  : (scheduledAt ? '예약 발행' : '출간하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 임시저장 목록 모달 */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">임시저장된 글 목록</h3>

            <div className="space-y-3 mb-6">
              {getDraftsList().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>임시저장된 글이 없습니다.</p>
                </div>
              ) : (
                getDraftsList().map((draft, index) => (
                  <div
                    key={draft.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
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
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          불러오기
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteDraft(draft.id, draft.title);
                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
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
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                >
                  모두 삭제
                </button>
              )}
              <div className={getDraftsList().length > 0 ? '' : 'w-full flex justify-end'}>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
