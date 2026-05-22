export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-3 bg-error/8 dark:bg-error/20 border border-error/30 dark:border-error/50 rounded-card flex items-start gap-2">
      <p className="text-sm text-error flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-error/60 hover:text-error text-sm shrink-0"
          aria-label="关闭"
        >
          ✕
        </button>
      )}
    </div>
  );
}
