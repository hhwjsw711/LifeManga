export function StoryModeToggle({
  storyMode,
  onStoryModeChange,
  panelCount,
  onPanelCountChange,
}: {
  storyMode: boolean;
  onStoryModeChange: (value: boolean) => void;
  panelCount: number;
  onPanelCountChange: (count: number) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">故事模式</h3>
        <button
          type="button"
          onClick={() => onStoryModeChange(!storyMode)}
          className={`w-10 h-6 rounded-full transition-colors flex items-center ${storyMode ? "bg-ember" : "bg-cream-darker dark:bg-ink-muted"}`}
          aria-label="故事模式开关"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${storyMode ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>
      {storyMode && (
        <div className="flex gap-2">
          {[4, 6, 8].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPanelCountChange(n)}
              className={`px-3 py-1 rounded-card text-sm border-2 transition-colors ${
                panelCount === n
                  ? "border-ember bg-ember/8 dark:bg-ember/20"
                  : "border-cream-dark dark:border-ink-light"
              }`}
            >
              {n} 格
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
