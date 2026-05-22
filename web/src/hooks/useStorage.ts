import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useState, useRef, useEffect } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TARGET_FILE_SIZE = 500 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function useStorageUrl(storageId: Id<"_storage"> | null | undefined) {
  const url = useQuery(api.files.getUrl, storageId ? { storageId } : "skip");
  return storageId ? (url ?? null) : null;
}

async function compressImage(file: File): Promise<File> {
  if (file.size <= TARGET_FILE_SIZE) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      const maxDim = 2048;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建画布上下文"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("压缩失败"));
              return;
            }
            if (blob.size <= TARGET_FILE_SIZE || quality <= 0.1) {
              resolve(
                new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                }),
              );
            } else {
              quality -= 0.15;
              tryCompress();
            }
          },
          "image/jpeg",
          quality,
        );
      };
      tryCompress();
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片加载失败"));
    };
    img.src = objectUrl;
  });
}

export function useImageUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const deleteFile = useMutation(api.files.deleteFile);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File): Promise<Id<"_storage">> => {
      validateFile(file);
      setIsUploading(true);
      try {
        const compressed = await compressImage(file);
        const url = await generateUploadUrl();
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": compressed.type },
          body: compressed,
        });

        if (!result.ok) {
          throw new Error("上传失败，请稍后重试");
        }

        const { storageId } = await result.json();
        return storageId as Id<"_storage">;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl],
  );

  const uploadImages = useCallback(
    async (files: File[]): Promise<Id<"_storage">[]> => {
      setIsUploading(true);
      const uploadedIds: Id<"_storage">[] = [];
      try {
        for (const file of files) {
          try {
            const id = await uploadImage(file);
            uploadedIds.push(id);
          } catch (error) {
            // 上传失败时回滚已上传的图片
            for (const id of uploadedIds) {
              try {
                await deleteFile({ storageId: id });
              } catch {
                // 忽略回滚失败
              }
            }
            throw error;
          }
        }
        return uploadedIds;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadImage, deleteFile],
  );

  return { uploadImage, uploadImages, isUploading };
}

function validateFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("不支持的文件类型，请使用 JPG、PNG、WebP 或 GIF 格式");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB");
  }
}

export interface ImageFile {
  file: File;
  preview: string;
}

export function useImageManager(maxCount = 6) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const imagesRef = useRef<ImageFile[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const addFiles = useCallback(
    (files: File[]) => {
      setImages((prev) => {
        const remaining = maxCount - prev.length;
        if (remaining <= 0) return prev;

        const newFiles = files.slice(0, remaining).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

        return [...prev, ...newFiles];
      });
    },
    [maxCount],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const image = prev[index];
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearImages = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
  }, []);

  const cleanup = useCallback(() => {
    imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
  }, []);

  return {
    images,
    previews: images.map((img) => img.preview),
    files: images.map((img) => img.file),
    addFiles,
    removeImage,
    clearImages,
    cleanup,
    isFull: images.length >= maxCount,
    count: images.length,
  };
}
