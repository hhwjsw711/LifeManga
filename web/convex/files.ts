import { mutation, query } from "./_generated/server";
import { GenericDatabaseReader } from "convex/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, DataModel } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const isReferenced = await isStorageIdReferencedByUser(
      ctx.db,
      userId,
      args.storageId,
    );
    if (!isReferenced) return null;

    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");

    const isReferenced = await isStorageIdReferencedByUser(
      ctx.db,
      userId,
      args.storageId,
    );
    if (!isReferenced) {
      const isReferencedByAnyone = await isStorageIdReferencedByAnyUser(
        ctx.db,
        args.storageId,
      );
      if (isReferencedByAnyone) {
        throw new Error("无权删除此文件");
      }
    }

    await ctx.storage.delete(args.storageId);
  },
});

async function isStorageIdReferencedByUser(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  storageId: Id<"_storage">,
): Promise<boolean> {
  const mangaItems = await db
    .query("mangaItems")
    .withIndex("by_user_and_project", (q) => q.eq("userId", userId))
    .collect();

  for (const item of mangaItems) {
    if ([...item.inputImageIds, ...item.outputImageIds].includes(storageId)) {
      return true;
    }
  }

  const characters = await db
    .query("characters")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const character of characters) {
    if (character.sourcePhotoId === storageId) return true;

    const views = await db
      .query("characterViews")
      .withIndex("by_character", (q) => q.eq("characterId", character._id))
      .collect();

    for (const view of views) {
      if (view.imageId === storageId) return true;
    }
  }

  return false;
}

async function isStorageIdReferencedByAnyUser(
  db: GenericDatabaseReader<DataModel>,
  storageId: Id<"_storage">,
): Promise<boolean> {
  const allMangaItems = await db.query("mangaItems").collect();
  for (const item of allMangaItems) {
    if ([...item.inputImageIds, ...item.outputImageIds].includes(storageId)) {
      return true;
    }
  }

  const allCharacters = await db.query("characters").collect();
  for (const character of allCharacters) {
    if (character.sourcePhotoId === storageId) return true;
  }

  const allViews = await db.query("characterViews").collect();
  for (const view of allViews) {
    if (view.imageId === storageId) return true;
  }

  return false;
}
