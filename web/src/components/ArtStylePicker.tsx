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
          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-card border-2 transition-colors text-center ${
            selected.includes(s.id)
              ? "border-ember bg-ember/8 dark:bg-ember/20"
              : "border-cream-dark dark:border-ink-light hover:border-cream-darker dark:hover:border-ink-muted"
          }`}
        >
          <span className="text-sm">{s.displayName}</span>
          <span className="text-[10px] text-ink-muted">{s.subtitle}</span>
        </button>
      ))}
    </div>
  );
}
