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
            className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
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
                className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-bl-lg leading-none"
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
            className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
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
