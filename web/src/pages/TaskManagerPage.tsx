import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/Button";

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
  running: "text-ember",
  done: "text-success",
  failed: "text-error",
  timeoutUnknown: "text-warning",
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
    <div className="max-w-2xl mx-auto p-6">
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
          className="text-sm text-ink-muted hover:text-error transition-colors"
        >
          清除已完成
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-ink-muted">
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
      <h3 className="text-sm font-medium text-ink-muted mb-2">{title}</h3>
      <div className="flex flex-col gap-3">
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
    <div className="p-4 bg-cream-light dark:bg-ink-medium rounded-card border-2 border-cream-dark dark:border-ink-light">
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
            <p className="text-xs text-ink-muted truncate">{job.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function JobMessage({ job }: { job: Doc<"jobs"> }) {
  return (
    <div className="mt-1">
      <p className="text-xs text-ink-muted">{job.stageMessage}</p>
      {job.errorMessage && (
        <p className="text-xs text-error mt-1">{job.errorMessage}</p>
      )}
    </div>
  );
}

function JobProgress({ job }: { job: Doc<"jobs"> }) {
  if (job.phase !== "running") return null;
  return (
    <div className="mt-1 h-1 bg-cream-dark dark:bg-ink-light rounded-full overflow-hidden">
      <div className="h-full bg-ember rounded-full animate-pulse w-2/3" />
    </div>
  );
}

function JobRetryCount({ job }: { job: Doc<"jobs"> }) {
  if (!job.manualRetryCount || job.manualRetryCount === 0) return null;
  return (
    <p className="text-[10px] text-ink-muted mt-1">
      已重试 {job.manualRetryCount} 次
    </p>
  );
}

function JobLogs({ job, showLogs }: { job: Doc<"jobs">; showLogs: boolean }) {
  if (!showLogs || !job.logs || job.logs.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-cream-medium dark:bg-ink rounded-card max-h-48 overflow-y-auto">
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
      ? "text-error"
      : log.level === "success"
        ? "text-success"
        : log.level === "warning"
          ? "text-warning"
          : "text-ink-muted";

  return (
    <div className="flex gap-2 text-xs py-0.5">
      <span className="text-ink-muted shrink-0">
        {new Date(log.timestamp).toLocaleTimeString("zh-CN")}
      </span>
      <span className={`shrink-0 ${levelColor}`}>{levelIcon}</span>
      <span className="text-ink-light dark:text-cream-light break-all">
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
          className={`px-3 py-1 text-xs rounded-pill border-2 transition-colors ${
            showLogs
              ? "bg-ember/8 dark:bg-ember/20 border-ember/30 text-ember-dark dark:text-ember-light"
              : "text-ink-muted border-cream-dark dark:border-ink-light hover:text-ink"
          }`}
        >
          日志
        </button>
      )}
      {canRetry && onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="!text-warning !border-warning/30 dark:!border-warning/30 hover:!bg-warning/10"
        >
          {isRetrying ? "重试中..." : "重试"}
        </Button>
      )}
      {onCancel && job.phase === "running" && (
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-error border-2 border-error/30 rounded-pill hover:bg-error/10 transition-colors"
        >
          取消
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-1 text-xs text-ink-muted hover:text-error transition-colors"
        >
          删除
        </button>
      )}
    </div>
  );
}

function JobTimestamp({ job }: { job: Doc<"jobs"> }) {
  return (
    <p className="text-[10px] text-ink-muted mt-1">
      {new Date(job._creationTime).toLocaleString("zh-CN")}
    </p>
  );
}
