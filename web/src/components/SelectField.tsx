export function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-ink-muted w-20">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 border-2 border-cream-dark dark:border-ink-light rounded-card bg-transparent text-sm focus:outline-none focus:border-ember"
      >
        {children}
      </select>
    </div>
  );
}
