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
          className={`px-3 py-1.5 rounded-pill text-sm border-2 transition-colors ${
            value === m.id
              ? "border-ember bg-ember/8 dark:bg-ember/20 text-ember-dark dark:text-ember-light"
              : "border-cream-dark dark:border-ink-light text-ink-muted hover:border-cream-darker dark:hover:border-ink-muted"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
