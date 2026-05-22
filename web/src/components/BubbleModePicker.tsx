import { BUBBLE_MODES } from "../lib/constants";

export function BubbleModePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (mode: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {BUBBLE_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
            value === m.id
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
