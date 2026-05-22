import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useImageManager, useImageUpload } from "../hooks/useStorage";
import {
  GenerationState,
  StoryScript,
  MangaPanel,
  useGenerationState,
} from "../hooks/useMangaGenerator";

const INITIAL_GENERATION_STATE: GenerationState = {
  phase: "idle",
  stageMessage: "",
  errorMessage: null,
  script: null,
};
import { StylePicker } from "../components/StylePicker";
import { BubbleModePicker } from "../components/BubbleModePicker";
import { ImageInput } from "../components/ImageInput";
import { ColorModeToggle } from "../components/ColorModeToggle";
import { StoryModeToggle } from "../components/StoryModeToggle";
import { SelectField } from "../components/SelectField";
import { ErrorBanner } from "../components/ErrorBanner";
import { MANGA_STYLES, IMAGE_SIZES, IMAGE_QUALITIES } from "../lib/constants";
import { buildBubbleDirective } from "../../convex/lib/prompts";
import { navigate } from "../lib/router";

export function HomePage({ projectId }: { projectId: Id<"projects"> }) {
  const settings = useQuery(api.settings.get);
  const project = useQuery(api.projects.get, { projectId });
  const projectItems = useQuery(api.mangaItems.listByProject, { projectId });
  const characters = useQuery(api.characters.list);

  const { previews, files, addFiles, removeImage, clearImages, cleanup } =
    useImageManager(6);
  const { uploadImages, uploadImage } = useImageUpload();

  const [previousPageImage, setPreviousPageImage] = useState<{
    id?: Id<"_storage">;
    file?: File;
    preview: string | null;
  } | null>(null);
  const [loadedCharacterIds, setLoadedCharacterIds] = useState<
    Id<"characters">[]
  >([]);

  const [styleOverride, setStyleOverride] = useState<string | null>(null);
  const [storyModeOverride, setStoryModeOverride] = useState<boolean | null>(
    null,
  );
  const [panelCountOverride, setPanelCountOverride] = useState<number | null>(
    null,
  );
  const [isColorOverride, setIsColorOverride] = useState<boolean | null>(null);
  const [bubbleModeOverride, setBubbleModeOverride] = useState<string | null>(
    null,
  );
  const [imageCountOverride, setImageCountOverride] = useState<number | null>(
    null,
  );
  const [imageSizeOverride, setImageSizeOverride] = useState<string | null>(
    null,
  );
  const [imageQualityOverride, setImageQualityOverride] = useState<
    string | null
  >(null);
  const [userPrompt, setUserPrompt] = useState("");

  const style = styleOverride ?? settings?.defaultStyle ?? "shonenJump";
  const storyMode = storyModeOverride ?? settings?.storyModeOn ?? false;
  const panelCount = panelCountOverride ?? settings?.panelCount ?? 6;
  const isColor = isColorOverride ?? settings?.isColor ?? false;
  const bubbleMode =
    bubbleModeOverride ?? settings?.bubbleTextMode ?? "chinese";
  const imageCount = imageCountOverride ?? settings?.imageCount ?? 1;
  const imageSize = imageSizeOverride ?? settings?.imageSize ?? "1024x1536";
  const imageQuality =
    imageQualityOverride ?? settings?.imageQuality ?? "medium";

  const [generation, setGeneration] = useGenerationState();

  const startJob = useMutation(api.jobs.startJob);
  const deleteFile = useMutation(api.files.deleteFile);
  const generateMangaAction = useAction(api.openai.generateManga);
  const generateScriptAction = useAction(api.openai.generateStoryScript);

  const projectName = project?.name ?? "";

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const toggleCharacter = useCallback((characterId: Id<"characters">) => {
    setLoadedCharacterIds((prev) =>
      prev.includes(characterId)
        ? prev.filter((id) => id !== characterId)
        : [...prev, characterId],
    );
  }, []);

  const characterSourcePhotoIds = useMemo((): Id<"_storage">[] => {
    if (!characters || loadedCharacterIds.length === 0) return [];
    return loadedCharacterIds
      .map((id) => characters.find((c) => c._id === id)?.sourcePhotoId)
      .filter((id): id is Id<"_storage"> => !!id);
  }, [loadedCharacterIds, characters]);

  const handlePreviousPageSelect = useCallback(
    (itemId: Id<"mangaItems">) => {
      const item = projectItems?.find((itm) => itm._id === itemId);
      if (item?.outputImageIds[0]) {
        setPreviousPageImage({ id: item.outputImageIds[0], preview: null });
      }
    },
    [projectItems],
  );

  const clearPreviousPage = useCallback(() => {
    if (previousPageImage?.preview) {
      URL.revokeObjectURL(previousPageImage.preview);
    }
    setPreviousPageImage(null);
  }, [previousPageImage]);

  useEffect(() => {
    return () => {
      if (previousPageImage?.preview) {
        URL.revokeObjectURL(previousPageImage.preview);
      }
    };
  }, [previousPageImage]);

  const requestHash = useMemo((): string => {
    const parts = [
      `style=${style}`,
      `bubble=${bubbleMode}`,
      `color=${isColor}`,
      `n=${imageCount}`,
      `size=${imageSize}`,
      `q=${imageQuality}`,
      `story=${storyMode}`,
      `panels=${panelCount}`,
      `prev=${previousPageImage?.id ?? "-"}`,
      `inputs=${files.map((f) => `${f.name}:${f.size}`).join(",")}`,
      `chars=${loadedCharacterIds.join(",")}`,
      `prompt=${userPrompt}`,
    ];
    return parts.join("|");
  }, [
    style,
    bubbleMode,
    isColor,
    imageCount,
    imageSize,
    imageQuality,
    storyMode,
    panelCount,
    previousPageImage,
    files,
    loadedCharacterIds,
    userPrompt,
  ]);

  const handleGenerate = async () => {
    setGeneration(INITIAL_GENERATION_STATE);

    if (
      files.length === 0 &&
      !previousPageImage?.id &&
      !previousPageImage?.file
    ) {
      setGeneration((prev) => ({
        ...prev,
        errorMessage: "请先至少选择一张图片，或选择上一页作为参考",
      }));
      return;
    }

    const styleConfig = MANGA_STYLES.find((s) => s.id === style);
    if (!styleConfig) {
      setGeneration((prev) => ({
        ...prev,
        errorMessage: "请选择漫画风格",
      }));
      return;
    }

    let inputIds: Id<"_storage">[] = [];
    let previousPageId: Id<"_storage"> | undefined = previousPageImage?.id;
    let uploadedIds: Id<"_storage">[] = [];

    try {
      if (files.length > 0) {
        inputIds = await uploadImages(files);
        uploadedIds = [...inputIds];
      }

      if (!previousPageId && previousPageImage?.file) {
        const prevId = await uploadImage(previousPageImage.file);
        previousPageId = prevId;
        uploadedIds.push(prevId);
      }

      const characterDirective = buildCharacterDirective(
        loadedCharacterIds,
        characters,
      );

      if (storyMode && generation.phase === "idle") {
        await generateStoryScript({
          projectId,
          projectName,
          style,
          inputIds,
          previousPageImageId: previousPageId,
          characterIds:
            loadedCharacterIds.length > 0 ? loadedCharacterIds : undefined,
          characterSourcePhotoIds,
          userPrompt,
          bubbleMode,
          isColor,
          imageCount,
          imageSize,
          imageQuality,
          panelCount,
          styleConfig,
          characterDirective,
          startJob,
          generateScriptAction,
          scriptModel: settings?.scriptModel ?? "gpt-4o-mini",
          requestHash,
          setGeneration,
        });
      } else {
        await generateManga({
          projectId,
          projectName,
          style,
          kind: storyMode ? "storyRender" : "simpleImage",
          inputIds,
          previousPageImageId: previousPageId,
          characterIds:
            loadedCharacterIds.length > 0 ? loadedCharacterIds : undefined,
          characterSourcePhotoIds,
          userPrompt,
          bubbleMode,
          isColor,
          imageCount,
          imageSize,
          imageQuality,
          styleConfig,
          characterDirective,
          script: generation.script,
          startJob,
          generateMangaAction,
          requestHash,
          setGeneration,
        });
      }
    } catch (e: unknown) {
      for (const id of uploadedIds) {
        try {
          await deleteFile({ storageId: id });
        } catch {
          /* ignore rollback failure */
        }
      }
      const message = e instanceof Error ? e.message : String(e);
      setGeneration((prev) => ({
        ...prev,
        errorMessage: message,
        phase:
          prev.phase === "generatingScript"
            ? "idle"
            : prev.phase === "generatingImage"
              ? storyMode
                ? "scriptReady"
                : "idle"
              : "idle",
      }));
    }
  };

  const isGenerating =
    generation.phase === "generatingScript" ||
    generation.phase === "generatingImage";

  return (
    <div className="flex flex-col gap-6">
      <InputSection
        images={previews.map((url, i) => ({ url, id: `${i}` }))}
        onAdd={addFiles}
        onRemove={removeImage}
        maxCount={6}
      />

      <PreviousPageSection
        previousPageImage={previousPageImage}
        onClear={clearPreviousPage}
        onFileSelect={(fileList) => {
          const file = fileList[0];
          if (file) {
            if (previousPageImage?.preview) {
              URL.revokeObjectURL(previousPageImage.preview);
            }
            setPreviousPageImage({
              id: undefined,
              file,
              preview: URL.createObjectURL(file),
            });
          }
        }}
        projectItems={projectItems}
        onSelect={handlePreviousPageSelect}
      />

      {characters && characters.length > 0 && (
        <CharacterSection
          characters={characters}
          loadedCharacterIds={loadedCharacterIds}
          onToggle={toggleCharacter}
        />
      )}

      <StyleSection style={style} onStyleChange={(v) => setStyleOverride(v)} />

      <section>
        <h3 className="text-sm font-medium mb-2">色彩模式</h3>
        <ColorModeToggle
          isColor={isColor}
          onChange={(v) => setIsColorOverride(v)}
        />
      </section>

      <BubbleModeSection
        bubbleMode={bubbleMode}
        onBubbleModeChange={(v) => setBubbleModeOverride(v)}
      />

      <section>
        <StoryModeToggle
          storyMode={storyMode}
          onStoryModeChange={(v) => setStoryModeOverride(v)}
          panelCount={panelCount}
          onPanelCountChange={(v) => setPanelCountOverride(v)}
        />
      </section>

      <PromptSection userPrompt={userPrompt} onPromptChange={setUserPrompt} />

      <AdvancedSettings
        imageCount={imageCount}
        onImageCountChange={(v) => setImageCountOverride(v)}
        imageSize={imageSize}
        onImageSizeChange={(v) => setImageSizeOverride(v)}
        imageQuality={imageQuality}
        onImageQualityChange={(v) => setImageQualityOverride(v)}
      />

      {generation.phase === "scriptReady" && generation.script && (
        <ScriptEditor
          script={generation.script}
          onScriptChange={(script) =>
            setGeneration((prev) => ({ ...prev, script }))
          }
          onReset={() => setGeneration(INITIAL_GENERATION_STATE)}
        />
      )}

      {generation.errorMessage && (
        <ErrorBanner
          message={generation.errorMessage}
          onDismiss={() =>
            setGeneration((prev) => ({ ...prev, errorMessage: null }))
          }
        />
      )}

      <GenerateButton
        onClick={() => void handleGenerate()}
        disabled={isGenerating}
        phase={generation.phase}
        stageMessage={generation.stageMessage}
        storyMode={storyMode}
      />

      {isGenerating && <GenerationProgress message={generation.stageMessage} />}

      {generation.phase === "done" && (
        <GenerationComplete
          projectId={projectId}
          onReset={() => {
            setGeneration(INITIAL_GENERATION_STATE);
            clearImages();
          }}
        />
      )}
    </div>
  );
}

function buildCharacterDirective(
  characterIds: Id<"characters">[],
  characters: Doc<"characters">[] | null | undefined,
): string {
  if (characterIds.length === 0 || !characters) return "";
  const names = characterIds
    .map((id) => characters.find((c) => c._id === id)?.name)
    .filter(Boolean);
  return names.length > 0
    ? `Include these characters: ${names.join(", ")}. Maintain their visual design consistently.`
    : "";
}

async function generateStoryScript(params: {
  projectId: Id<"projects">;
  projectName: string;
  style: string;
  inputIds: Id<"_storage">[];
  previousPageImageId?: Id<"_storage">;
  characterIds?: Id<"characters">[];
  characterSourcePhotoIds: Id<"_storage">[];
  userPrompt: string;
  bubbleMode: string;
  isColor: boolean;
  imageCount: number;
  imageSize: string;
  imageQuality: string;
  panelCount: number;
  styleConfig: (typeof MANGA_STYLES)[number];
  characterDirective: string;
  startJob: (args: {
    projectId: Id<"projects">;
    projectName: string;
    style: string;
    kind: "storyScript" | "simpleImage" | "storyRender" | "characterViews";
    inputImageIds?: Id<"_storage">[];
    previousPageImageId?: Id<"_storage">;
    characterIds?: Id<"characters">[];
    userPromptText?: string;
    bubbleMode?: string;
    wasColorOn?: boolean;
    imageCount?: number;
    imageSize?: string;
    imageQuality?: string;
    subtitle?: string;
    requestHash?: string;
    panelCount?: number;
    scriptModel?: string;
  }) => Promise<Id<"jobs">>;
  generateScriptAction: (args: {
    jobId: Id<"jobs">;
    inputImageIds?: Id<"_storage">[];
    previousPageImageId?: Id<"_storage">;
    characterReferenceIds?: Id<"_storage">[];
    characterDirective?: string;
    style: string;
    userHint?: string;
    panelCount: number;
    scriptModel: string;
    bubbleTextMode: string;
    isColor: boolean;
  }) => Promise<StoryScript | null | undefined>;
  scriptModel: string;
  requestHash: string;
  setGeneration: React.Dispatch<React.SetStateAction<GenerationState>>;
}) {
  params.setGeneration({
    phase: "generatingScript",
    stageMessage: "正在构思剧情...",
    errorMessage: null,
    script: null,
  });

  const job = await params.startJob({
    projectId: params.projectId,
    projectName: params.projectName,
    style: params.style,
    kind: "storyScript",
    inputImageIds: params.inputIds.length > 0 ? params.inputIds : undefined,
    previousPageImageId: params.previousPageImageId,
    characterIds: params.characterIds,
    userPromptText: params.userPrompt || undefined,
    bubbleMode: params.bubbleMode,
    wasColorOn: params.isColor,
    imageCount: params.imageCount,
    imageSize: params.imageSize,
    imageQuality: params.imageQuality,
    panelCount: params.panelCount,
    scriptModel: params.scriptModel,
    requestHash: params.requestHash,
  });

  const script = await params.generateScriptAction({
    jobId: job,
    inputImageIds: params.inputIds.length > 0 ? params.inputIds : undefined,
    previousPageImageId: params.previousPageImageId,
    characterReferenceIds:
      params.characterSourcePhotoIds.length > 0
        ? params.characterSourcePhotoIds
        : undefined,
    characterDirective: params.characterDirective,
    style: params.styleConfig.displayName,
    userHint: params.userPrompt || undefined,
    panelCount: params.panelCount,
    scriptModel: params.scriptModel,
    bubbleTextMode: params.bubbleMode,
    isColor: params.isColor,
  });

  if (script && "panels" in script && Array.isArray(script.panels)) {
    params.setGeneration({
      phase: "scriptReady",
      stageMessage: "剧本已就绪，可以编辑后生成漫画",
      errorMessage: null,
      script,
    });
  } else {
    params.setGeneration({
      phase: "idle",
      stageMessage: "",
      errorMessage: "生成剧本失败",
      script: null,
    });
  }
}

async function generateManga(params: {
  projectId: Id<"projects">;
  projectName: string;
  style: string;
  kind: "storyRender" | "simpleImage";
  inputIds: Id<"_storage">[];
  previousPageImageId?: Id<"_storage">;
  characterIds?: Id<"characters">[];
  characterSourcePhotoIds: Id<"_storage">[];
  userPrompt: string;
  bubbleMode: string;
  isColor: boolean;
  imageCount: number;
  imageSize: string;
  imageQuality: string;
  styleConfig: (typeof MANGA_STYLES)[number];
  characterDirective: string;
  script: StoryScript | null;
  startJob: (args: {
    projectId: Id<"projects">;
    projectName: string;
    style: string;
    kind: "storyScript" | "simpleImage" | "storyRender" | "characterViews";
    inputImageIds?: Id<"_storage">[];
    previousPageImageId?: Id<"_storage">;
    characterIds?: Id<"characters">[];
    userPromptText?: string;
    bubbleMode?: string;
    wasColorOn?: boolean;
    imageCount?: number;
    imageSize?: string;
    imageQuality?: string;
    subtitle?: string;
    requestHash?: string;
  }) => Promise<Id<"jobs">>;
  generateMangaAction: (args: {
    jobId: Id<"jobs">;
    stylePrompt: string;
    userPrompt?: string;
    inputImageIds?: Id<"_storage">[];
    previousPageImageId?: Id<"_storage">;
    characterReferenceIds?: Id<"_storage">[];
    characterDirective?: string;
    n: number;
    size: string;
    quality: string;
    bubbleDirective?: string;
    isColor: boolean;
    renderScript?: {
      title: string;
      synopsis: string;
      panels: Array<{
        description: string;
        dialogue?: string;
        dialogueJa?: string;
        narration?: string;
        narrationJa?: string;
        sfx?: string;
      }>;
    };
    bubbleMode?: string;
  }) => Promise<null>;
  requestHash: string;
  setGeneration: React.Dispatch<React.SetStateAction<GenerationState>>;
}) {
  params.setGeneration({
    phase: "generatingImage",
    stageMessage: "正在生成漫画...",
    errorMessage: null,
    script: params.script,
  });

  const job = await params.startJob({
    projectId: params.projectId,
    projectName: params.projectName,
    style: params.style,
    kind: params.kind,
    inputImageIds: params.inputIds.length > 0 ? params.inputIds : undefined,
    previousPageImageId: params.previousPageImageId,
    characterIds: params.characterIds,
    userPromptText: params.userPrompt || undefined,
    bubbleMode: params.bubbleMode,
    wasColorOn: params.isColor,
    imageCount: params.imageCount,
    imageSize: params.imageSize,
    imageQuality: params.imageQuality,
    subtitle: params.kind === "storyRender" ? params.script?.title : undefined,
    requestHash: params.requestHash,
  });

  await params.generateMangaAction({
    jobId: job,
    stylePrompt: params.styleConfig.prompt,
    userPrompt: params.userPrompt || undefined,
    inputImageIds: params.inputIds.length > 0 ? params.inputIds : undefined,
    previousPageImageId: params.previousPageImageId,
    characterReferenceIds:
      params.characterSourcePhotoIds.length > 0
        ? params.characterSourcePhotoIds
        : undefined,
    characterDirective: params.characterDirective,
    n: params.imageCount,
    size: params.imageSize,
    quality: params.imageQuality,
    bubbleDirective: buildBubbleDirective(params.bubbleMode),
    isColor: params.isColor,
    renderScript:
      params.kind === "storyRender" && params.script
        ? {
            title: params.script.title,
            synopsis: params.script.synopsis,
            panels: params.script.panels.map((p) => ({
              description: p.description,
              dialogue: p.dialogue,
              dialogueJa: p.dialogueJa,
              narration: p.narration,
              narrationJa: p.narrationJa,
              sfx: p.sfx,
            })),
          }
        : undefined,
    bubbleMode: params.bubbleMode,
  });

  params.setGeneration({
    phase: "done",
    stageMessage: "生成完成！请查看历史记录",
    errorMessage: null,
    script: null,
  });
}

function InputSection({
  images,
  onAdd,
  onRemove,
  maxCount,
}: {
  images: Array<{ url: string; id?: string }>;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  maxCount: number;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">输入照片</h3>
      <ImageInput
        images={images}
        onAdd={onAdd}
        onRemove={onRemove}
        maxCount={maxCount}
      />
    </section>
  );
}

function PreviousPageSection({
  previousPageImage,
  onClear,
  onFileSelect,
  projectItems,
  onSelect,
}: {
  previousPageImage: {
    id?: Id<"_storage">;
    file?: File;
    preview: string | null;
  } | null;
  onClear: () => void;
  onFileSelect: (files: File[]) => void;
  projectItems: Doc<"mangaItems">[] | null | undefined;
  onSelect: (itemId: Id<"mangaItems">) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">上一页（风格延续）</h3>
      {previousPageImage ? (
        <div className="flex items-center gap-2">
          {previousPageImage.preview && (
            <img
              src={previousPageImage.preview}
              alt="上一页"
              className="w-16 h-16 object-cover rounded-lg border"
            />
          )}
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            清除
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <ImageInput images={[]} onAdd={onFileSelect} maxCount={1} />
          {projectItems && projectItems.length > 0 && (
            <select
              onChange={(e) => {
                const itemId = e.target.value as Id<"mangaItems">;
                if (itemId) onSelect(itemId);
              }}
              className="text-sm border rounded px-2 py-1 bg-transparent"
            >
              <option value="">从历史选择</option>
              {projectItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.storyScript?.title ??
                    new Date(item._creationTime).toLocaleString("zh-CN")}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </section>
  );
}

function CharacterSection({
  characters,
  loadedCharacterIds,
  onToggle,
}: {
  characters: Doc<"characters">[];
  loadedCharacterIds: Id<"characters">[];
  onToggle: (characterId: Id<"characters">) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">角色引用</h3>
      <div className="flex gap-2 flex-wrap">
        {characters.map((char) => (
          <button
            key={char._id}
            type="button"
            onClick={() => onToggle(char._id)}
            className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
              loadedCharacterIds.includes(char._id)
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {char.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function StyleSection({
  style,
  onStyleChange,
}: {
  style: string;
  onStyleChange: (style: string) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">漫画风格</h3>
      <StylePicker value={style} onChange={onStyleChange} />
    </section>
  );
}

function BubbleModeSection({
  bubbleMode,
  onBubbleModeChange,
}: {
  bubbleMode: string;
  onBubbleModeChange: (mode: string) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">对话框文字</h3>
      <BubbleModePicker value={bubbleMode} onChange={onBubbleModeChange} />
    </section>
  );
}

function PromptSection({
  userPrompt,
  onPromptChange,
}: {
  userPrompt: string;
  onPromptChange: (value: string) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-2">附加提示词（可选）</h3>
      <textarea
        value={userPrompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="描述你想要的画面效果..."
        className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm resize-none h-20"
      />
    </section>
  );
}

function AdvancedSettings({
  imageCount,
  onImageCountChange,
  imageSize,
  onImageSizeChange,
  imageQuality,
  onImageQualityChange,
}: {
  imageCount: number;
  onImageCountChange: (count: number) => void;
  imageSize: string;
  onImageSizeChange: (size: string) => void;
  imageQuality: string;
  onImageQualityChange: (quality: string) => void;
}) {
  return (
    <details>
      <summary className="text-sm text-slate-500 cursor-pointer">
        高级设置
      </summary>
      <div className="flex flex-col gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <SelectField
          label="图片数量"
          value={imageCount}
          onChange={(v) => onImageCountChange(Number(v))}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="图片尺寸"
          value={imageSize}
          onChange={onImageSizeChange}
        >
          {IMAGE_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="图片质量"
          value={imageQuality}
          onChange={onImageQualityChange}
        >
          {IMAGE_QUALITIES.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </SelectField>
      </div>
    </details>
  );
}

function ScriptEditor({
  script,
  onScriptChange,
  onReset,
}: {
  script: StoryScript;
  onScriptChange: (script: StoryScript) => void;
  onReset: () => void;
}) {
  const updatePanel = (index: number, updates: Partial<MangaPanel>) => {
    const newPanels = [...script.panels];
    newPanels[index] = { ...newPanels[index], ...updates };
    onScriptChange({ ...script, panels: newPanels });
  };

  return (
    <section className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">剧本编辑</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-600 transition-colors"
        >
          重新构思
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={script.title}
          onChange={(e) => onScriptChange({ ...script, title: e.target.value })}
          className="w-full px-2 py-1 border rounded bg-transparent text-sm font-medium"
          placeholder="标题"
        />
        <input
          type="text"
          value={script.synopsis}
          onChange={(e) =>
            onScriptChange({ ...script, synopsis: e.target.value })
          }
          className="w-full px-2 py-1 border rounded bg-transparent text-sm"
          placeholder="简介"
        />
        {script.panels.map((panel, i) => (
          <PanelEditor key={i} panel={panel} index={i} onUpdate={updatePanel} />
        ))}
      </div>
    </section>
  );
}

function PanelEditor({
  panel,
  index,
  onUpdate,
}: {
  panel: MangaPanel;
  index: number;
  onUpdate: (index: number, updates: Partial<MangaPanel>) => void;
}) {
  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border">
      <p className="text-xs text-slate-400 mb-1">第 {index + 1} 格</p>
      <textarea
        value={panel.description}
        onChange={(e) => onUpdate(index, { description: e.target.value })}
        className="w-full px-2 py-1 border rounded bg-transparent text-xs resize-none h-16 mb-1"
        placeholder="画面描述"
      />
      <div className="grid grid-cols-2 gap-1">
        <input
          value={panel.dialogue ?? ""}
          onChange={(e) =>
            onUpdate(index, { dialogue: e.target.value || undefined })
          }
          className="px-2 py-1 border rounded bg-transparent text-xs"
          placeholder="对话（中文）"
        />
        <input
          value={panel.narration ?? ""}
          onChange={(e) =>
            onUpdate(index, { narration: e.target.value || undefined })
          }
          className="px-2 py-1 border rounded bg-transparent text-xs"
          placeholder="旁白"
        />
        <input
          value={panel.dialogueJa ?? ""}
          onChange={(e) =>
            onUpdate(index, { dialogueJa: e.target.value || undefined })
          }
          className="px-2 py-1 border rounded bg-transparent text-xs"
          placeholder="对话（日文）"
        />
        <input
          value={panel.sfx ?? ""}
          onChange={(e) =>
            onUpdate(index, { sfx: e.target.value || undefined })
          }
          className="px-2 py-1 border rounded bg-transparent text-xs"
          placeholder="拟声词"
        />
      </div>
    </div>
  );
}

function GenerateButton({
  onClick,
  disabled,
  phase,
  stageMessage,
  storyMode,
}: {
  onClick: () => void;
  disabled: boolean;
  phase: string;
  stageMessage: string;
  storyMode: boolean;
}) {
  const buttonText = disabled
    ? stageMessage
    : phase === "scriptReady"
      ? "用这个剧本作画"
      : storyMode
        ? "构思剧情"
        : "生成漫画";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
        disabled
          ? "bg-slate-400 cursor-not-allowed"
          : "bg-indigo-500 hover:bg-indigo-600"
      }`}
    >
      {buttonText}
    </button>
  );
}

function GenerationProgress({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      <p className="text-sm text-slate-500">{message}</p>
      <p className="text-xs text-slate-400">
        可以切换到其他页面，生成完成后会自动保存
      </p>
    </div>
  );
}

function GenerationComplete({
  projectId,
  onReset,
}: {
  projectId: Id<"projects">;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-sm text-green-600 font-medium">
        ✓ 生成完成！请查看历史记录
      </p>
      <button
        onClick={() => navigate({ page: "project", projectId })}
        className="text-sm text-indigo-500 underline hover:text-indigo-600 transition-colors"
      >
        查看历史记录
      </button>
      <button
        onClick={onReset}
        className="text-sm text-slate-500 hover:text-slate-600 transition-colors"
      >
        继续创作
      </button>
    </div>
  );
}
