export function ColorModeToggle({
  isColor,
  onChange,
}: {
  isColor: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 rounded-lg border-2 text-sm transition-colors ${
          !isColor
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        ⬛ 黑白
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 rounded-lg border-2 text-sm transition-colors ${
          isColor
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        🌈 彩色
      </button>
    </div>
  );
}
