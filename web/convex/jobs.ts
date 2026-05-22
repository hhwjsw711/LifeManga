import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireOwnership } from "./authHelpers";
import { getAuthUserId } from "@convex-dev/auth/server";

import { DEDUP_WINDOW_MS, STALE_THRESHOLD_MS } from "./lib/prompts";

const MAX_LOG_ENTRIES = 100;
const MAX_RETRY_COUNT = 5;

function appendLog(
  existing:
    | Array<{ timestamp: number; level: string; message: string }>
    | undefined,
  entry: { timestamp: number; level: string; message: string },
): Array<{ timestamp: number; level: string; message: string }> {
  const logs = [...(existing ?? []), entry];
  return logs.length > MAX_LOG_ENTRIES ? logs.slice(-MAX_LOG_ENTRIES) : logs;
}

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const listRunning = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    return await ctx.db
      .query("jobs")
      .withIndex("by_user_and_phase", (q) =>
        q.eq("userId", userId).eq("phase", "running"),
      )
      .collect();
  },
});

export const get = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return null;
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job || job.userId !== userId) return null;
    return job;
  },
});

export const getLogs = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job || job.userId !== userId) return [];
    return job.logs ?? [];
  },
});

export const startJob = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    projectName: v.string(),
    style: v.string(),
    kind: v.union(
      v.literal("simpleImage"),
      v.literal("storyScript"),
      v.literal("storyRender"),
      v.literal("characterViews"),
    ),
    characterId: v.optional(v.id("characters")),
    characterName: v.optional(v.string()),
    artStyle: v.optional(v.string()),
    inputImageIds: v.optional(v.array(v.id("_storage"))),
    previousPageImageId: v.optional(v.id("_storage")),
    characterIds: v.optional(v.array(v.id("characters"))),
    userPromptText: v.optional(v.string()),
    bubbleMode: v.optional(v.string()),
    wasColorOn: v.optional(v.boolean()),
    imageCount: v.optional(v.number()),
    imageSize: v.optional(v.string()),
    imageQuality: v.optional(v.string()),
    panelCount: v.optional(v.number()),
    scriptModel: v.optional(v.string()),
    requestHash: v.optional(v.string()),
    subtitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.requestHash) {
      const recentJobs = await ctx.db
        .query("jobs")
        .withIndex("by_user_and_hash", (q) =>
          q.eq("userId", userId).eq("requestHash", args.requestHash),
        )
        .collect();

      for (const job of recentJobs) {
        if (Date.now() - job._creationTime < DEDUP_WINDOW_MS) {
          if (job.phase === "running" || job.phase === "done") {
            return job._id;
          }
        }
      }
    }

    return await ctx.db.insert("jobs", {
      userId,
      projectId: args.projectId,
      projectName: args.projectName,
      style: args.style,
      kind: args.kind,
      phase: "running",
      stageMessage: "准备中...",
      characterId: args.characterId,
      characterName: args.characterName,
      artStyle: args.artStyle,
      inputImageIds: args.inputImageIds,
      previousPageImageId: args.previousPageImageId,
      characterIds: args.characterIds,
      userPromptText: args.userPromptText,
      bubbleMode: args.bubbleMode,
      wasColorOn: args.wasColorOn,
      imageCount: args.imageCount,
      imageSize: args.imageSize,
      imageQuality: args.imageQuality,
      panelCount: args.panelCount,
      scriptModel: args.scriptModel,
      requestHash: args.requestHash,
      subtitle: args.subtitle,
      manualRetryCount: 0,
      logs: [{ timestamp: Date.now(), level: "info", message: "任务已创建" }],
    });
  },
});

export const updateStage = internalMutation({
  args: { jobId: v.id("jobs"), stageMessage: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    await ctx.db.patch("jobs", args.jobId, {
      stageMessage: args.stageMessage,
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: "info",
        message: args.stageMessage,
      }),
    });
  },
});

export const addLog = internalMutation({
  args: {
    jobId: v.id("jobs"),
    level: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    await ctx.db.patch("jobs", args.jobId, {
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: args.level,
        message: args.message,
      }),
    });
  },
});

export const completeJob = internalMutation({
  args: {
    jobId: v.id("jobs"),
    resultItemId: v.optional(v.id("mangaItems")),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    await ctx.db.patch("jobs", args.jobId, {
      phase: "done",
      stageMessage: "完成",
      resultItemId: args.resultItemId,
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: "success",
        message: "任务完成",
      }),
    });
  },
});

export const failJob = internalMutation({
  args: { jobId: v.id("jobs"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    await ctx.db.patch("jobs", args.jobId, {
      phase: "failed",
      stageMessage: "失败",
      errorMessage: args.errorMessage,
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: "error",
        message: args.errorMessage,
      }),
    });
  },
});

export const timeoutJob = internalMutation({
  args: { jobId: v.id("jobs"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    if (job.phase === "running") {
      await ctx.db.patch("jobs", args.jobId, {
        phase: "timeoutUnknown",
        stageMessage: "超时，结果未知",
        errorMessage: args.errorMessage,
        logs: appendLog(job.logs, {
          timestamp: Date.now(),
          level: "error",
          message: `超时: ${args.errorMessage}`,
        }),
      });
    }
  },
});

export const cancelJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await requireOwnership(
      ctx,
      await ctx.db.get("jobs", args.jobId),
      "Job",
    );
    if (job.phase === "running") {
      await ctx.db.patch("jobs", args.jobId, {
        phase: "failed",
        stageMessage: "已取消",
        errorMessage: "用户取消",
        logs: appendLog(job.logs, {
          timestamp: Date.now(),
          level: "warning",
          message: "用户取消任务",
        }),
      });
    }
  },
});

export const retryJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await requireOwnership(
      ctx,
      await ctx.db.get("jobs", args.jobId),
      "Job",
    );
    if (job.phase !== "failed" && job.phase !== "timeoutUnknown") {
      throw new Error("只能重试失败或超时的任务");
    }
    const currentRetryCount = job.manualRetryCount ?? 0;
    if (currentRetryCount >= MAX_RETRY_COUNT) {
      throw new Error(`已达到最大重试次数 (${MAX_RETRY_COUNT}次)`);
    }
    const retryCount = currentRetryCount + 1;
    await ctx.db.patch("jobs", args.jobId, {
      phase: "running",
      stageMessage: `重试中 (第${retryCount}次)...`,
      errorMessage: undefined,
      manualRetryCount: retryCount,
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: "warning",
        message: `用户发起重试 (第${retryCount}次)`,
      }),
    });
    return args.jobId;
  },
});

export const removeJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await requireOwnership(
      ctx,
      await ctx.db.get("jobs", args.jobId),
      "Job",
    );
    if (job.inputImageIds) {
      for (const storageId of job.inputImageIds) {
        try {
          await ctx.storage.delete(storageId);
        } catch {
          // storage cleanup best-effort
        }
      }
    }
    if (job.previousPageImageId) {
      try {
        await ctx.storage.delete(job.previousPageImageId);
      } catch {
        // storage cleanup best-effort
      }
    }
    await ctx.db.delete("jobs", args.jobId);
  },
});

export const clearFinished = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const [done, failed, timeout] = await Promise.all([
      ctx.db
        .query("jobs")
        .withIndex("by_user_and_phase", (q) =>
          q.eq("userId", userId).eq("phase", "done"),
        )
        .collect(),
      ctx.db
        .query("jobs")
        .withIndex("by_user_and_phase", (q) =>
          q.eq("userId", userId).eq("phase", "failed"),
        )
        .collect(),
      ctx.db
        .query("jobs")
        .withIndex("by_user_and_phase", (q) =>
          q.eq("userId", userId).eq("phase", "timeoutUnknown"),
        )
        .collect(),
    ]);
    for (const job of [...done, ...failed, ...timeout]) {
      await ctx.db.delete("jobs", job._id);
    }
  },
});

export const sweepStaleRunning = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return 0;
    const running = await ctx.db
      .query("jobs")
      .withIndex("by_user_and_phase", (q) =>
        q.eq("userId", userId).eq("phase", "running"),
      )
      .collect();
    let swept = 0;
    for (const job of running) {
      if (Date.now() - job._creationTime > STALE_THRESHOLD_MS) {
        await ctx.db.patch("jobs", job._id, {
          phase: "timeoutUnknown",
          stageMessage: "超时，结果未知",
          errorMessage: "任务运行时间过长，可能已超时",
          logs: appendLog(job.logs, {
            timestamp: Date.now(),
            level: "warning",
            message: "自动标记为超时（残留运行任务）",
          }),
        });
        swept++;
      }
    }
    return swept;
  },
});

export const verifyOwnership = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job || job.userId !== userId) return null;
    return job;
  },
});

export const getForRetry = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return null;
    return {
      kind: job.kind,
      phase: job.phase,
      style: job.style,
      userPromptText: job.userPromptText,
      wasColorOn: job.wasColorOn,
      bubbleMode: job.bubbleMode,
      inputImageIds: job.inputImageIds,
      previousPageImageId: job.previousPageImageId,
      characterIds: job.characterIds,
      imageCount: job.imageCount,
      imageSize: job.imageSize,
      imageQuality: job.imageQuality,
      panelCount: job.panelCount,
      scriptModel: job.scriptModel,
    };
  },
});

export const resetForRetry = internalMutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) return;
    if (job.phase !== "failed" && job.phase !== "timeoutUnknown") {
      throw new Error("只能重试失败或超时的任务");
    }
    const retryCount = (job.manualRetryCount ?? 0) + 1;
    await ctx.db.patch("jobs", args.jobId, {
      phase: "running",
      stageMessage: `重试中 (第${retryCount}次)...`,
      errorMessage: undefined,
      manualRetryCount: retryCount,
      logs: appendLog(job.logs, {
        timestamp: Date.now(),
        level: "warning",
        message: `用户发起重试 (第${retryCount}次)`,
      }),
    });
  },
});
