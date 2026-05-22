import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";
import { deleteStorageImages } from "./lib/storage";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId) return [];
    return await ctx.db
      .query("mangaItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { itemId: v.id("mangaItems") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return null;
    const item = await ctx.db.get("mangaItems", args.itemId);
    if (!item || item.userId !== userId) return null;
    return item;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    style: v.string(),
    inputImageIds: v.array(v.id("_storage")),
    outputImageIds: v.array(v.id("_storage")),
    userPrompt: v.optional(v.string()),
    storyScript: v.optional(
      v.object({
        title: v.string(),
        synopsis: v.string(),
        panels: v.array(
          v.object({
            description: v.string(),
            dialogue: v.optional(v.string()),
            dialogueJa: v.optional(v.string()),
            narration: v.optional(v.string()),
            narrationJa: v.optional(v.string()),
            sfx: v.optional(v.string()),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found");

    const itemId = await ctx.db.insert("mangaItems", {
      userId,
      projectId: args.projectId,
      style: args.style,
      inputImageIds: args.inputImageIds,
      outputImageIds: args.outputImageIds,
      userPrompt: args.userPrompt,
      storyScript: args.storyScript,
      isFavorite: false,
    });

    if (!project.coverItemId) {
      await ctx.db.patch("projects", args.projectId, { coverItemId: itemId });
    }

    return itemId;
  },
});

export const toggleFavorite = mutation({
  args: { itemId: v.id("mangaItems") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const item = await ctx.db.get("mangaItems", args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.patch("mangaItems", args.itemId, {
      isFavorite: !item.isFavorite,
    });
  },
});

export const remove = mutation({
  args: { itemId: v.id("mangaItems") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const item = await ctx.db.get("mangaItems", args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    if (item.projectId) {
      const project = await ctx.db.get("projects", item.projectId);
      if (project?.coverItemId === args.itemId) {
        await ctx.db.patch("projects", item.projectId, {
          coverItemId: undefined,
        });
      }
    }

    await deleteStorageImages(ctx, [
      ...item.inputImageIds,
      ...item.outputImageIds,
    ]);
    await ctx.db.delete("mangaItems", args.itemId);
  },
});

export const createFromAction = internalMutation({
  args: {
    jobId: v.id("jobs"),
    outputStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) throw new Error("Job not found");
    if (!job.projectId) throw new Error("Job has no project");

    const itemId = await ctx.db.insert("mangaItems", {
      userId: job.userId,
      projectId: job.projectId,
      style: job.style,
      inputImageIds: job.inputImageIds ?? [],
      outputImageIds: args.outputStorageIds,
      userPrompt: job.userPromptText,
      isFavorite: false,
    });

    const project = await ctx.db.get("projects", job.projectId);
    if (project && !project.coverItemId) {
      await ctx.db.patch("projects", job.projectId, { coverItemId: itemId });
    }

    await ctx.db.patch("jobs", args.jobId, {
      phase: "done",
      stageMessage: "完成",
      resultItemId: itemId,
    });
  },
});

export const listFavorites = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    const items = await ctx.db
      .query("mangaItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return items.filter((item) => item.isFavorite);
  },
});
