import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { LoadingSpinner } from "../components/LoadingSpinner";

const JOB_KIND_LABELS = {
  simpleImage: "简单生成",
  storyScript: "剧本构思",
  storyRender: "剧本渲染",
  characterViews: "角色生成",
} as const;

const PHASE_ICONS = {
  running: "⏳",
  done: "✅",
  failed: "❌",
  timeoutUnknown: "❓",
} as const;

const PHASE_COLORS = {
  running: "text-indigo-500",
  done: "text-green-500",
  failed: "text-red-500",
  timeoutUnknown: "text-amber-500",
} as const;

export function TaskManagerPage() {
  const jobs = useQuery(api.jobs.listByUser);
  const cancelJob = useMutation(api.jobs.cancelJob);
  const retryJobAction = useAction(api.openai.retryJobAction);
  const removeJob = useMutation(api.jobs.removeJob);
  const clearFinished = useMutation(api.jobs.clearFinished);
  const sweepStaleRunning = useMutation(api.jobs.sweepStaleRunning);
  const [retryingJobId, setRetryingJobId] = useState<Id<"jobs"> | null>(null);

  useEffect(() => {
    void sweepStaleRunning();
  }, [sweepStaleRunning]);

  const handleRetry = async (jobId: Id<"jobs">, phase: string) => {
    if (phase === "timeoutUnknown") {
      const confirmed = confirm(
        "此任务超时但 OpenAI 端可能仍在处理，重试可能导致重复扣费。确定要重试吗？",
      );
      if (!confirmed) return;
    }
    setRetryingJobId(jobId);
    try {
      await retryJobAction({ jobId });
    } catch {
      alert("重试失败，请稍后再试");
    } finally {
      setRetryingJobId(null);
    }
  };

  if (!jobs) {
    return <LoadingState />;
  }

  const running = jobs.filter((j) => j.phase === "running");
  const others = jobs.filter((j) => j.phase !== "running");

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PageHeader
        hasFinishedJobs={others.length > 0}
        onClearFinished={() => void clearFinished()}
      />

      {jobs.length === 0 && <EmptyState />}

      {running.length > 0 && (
        <JobSection
          title="进行中"
          jobs={running}
          onCancel={(args) => void cancelJob(args)}
        />
      )}

      {others.length > 0 && (
        <JobSection
          title="历史"
          jobs={others}
          retryingJobId={retryingJobId}
          onRetry={(args) => void handleRetry(args.jobId, args.phase)}
          onDelete={(args) => void removeJob(args)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return <LoadingSpinner />;
}

function PageHeader({
  hasFinishedJobs,
  onClearFinished,
}: {
  hasFinishedJobs: boolean;
  onClearFinished: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">任务管理</h1>
      {hasFinishedJobs && (
        <button
          onClick={onClearFinished}
          className="px-4 py-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
        >
          清除已完成
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
      <p className="text-sm">暂无任务</p>
    </div>
  );
}

function JobSection({
  title,
  jobs,
  onCancel,
  onRetry,
  onDelete,
  retryingJobId,
}: {
  title: string;
  jobs: Doc<"jobs">[];
  onCancel?: (args: { jobId: Id<"jobs"> }) => void;
  onRetry?: (args: { jobId: Id<"jobs">; phase: string }) => void;
  onDelete?: (args: { jobId: Id<"jobs"> }) => void;
  retryingJobId?: Id<"jobs"> | null;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            isRetrying={job._id === retryingJobId}
            onCancel={
              onCancel ? () => void onCancel({ jobId: job._id }) : undefined
            }
            onRetry={
              onRetry
                ? () => void onRetry({ jobId: job._id, phase: job.phase })
                : undefined
            }
            onDelete={
              onDelete ? () => void onDelete({ jobId: job._id }) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function JobCard({
  job,
  isRetrying,
  onCancel,
  onRetry,
  onDelete,
}: {
  job: Doc<"jobs">;
  isRetrying?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
}) {
  const [showLogs, setShowLogs] = useState(false);
  const canRetry =
    (job.phase === "failed" || job.phase === "timeoutUnknown") && onRetry;
  const hasLogs = job.logs && job.logs.length > 0;

  return (
    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <JobHeader job={job} />
      <JobMessage job={job} />
      <JobProgress job={job} />
      <JobRetryCount job={job} />
      <JobLogs job={job} showLogs={showLogs} />
      <JobActions
        job={job}
        showLogs={showLogs}
        hasLogs={!!hasLogs}
        canRetry={!!canRetry}
        isRetrying={!!isRetrying}
        onToggleLogs={() => setShowLogs(!showLogs)}
        onRetry={onRetry}
        onCancel={onCancel}
        onDelete={onDelete}
      />
      <JobTimestamp job={job} />
    </div>
  );
}

function JobHeader({ job }: { job: Doc<"jobs"> }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`text-lg ${PHASE_COLORS[job.phase] ?? ""}`}
          aria-hidden="true"
        >
          {PHASE_ICONS[job.phase] ?? "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {job.characterName ?? job.projectName} -{" "}
            {JOB_KIND_LABELS[job.kind] ?? job.kind}
          </p>
          {job.subtitle && (
            <p className="text-xs text-slate-400 truncate">{job.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function JobMessage({ job }: { job: Doc<"jobs"> }) {
  return (
    <div className="mt-1">
      <p className="text-xs text-slate-400">{job.stageMessage}</p>
      {job.errorMessage && (
        <p className="text-xs text-red-500 mt-1">{job.errorMessage}</p>
      )}
    </div>
  );
}

function JobProgress({ job }: { job: Doc<"jobs"> }) {
  if (job.phase !== "running") return null;
  return (
    <div className="mt-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 rounded-full animate-pulse w-2/3" />
    </div>
  );
}

function JobRetryCount({ job }: { job: Doc<"jobs"> }) {
  if (!job.manualRetryCount || job.manualRetryCount === 0) return null;
  return (
    <p className="text-[10px] text-slate-400 mt-1">
      已重试 {job.manualRetryCount} 次
    </p>
  );
}

function JobLogs({ job, showLogs }: { job: Doc<"jobs">; showLogs: boolean }) {
  if (!showLogs || !job.logs || job.logs.length === 0) return null;

  return (
    <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg max-h-48 overflow-y-auto">
      {job.logs.map((log, i) => (
        <LogEntry key={i} log={log} />
      ))}
    </div>
  );
}

function LogEntry({
  log,
}: {
  log: { timestamp: number; level: string; message: string };
}) {
  const levelIcon =
    log.level === "error"
      ? "✗"
      : log.level === "success"
        ? "✓"
        : log.level === "warning"
          ? "⚠"
          : "ℹ";
  const levelColor =
    log.level === "error"
      ? "text-red-500"
      : log.level === "success"
        ? "text-green-500"
        : log.level === "warning"
          ? "text-amber-500"
          : "text-slate-500";

  return (
    <div className="flex gap-2 text-xs py-0.5">
      <span className="text-slate-400 shrink-0">
        {new Date(log.timestamp).toLocaleTimeString("zh-CN")}
      </span>
      <span className={`shrink-0 ${levelColor}`}>{levelIcon}</span>
      <span className="text-slate-600 dark:text-slate-300 break-all">
        {log.message}
      </span>
    </div>
  );
}

function JobActions({
  job,
  showLogs,
  hasLogs,
  canRetry,
  isRetrying,
  onToggleLogs,
  onRetry,
  onCancel,
  onDelete,
}: {
  job: Doc<"jobs">;
  showLogs: boolean;
  hasLogs: boolean;
  canRetry: boolean;
  isRetrying?: boolean;
  onToggleLogs: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex gap-1 mt-2">
      {hasLogs && (
        <button
          onClick={onToggleLogs}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            showLogs
              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600"
              : "text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600"
          }`}
        >
          日志
        </button>
      )}
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="px-2 py-1 text-xs text-amber-600 border border-amber-200 dark:border-amber-800 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? "重试中..." : "重试"}
        </button>
      )}
      {onCancel && job.phase === "running" && (
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          取消
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-2 py-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          删除
        </button>
      )}
    </div>
  );
}

function JobTimestamp({ job }: { job: Doc<"jobs"> }) {
  return (
    <p className="text-[10px] text-slate-400 mt-1">
      {new Date(job._creationTime).toLocaleString("zh-CN")}
    </p>
  );
}
