import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useImageUpload, useStorageUrl } from "../hooks/useStorage";
import { ArtStylePicker } from "../components/ArtStylePicker";
import { ImageInput } from "../components/ImageInput";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PosePickerSheet } from "../components/PosePickerSheet";
import { CHARACTER_ART_STYLES } from "../lib/constants";

export function CharacterLibraryPage() {
  const characters = useQuery(api.characters.list);
  const deleteCharacter = useMutation(api.characters.remove);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"characters"> | null>(null);

  if (!characters) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PageHeader onCreate={() => setShowCreate(true)} />

      {showCreate && (
        <CharacterCreateView
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
          }}
        />
      )}

      {characters.length === 0 && !showCreate && <EmptyState />}

      <CharacterGrid
        characters={characters}
        onSelect={setSelectedId}
        onDelete={(args) => void deleteCharacter(args)}
      />

      {selectedId && (
        <CharacterDetailModal
          characterId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return <LoadingSpinner />;
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">角色库</h1>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
      >
        + 新建角色
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg mb-2">还没有角色</p>
      <p className="text-sm">上传照片创建你的第一个漫画角色</p>
    </div>
  );
}

function CharacterGrid({
  characters,
  onSelect,
  onDelete,
}: {
  characters: Doc<"characters">[];
  onSelect: (id: Id<"characters">) => void;
  onDelete: (args: { characterId: Id<"characters"> }) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {characters.map((char) => (
        <CharacterCard
          key={char._id}
          character={char}
          onClick={() => onSelect(char._id)}
          onDelete={() => {
            if (confirm(`确定删除角色「${char.name}」？`)) {
              void onDelete({ characterId: char._id });
            }
          }}
        />
      ))}
    </div>
  );
}

function CharacterCard({
  character,
  onClick,
  onDelete,
}: {
  character: Doc<"characters">;
  onClick: () => void;
  onDelete: () => void;
}) {
  const views = useQuery(api.characters.getViews, {
    characterId: character._id,
  });
  const photoUrl = useStorageUrl(character.sourcePhotoId);

  return (
    <button
      type="button"
      className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow text-left w-full"
      onClick={onClick}
    >
      <div className="aspect-square bg-slate-200 dark:bg-slate-700">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            👤
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{character.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-400">
            {views?.length ?? 0} 个视图
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            aria-label={`删除 ${character.name}`}
          >
            🗑
          </button>
        </div>
      </div>
    </button>
  );
}

function CharacterDetailModal({
  characterId,
  onClose,
}: {
  characterId: Id<"characters">;
  onClose: () => void;
}) {
  const character = useQuery(api.characters.get, { characterId });
  const views = useQuery(api.characters.getViews, { characterId });
  const renameCharacter = useMutation(api.characters.rename);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [showPosePicker, setShowPosePicker] = useState(false);

  if (!character) return null;

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">{character.name}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 text-xl hover:text-slate-600 transition-colors"
          aria-label="关闭"
        >
          ×
        </button>
      </div>

      {character.bio && (
        <p className="text-sm text-slate-500 mb-3">{character.bio}</p>
      )}

      <RenameSection
        isRenaming={isRenaming}
        newName={newName}
        onNameChange={setNewName}
        onStartRename={() => {
          setNewName(character.name);
          setIsRenaming(true);
        }}
        onEndRename={() => {
          if (newName.trim()) {
            void renameCharacter({ characterId, name: newName.trim() })
              .then(() => setIsRenaming(false))
              .catch((e) => {
                console.error("重命名失败:", e);
              });
          }
        }}
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        {views?.map((view) => (
          <CharacterViewCard key={view._id} view={view} />
        ))}
      </div>

      <button
        onClick={() => setShowPosePicker(true)}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
      >
        生成更多姿势
      </button>

      {showPosePicker && (
        <PosePickerSheet
          characterId={characterId}
          characterName={character.name}
          characterBio={character.bio ?? undefined}
          sourcePhotoId={character.sourcePhotoId}
          onClose={() => setShowPosePicker(false)}
        />
      )}
    </Modal>
  );
}

function RenameSection({
  isRenaming,
  newName,
  onNameChange,
  onStartRename,
  onEndRename,
}: {
  isRenaming: boolean;
  newName: string;
  onNameChange: (name: string) => void;
  onStartRename: () => void;
  onEndRename: () => void;
}) {
  return isRenaming ? (
    <div className="flex gap-2 mb-3">
      <input
        value={newName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEndRename()}
        className="flex-1 px-2 py-1 border rounded bg-transparent text-sm"
        autoFocus
        placeholder="角色名称"
      />
      <button
        onClick={onEndRename}
        className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 transition-colors"
      >
        保存
      </button>
    </div>
  ) : (
    <button
      onClick={onStartRename}
      className="text-xs text-indigo-500 hover:text-indigo-600 transition-colors mb-3"
    >
      重命名
    </button>
  );
}

function CharacterViewCard({ view }: { view: Doc<"characterViews"> }) {
  const url = useStorageUrl(view.imageId);
  const removeView = useMutation(api.characters.removeView);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      {url ? (
        <img
          src={url}
          alt={view.label}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1">
        <p className="text-[10px] text-white truncate">{view.label}</p>
      </div>
      <button
        onClick={() => {
          if (confirm("删除此视图？")) void removeView({ viewId: view._id });
        }}
        className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        aria-label="删除视图"
      >
        ×
      </button>
    </div>
  );
}

function CharacterCreateView({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: Id<"characters">) => void;
}) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["jpAnime"]);
  const [isColor, setIsColor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const { uploadImage } = useImageUpload();
  const createCharacter = useMutation(api.characters.create);
  const addView = useMutation(api.characters.addView);
  const startJob = useMutation(api.jobs.startJob);
  const generateCharacterSheet = useAction(api.openai.generateCharacterSheet);

  const handlePhotoSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !photoFile) return;
    setIsCreating(true);

    try {
      const photoId = await uploadImage(photoFile);
      const characterId = await createCharacter({
        name: name.trim(),
        bio: bio.trim() || undefined,
        sourcePhotoId: photoId,
      });

      onCreated(characterId);

      await Promise.all(
        selectedStyles.map(async (styleId) => {
          const artStyle = CHARACTER_ART_STYLES.find((s) => s.id === styleId);
          if (!artStyle) return;

          try {
            const job = await startJob({
              characterId,
              characterName: name.trim(),
              style: styleId,
              kind: "characterViews",
              projectName: "",
              artStyle: styleId,
            });

            const result = await generateCharacterSheet({
              jobId: job,
              sourcePhotoId: photoId,
              name: name.trim(),
              bio: bio.trim() || undefined,
              artStylePrompt: artStyle.prompt,
              size: "1024x1024",
              quality: "medium",
              isColor,
            });

            if (result) {
              await addView({
                characterId,
                label: `${artStyle.displayName} - 正面`,
                imageId: result,
              });
            }
          } catch (styleErr) {
            console.error(
              `角色风格生成失败 (${artStyle.displayName}):`,
              styleErr,
            );
          }
        }),
      );
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "创建角色失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 mb-4">
      <h3 className="font-medium mb-3">新建角色</h3>
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="角色名称"
          className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="角色简介（可选）"
          className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent resize-none h-16"
        />
        <div>
          <p className="text-sm mb-2">上传照片</p>
          {photoPreview ? (
            <div className="flex items-center gap-2">
              <img
                src={photoPreview}
                alt="角色照片"
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <button
                onClick={() => {
                  setPhotoFile(null);
                  URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                }}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                清除
              </button>
            </div>
          ) : (
            <ImageInput images={[]} onAdd={handlePhotoSelect} maxCount={1} />
          )}
        </div>
        <div>
          <p className="text-sm mb-2">选择画风（可多选）</p>
          <ArtStylePicker
            value={selectedStyles}
            onChange={(v) => setSelectedStyles(v as string[])}
            multiple
          />
        </div>
        <div>
          <p className="text-sm mb-2">色彩模式</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsColor(false)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm transition-colors ${
                !isColor
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              ⬛ 黑白
            </button>
            <button
              type="button"
              onClick={() => setIsColor(true)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm transition-colors ${
                isColor
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              🌈 彩色
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleCreate()}
            disabled={isCreating || !name.trim() || !photoFile}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-indigo-600 transition-colors"
          >
            {isCreating ? "创建中..." : "创建角色"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 text-sm hover:text-slate-600 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
