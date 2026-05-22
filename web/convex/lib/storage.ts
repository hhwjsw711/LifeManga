import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

export async function deleteStorageImages(
  ctx: GenericMutationCtx<DataModel>,
  imageIds: Id<"_storage">[],
): Promise<void> {
  for (const imgId of imageIds) {
    try {
      await ctx.storage.delete(imgId);
    } catch (e) {
      console.error(`Failed to delete storage image ${imgId}:`, e);
    }
  }
}
