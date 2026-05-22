import { useState, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CHARACTER_ART_STYLES, POSE_GROUPS } from "../lib/constants";
import { ArtStylePicker } from "./ArtStylePicker";
import { Button } from "./Button";

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
    <div className="mt-4 p-4 bg-cream-medium dark:bg-ink/50 rounded-card">
      <h3 className="font-medium text-sm mb-2">选择姿势</h3>
      {errorMessage && (
        <div className="mb-3 p-3 bg-error/8 dark:bg-error/20 border border-error/30 dark:border-error/50 rounded-card">
          <p className="text-xs text-error">{errorMessage}</p>
        </div>
      )}
      {POSE_GROUPS.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="text-xs text-ink-muted mb-1">{group.label}</p>
          <div className="flex gap-1 flex-wrap">
            {group.poses.map((pose) => (
              <button
                key={pose}
                type="button"
                onClick={() => togglePose(pose)}
                className={`px-2 py-1 rounded-thumb text-xs border-2 transition-colors ${
                  selectedPoses.includes(pose)
                    ? "border-ember bg-ember/8 dark:bg-ember/20"
                    : "border-cream-dark dark:border-ink-light"
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
          className={`flex-1 py-1.5 rounded-card border-2 text-xs transition-colors ${
            !isColor
              ? "border-ember bg-ember/8 dark:bg-ember/20 font-medium"
              : "border-cream-dark dark:border-ink-light"
          }`}
        >
          ⬛ 黑白
        </button>
        <button
          type="button"
          onClick={() => setIsColor(true)}
          className={`flex-1 py-1.5 rounded-card border-2 text-xs transition-colors ${
            isColor
              ? "border-ember bg-ember/8 dark:bg-ember/20 font-medium"
              : "border-cream-dark dark:border-ink-light"
          }`}
        >
          🌈 彩色
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => void handleGenerate()}
          disabled={isGenerating || selectedPoses.length === 0}
          loading={isGenerating}
        >
          {isGenerating ? "生成中..." : `生成 ${selectedPoses.length} 个姿势`}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          取消
        </Button>
      </div>
    </div>
  );
}
