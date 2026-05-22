import { CHARACTER_ART_STYLES } from "../lib/constants";

export function ArtStylePicker({
  value,
  onChange,
  multiple = false,
}: {
  value: string | string[];
  onChange: (style: string | string[]) => void;
  multiple?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [value];

  const handleClick = (id: string) => {
    if (multiple) {
      if (selected.includes(id)) {
        onChange(selected.filter((s) => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange(id);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {CHARACTER_ART_STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => handleClick(s.id)}
          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 transition-colors text-center ${
            selected.includes(s.id)
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
          }`}
        >
          <span className="text-sm">{s.displayName}</span>
          <span className="text-[10px] text-slate-400">{s.subtitle}</span>
        </button>
      ))}
    </div>
  );
}
