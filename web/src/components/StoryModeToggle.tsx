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
          className={`w-10 h-6 rounded-full transition-colors ${storyMode ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`}
          aria-label="故事模式开关"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${storyMode ? "translate-x-5" : "translate-x-1"} mt-1`}
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
              className={`px-3 py-1 rounded-lg text-sm border-2 transition-colors ${
                panelCount === n
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                  : "border-slate-200 dark:border-slate-700"
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
