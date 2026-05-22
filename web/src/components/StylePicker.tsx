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
          className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-colors ${
            value === s.id
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
          }`}
        >
          <StyleIcon styleId={s.id} />
          <span className="text-xs whitespace-nowrap">{s.displayName}</span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {s.subtitle}
          </span>
        </button>
      ))}
    </div>
  );
}
