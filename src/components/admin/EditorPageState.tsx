interface EditorLoadingStateProps {
  message: string;
}

interface EditorErrorStateProps {
  message: string;
  onRetry: () => void;
}

const editorPageStateStyles = {
  loadingWrapper: 'flex items-center justify-center h-screen',
  loadingInner: 'text-center',
  loadingSpinner:
    'inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent',
  loadingText: 'mt-4 text-gray-600',
  errorWrapper: 'min-h-screen flex items-center justify-center',
  errorInner: 'text-center',
  errorText: 'text-red-600 mb-4',
  retryButton: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
};

export const EditorLoadingState = ({ message }: EditorLoadingStateProps) => {
  return (
    <div className={editorPageStateStyles.loadingWrapper}>
      <div className={editorPageStateStyles.loadingInner}>
        <div className={editorPageStateStyles.loadingSpinner}></div>
        <p className={editorPageStateStyles.loadingText}>{message}</p>
      </div>
    </div>
  );
};

export const EditorErrorState = ({ message, onRetry }: EditorErrorStateProps) => {
  return (
    <div className={editorPageStateStyles.errorWrapper}>
      <div className={editorPageStateStyles.errorInner}>
        <p className={editorPageStateStyles.errorText}>{message}</p>
        <button onClick={onRetry} className={editorPageStateStyles.retryButton}>
          다시 시도
        </button>
      </div>
    </div>
  );
};
