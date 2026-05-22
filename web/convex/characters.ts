import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireOwnership } from "./authHelpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    return await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return null;
    const character = await ctx.db.get("characters", args.characterId);
    if (!character || character.userId !== userId) return null;
    return character;
  },
});

export const getViews = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    const character = await ctx.db.get("characters", args.characterId);
    if (!character || character.userId !== userId) return [];
    return await ctx.db
      .query("characterViews")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    sourcePhotoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.insert("characters", {
      userId,
      name: args.name,
      bio: args.bio,
      sourcePhotoId: args.sourcePhotoId,
    });
  },
});

export const rename = mutation({
  args: { characterId: v.id("characters"), name: v.string() },
  handler: async (ctx, args) => {
    const character = await ctx.db.get("characters", args.characterId);
    await requireOwnership(ctx, character, "Character");
    await ctx.db.patch("characters", args.characterId, { name: args.name });
  },
});

export const updateBio = mutation({
  args: { characterId: v.id("characters"), bio: v.string() },
  handler: async (ctx, args) => {
    const character = await ctx.db.get("characters", args.characterId);
    await requireOwnership(ctx, character, "Character");
    await ctx.db.patch("characters", args.characterId, { bio: args.bio });
  },
});

export const addView = mutation({
  args: {
    characterId: v.id("characters"),
    label: v.string(),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get("characters", args.characterId);
    await requireOwnership(ctx, character, "Character");
    return await ctx.db.insert("characterViews", {
      characterId: args.characterId,
      label: args.label,
      imageId: args.imageId,
    });
  },
});

export const removeView = mutation({
  args: { viewId: v.id("characterViews") },
  handler: async (ctx, args) => {
    const view = await ctx.db.get("characterViews", args.viewId);
    if (!view) throw new Error("Not found");
    const character = await ctx.db.get("characters", view.characterId);
    await requireOwnership(ctx, character, "Character");
    await ctx.storage.delete(view.imageId);
    await ctx.db.delete("characterViews", args.viewId);
  },
});

export const remove = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const character = await requireOwnership(
      ctx,
      await ctx.db.get("characters", args.characterId),
      "Character",
    );

    if (character.sourcePhotoId) {
      await ctx.storage.delete(character.sourcePhotoId);
    }

    const views = await ctx.db
      .query("characterViews")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();
    for (const view of views) {
      await ctx.storage.delete(view.imageId);
      await ctx.db.delete("characterViews", view._id);
    }

    await ctx.db.delete("characters", args.characterId);
  },
});

export const getForAction = internalQuery({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const character = await ctx.db.get("characters", args.characterId);
    if (!character) return null;
    return { sourcePhotoId: character.sourcePhotoId };
  },
});
