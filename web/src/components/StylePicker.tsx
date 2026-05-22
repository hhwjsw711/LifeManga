import { MANGA_STYLES } from "../lib/constants";
import { StyleIcon } from "./StyleIcon";

export function StylePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (style: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {MANGA_STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-card border-2 transition-colors ${
            value === s.id
              ? "border-ember bg-ember/8 dark:bg-ember/20"
              : "border-cream-dark dark:border-ink-light hover:border-cream-darker dark:hover:border-ink-muted"
          }`}
        >
          <StyleIcon styleId={s.id} />
          <span className="text-xs whitespace-nowrap">{s.displayName}</span>
          <span className="text-[10px] text-ink-muted whitespace-nowrap">
            {s.subtitle}
          </span>
        </button>
      ))}
    </div>
  );
}
