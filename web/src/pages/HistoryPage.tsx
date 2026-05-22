import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useStorageUrl } from "../hooks/useStorage";
import { Modal } from "../components/Modal";

export function HistoryPage({ projectId }: { projectId: Id<"projects"> }) {
  const items = useQuery(api.mangaItems.listByProject, { projectId });
  const toggleFavorite = useMutation(api.mangaItems.toggleFavorite);
  const deleteItem = useMutation(api.mangaItems.remove);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Id<"mangaItems"> | null>(
    null,
  );

  if (!items) {
    return <LoadingState />;
  }

  const displayItems = showFavoritesOnly
    ? items.filter((i) => i.isFavorite)
    : items;

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs
        showFavoritesOnly={showFavoritesOnly}
        onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />

      {displayItems.length === 0 && (
        <EmptyState showFavoritesOnly={showFavoritesOnly} />
      )}

      <ItemGrid
        items={displayItems}
        onToggleFavorite={(args) => void toggleFavorite(args)}
        onDelete={(args) => void deleteItem(args)}
        onSelect={setSelectedItem}
      />

      {selectedItem && (
        <MangaDetailModal
          itemId={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-[3px] border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );
}

function FilterTabs({
  showFavoritesOnly,
  onToggle,
}: {
  showFavoritesOnly: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => showFavoritesOnly && onToggle()}
        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
          !showFavoritesOnly
            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
            : "text-slate-500 hover:text-slate-600"
        }`}
      >
        全部
      </button>
      <button
        onClick={() => !showFavoritesOnly && onToggle()}
        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
          showFavoritesOnly
            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
            : "text-slate-500 hover:text-slate-600"
        }`}
      >
        收藏
      </button>
    </div>
  );
}

function EmptyState({ showFavoritesOnly }: { showFavoritesOnly: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
      <p className="text-sm">
        {showFavoritesOnly ? "没有收藏的作品" : "还没有作品，去创作吧！"}
      </p>
    </div>
  );
}

function ItemGrid({
  items,
  onToggleFavorite,
  onDelete,
  onSelect,
}: {
  items: Doc<"mangaItems">[];
  onToggleFavorite: (args: { itemId: Id<"mangaItems"> }) => void;
  onDelete: (args: { itemId: Id<"mangaItems"> }) => void;
  onSelect: (id: Id<"mangaItems">) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <HistoryCard
          key={item._id}
          item={item}
          onToggleFavorite={() => void onToggleFavorite({ itemId: item._id })}
          onDelete={() => {
            if (confirm("确定删除此作品？"))
              void onDelete({ itemId: item._id });
          }}
          onClick={() => onSelect(item._id)}
        />
      ))}
    </div>
  );
}

function HistoryCard({
  item,
  onToggleFavorite,
  onDelete,
  onClick,
}: {
  item: Doc<"mangaItems">;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const coverUrl = useStorageUrl(item.outputImageIds[0]);

  return (
    <div
      className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={item.storyScript?.title ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            加载中...
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs truncate">
          {item.storyScript?.title ??
            new Date(item._creationTime).toLocaleString("zh-CN")}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-400">{item.style}</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="text-xs hover:scale-110 transition-transform"
              aria-label={item.isFavorite ? "取消收藏" : "收藏"}
            >
              {item.isFavorite ? "❤️" : "🤍"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              aria-label="删除"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MangaDetailModal({
  itemId,
  onClose,
}: {
  itemId: Id<"mangaItems">;
  onClose: () => void;
}) {
  const item = useQuery(api.mangaItems.get, { itemId });
  const toggleFavorite = useMutation(api.mangaItems.toggleFavorite);
  const firstImageUrl = useStorageUrl(item?.outputImageIds[0]);

  if (!item) return null;

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleShare = async () => {
    if (!canShare || !firstImageUrl) return;
    try {
      const blob = await (await fetch(firstImageUrl)).blob();
      await navigator.share({
        title: item.storyScript?.title ?? "LifeManga 作品",
        text: item.storyScript?.synopsis ?? "",
        files: [new File([blob], "manga.png", { type: "image/png" })],
      });
    } catch {
      // Share cancelled or failed
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold">{item.storyScript?.title ?? "漫画作品"}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 text-xl hover:text-slate-600 transition-colors"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <ImageGallery imageIds={item.outputImageIds} />
        {item.storyScript && <ScriptDisplay script={item.storyScript} />}
        <ItemMetadata item={item} />
        <div className="flex gap-2">
          <button
            onClick={() => void toggleFavorite({ itemId })}
            className="flex-1 px-4 py-2 rounded-lg border text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {item.isFavorite ? "取消收藏" : "收藏"}
          </button>
          {canShare && (
            <button
              onClick={() => void handleShare()}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm hover:bg-indigo-600 transition-colors"
            >
              分享
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ImageGallery({ imageIds }: { imageIds: Id<"_storage">[] }) {
  return (
    <>
      {imageIds.map((imgId, i) => (
        <StorageImageDetail key={imgId} storageId={imgId} index={i} />
      ))}
    </>
  );
}

function StorageImageDetail({
  storageId,
  index,
}: {
  storageId: Id<"_storage">;
  index: number;
}) {
  const url = useStorageUrl(storageId);
  if (!url)
    return (
      <div
        key={index}
        className="bg-slate-200 dark:bg-slate-700 h-64 rounded-lg animate-pulse"
      />
    );
  return (
    <div key={index} className="rounded-lg overflow-hidden group relative">
      <img src={url} alt={`图片 ${index + 1}`} className="w-full" />
      <button
        onClick={() => void downloadImage(url, `manga-page-${index + 1}.png`)}
        className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        aria-label="下载图片"
      >
        下载
      </button>
    </div>
  );
}

async function downloadImage(url: string, filename: string) {
  let blobUrl: string | null = null;
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    window.open(url, "_blank");
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }
}

function ScriptDisplay({
  script,
}: {
  script: {
    title: string;
    synopsis: string;
    panels: Array<{ dialogue?: string; narration?: string }>;
  };
}) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <p className="text-sm font-medium mb-1">{script.title}</p>
      <p className="text-xs text-slate-500 mb-2">{script.synopsis}</p>
      {script.panels.map((panel, i) => (
        <div key={i} className="text-xs mb-1">
          <span className="text-slate-400">第{i + 1}格：</span>
          {panel.dialogue && (
            <span className="text-indigo-600"> "{panel.dialogue}"</span>
          )}
          {panel.narration && (
            <span className="text-slate-500"> {panel.narration}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ItemMetadata({ item }: { item: Doc<"mangaItems"> }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span>风格: {item.style}</span>
      <span>{new Date(item._creationTime).toLocaleString("zh-CN")}</span>
      {item.userPrompt && <span>提示: {item.userPrompt}</span>}
    </div>
  );
}
