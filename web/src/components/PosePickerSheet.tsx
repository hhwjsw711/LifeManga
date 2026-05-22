import { useState, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CHARACTER_ART_STYLES, POSE_GROUPS } from "../lib/constants";
import { ArtStylePicker } from "./ArtStylePicker";

interface Props {
  characterId: Id<"characters">;
  characterName: string;
  characterBio?: string;
  sourcePhotoId?: Id<"_storage">;
  onClose: () => void;
}

export function PosePickerSheet({
  characterId,
  characterName,
  characterBio,
  sourcePhotoId,
  onClose,
}: Props) {
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("jpAnime");
  const [isColor, setIsColor] = useState(false);
  const addView = useMutation(api.characters.addView);
  const startJob = useMutation(api.jobs.startJob);
  const generatePoseSheet = useAction(api.openai.generatePoseSheet);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const togglePose = useCallback((pose: string) => {
    setSelectedPoses((prev) =>
      prev.includes(pose) ? prev.filter((p) => p !== pose) : [...prev, pose],
    );
  }, []);

  const handleGenerate = async () => {
    if (!sourcePhotoId || selectedPoses.length === 0) return;
    setIsGenerating(true);
    setErrorMessage(null);
    const artStyle = CHARACTER_ART_STYLES.find((s) => s.id === selectedStyle);

    try {
      const job = await startJob({
        characterId,
        characterName,
        style: selectedStyle,
        kind: "characterViews",
        projectName: "",
        artStyle: selectedStyle,
      });

      const result = await generatePoseSheet({
        jobId: job,
        sourcePhotoId,
        name: characterName,
        bio: characterBio,
        poseLabels: selectedPoses,
        artStylePrompt: artStyle?.prompt ?? "",
        isColor,
        size: "1024x1024",
        quality: "medium",
      });

      if (result) {
        await addView({
          characterId,
          label: selectedPoses.join(", "),
          imageId: result,
        });
        onClose();
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "生成姿势图失败");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <h3 className="font-medium text-sm mb-2">选择姿势</h3>
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}
      {POSE_GROUPS.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="text-xs text-slate-400 mb-1">{group.label}</p>
          <div className="flex gap-1 flex-wrap">
            {group.poses.map((pose) => (
              <button
                key={pose}
                type="button"
                onClick={() => togglePose(pose)}
                className={`px-2 py-1 rounded text-xs border transition-colors ${
                  selectedPoses.includes(pose)
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {pose}
              </button>
            ))}
          </div>
        </div>
      ))}

      <h3 className="font-medium text-sm mb-2">画风</h3>
      <ArtStylePicker
        value={selectedStyle}
        onChange={(v) => setSelectedStyle(v as string)}
      />

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => setIsColor(false)}
          className={`flex-1 py-1.5 rounded-lg border-2 text-xs transition-colors ${
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
          className={`flex-1 py-1.5 rounded-lg border-2 text-xs transition-colors ${
            isColor
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
              : "border-slate-200 dark:border-slate-700"
          }`}
        >
          🌈 彩色
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => void handleGenerate()}
          disabled={isGenerating || selectedPoses.length === 0}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-indigo-600 transition-colors"
        >
          {isGenerating ? "生成中..." : `生成 ${selectedPoses.length} 个姿势`}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-500 text-sm hover:text-slate-600 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
