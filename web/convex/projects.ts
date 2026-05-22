import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return null;
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.insert("projects", {
      userId,
      name: args.name,
    });
  },
});

export const rename = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found");
    await ctx.db.patch("projects", args.projectId, { name: args.name });
  },
});

export const setCover = mutation({
  args: {
    projectId: v.id("projects"),
    coverItemId: v.optional(v.id("mangaItems")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found");
    await ctx.db.patch("projects", args.projectId, {
      coverItemId: args.coverItemId,
    });
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== userId)
      throw new Error("Project not found");

    const [items, jobs] = await Promise.all([
      ctx.db
        .query("mangaItems")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
      ctx.db
        .query("jobs")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
    ]);

    for (const job of jobs) {
      if (job.userId === userId) {
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
        await ctx.db.delete("jobs", job._id);
      }
    }

    for (const item of items) {
      if (item.userId === userId) {
        for (const storageId of [
          ...item.inputImageIds,
          ...item.outputImageIds,
        ]) {
          try {
            await ctx.storage.delete(storageId);
          } catch {
            // storage cleanup best-effort
          }
        }
        await ctx.db.delete("mangaItems", item._id);
      }
    }

    await ctx.db.delete("projects", args.projectId);
  },
});
