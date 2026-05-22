import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function requireOwnership<T extends { userId: Id<"users"> }>(
  ctx: QueryCtx | MutationCtx,
  resource: T | null | undefined,
  resourceName = "Resource",
): Promise<T> {
  const userId = await requireAuth(ctx);
  if (!resource || resource.userId !== userId) {
    throw new Error(`${resourceName} not found`);
  }
  return resource;
}
