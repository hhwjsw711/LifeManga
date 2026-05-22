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
        className={`flex-1 py-2 rounded-card border-2 text-sm transition-colors ${
          !isColor
            ? "border-ember bg-ember/8 dark:bg-ember/20 font-medium"
            : "border-cream-dark dark:border-ink-light"
        }`}
      >
        ⬛ 黑白
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 rounded-card border-2 text-sm transition-colors ${
          isColor
            ? "border-ember bg-ember/8 dark:bg-ember/20 font-medium"
            : "border-cream-dark dark:border-ink-light"
        }`}
      >
        🌈 彩色
      </button>
    </div>
  );
}
