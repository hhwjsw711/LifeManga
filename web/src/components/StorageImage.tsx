import { useState } from "react";
import { useStorageUrl } from "../hooks/useStorage";
import { Id } from "../../convex/_generated/dataModel";

function StorageImageInner({
  storageId,
  className,
  alt,
}: {
  storageId: Id<"_storage">;
  className?: string;
  alt?: string;
}) {
  const url = useStorageUrl(storageId);
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div
        className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${className ?? ""}`}
      />
    );
  }

  if (error) {
    return (
      <div
        className={`bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs ${className ?? ""}`}
      >
        加载失败
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? ""}
      className={className}
      onError={() => setError(true)}
    />
  );
}

export function StorageImage({
  storageId,
  className,
  alt,
}: {
  storageId: Id<"_storage"> | null | undefined;
  className?: string;
  alt?: string;
}) {
  if (!storageId) {
    return (
      <div
        className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${className ?? ""}`}
      />
    );
  }

  return (
    <StorageImageInner
      key={storageId}
      storageId={storageId}
      className={className}
      alt={alt}
    />
  );
}
