import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  MANGA_STYLES,
  IMAGE_SIZES,
  IMAGE_QUALITIES,
  SCRIPT_MODELS,
  BUBBLE_MODES,
} from "../lib/constants";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { SelectField } from "../components/SelectField";
import { ColorModeToggle } from "../components/ColorModeToggle";
import { StoryModeToggle } from "../components/StoryModeToggle";

type SettingsUpdate = Record<string, string | number | boolean>;

export function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const upsertSettings = useMutation(api.settings.upsert);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(
    async (updates: SettingsUpdate) => {
      try {
        await upsertSettings(updates);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error("保存设置失败:", e);
      }
    },
    [upsertSettings],
  );

  if (!settings) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      {saved && <SaveNotification />}

      <DefaultStyleSection
        value={settings.defaultStyle}
        onChange={(value) => void handleSave({ defaultStyle: value })}
      />

      <GenerationParamsSection
        imageCount={settings.imageCount}
        imageSize={settings.imageSize}
        imageQuality={settings.imageQuality}
        onSave={(updates) => void handleSave(updates)}
      />

      <ColorModeSection
        isColor={settings.isColor}
        onChange={(value) => void handleSave({ isColor: value })}
      />

      <BubbleModeSection
        value={settings.bubbleTextMode}
        onChange={(value) => void handleSave({ bubbleTextMode: value })}
      />

      <StoryModeSection
        storyModeOn={settings.storyModeOn}
        panelCount={settings.panelCount}
        scriptModel={settings.scriptModel}
        onSave={(updates) => void handleSave(updates)}
      />

      <AboutSection scriptModel={settings.scriptModel} />
    </div>
  );
}

function LoadingState() {
  return <LoadingSpinner />;
}

function SaveNotification() {
  return (
    <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600">
      已保存
    </div>
  );
}

function DefaultStyleSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium mb-2">默认风格</h3>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
      >
        {MANGA_STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.displayName} - {s.subtitle}
          </option>
        ))}
      </select>
    </section>
  );
}

function GenerationParamsSection({
  imageCount,
  imageSize,
  imageQuality,
  onSave,
}: {
  imageCount: number;
  imageSize: string;
  imageQuality: string;
  onSave: (updates: SettingsUpdate) => void;
}) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium mb-3">生成参数</h3>
      <div className="flex flex-col gap-3">
        <SelectField
          label="图片数量"
          value={imageCount}
          onChange={(v) => onSave({ imageCount: Number(v) })}
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
          onChange={(v) => onSave({ imageSize: v })}
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
          onChange={(v) => onSave({ imageQuality: v })}
        >
          {IMAGE_QUALITIES.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </SelectField>
      </div>
    </section>
  );
}

function ColorModeSection({
  isColor,
  onChange,
}: {
  isColor: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium mb-2">默认色彩模式</h3>
      <ColorModeToggle isColor={isColor} onChange={(v) => onChange(v)} />
    </section>
  );
}

function BubbleModeSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium mb-2">默认对话框文字</h3>
      <div className="flex gap-2 flex-wrap">
        {BUBBLE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
              value === m.id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function StoryModeSection({
  storyModeOn,
  panelCount,
  scriptModel,
  onSave,
}: {
  storyModeOn: boolean;
  panelCount: number;
  scriptModel: string;
  onSave: (updates: SettingsUpdate) => void;
}) {
  return (
    <section className="mb-6">
      <StoryModeToggle
        storyMode={storyModeOn}
        onStoryModeChange={(v) => onSave({ storyModeOn: v })}
        panelCount={panelCount}
        onPanelCountChange={(v) => onSave({ panelCount: v })}
      />
      <div className="flex items-center gap-3 mt-3">
        <label className="text-sm text-slate-600 w-24">剧本模型</label>
        <select
          value={scriptModel}
          onChange={(e) => onSave({ scriptModel: e.target.value })}
          className="flex-1 px-2 py-1 border rounded bg-transparent text-sm"
        >
          {SCRIPT_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function AboutSection({ scriptModel }: { scriptModel: string }) {
  return (
    <section className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
      <p className="text-xs text-slate-400">
        LifeManga Web · 图片模型: gpt-image-2 · 剧本模型: {scriptModel} · API
        Key 由服务器管理
      </p>
    </section>
  );
}
