import { useCallback, useRef } from "react";

export function ImageInput({
  images,
  onAdd,
  onRemove,
  maxCount = 6,
}: {
  images: { url: string; id?: string }[];
  onAdd: (files: File[]) => void;
  onRemove?: (index: number) => void;
  maxCount?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        onAdd(files);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onAdd],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {images.map((img, i) => (
          <div
            key={img.id ?? i}
            className="relative w-20 h-20 rounded-card overflow-hidden border-2 border-cream-dark dark:border-ink-light"
          >
            <img
              src={img.url}
              alt={`上传图片 ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-0 right-0 w-5 h-5 bg-error text-cream-light text-xs flex items-center justify-center rounded-bl-card leading-none"
                aria-label="移除图片"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {images.length < maxCount && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-card border-2 border-dashed border-cream-darker dark:border-ink-muted flex items-center justify-center text-ink-muted hover:border-ember hover:text-ember transition-colors"
          >
            <span className="text-2xl">+</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
