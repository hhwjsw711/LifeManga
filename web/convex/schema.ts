import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    coverItemId: v.optional(v.id("mangaItems")),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  mangaItems: defineTable({
    userId: v.id("users"),
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
    isFavorite: v.boolean(),
  })
    .index("by_project", ["projectId"])
    .index("by_user_and_project", ["userId", "projectId"]),

  characters: defineTable({
    userId: v.id("users"),
    name: v.string(),
    bio: v.optional(v.string()),
    sourcePhotoId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),

  characterViews: defineTable({
    characterId: v.id("characters"),
    label: v.string(),
    imageId: v.id("_storage"),
  }).index("by_character", ["characterId"]),

  jobs: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    projectName: v.string(),
    style: v.string(),
    kind: v.union(
      v.literal("simpleImage"),
      v.literal("storyScript"),
      v.literal("storyRender"),
      v.literal("characterViews"),
    ),
    phase: v.union(
      v.literal("running"),
      v.literal("timeoutUnknown"),
      v.literal("done"),
      v.literal("failed"),
    ),
    stageMessage: v.string(),
    subtitle: v.optional(v.string()),
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
    resultItemId: v.optional(v.id("mangaItems")),
    errorMessage: v.optional(v.string()),
    manualRetryCount: v.optional(v.number()),
    logs: v.optional(
      v.array(
        v.object({
          timestamp: v.number(),
          level: v.string(),
          message: v.string(),
        }),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_phase", ["userId", "phase"])
    .index("by_user_and_hash", ["userId", "requestHash"])
    .index("by_project", ["projectId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    defaultStyle: v.string(),
    imageCount: v.number(),
    imageSize: v.string(),
    imageQuality: v.string(),
    storyModeOn: v.boolean(),
    panelCount: v.number(),
    scriptModel: v.string(),
    bubbleTextMode: v.string(),
    isColor: v.boolean(),
  }).index("by_user", ["userId"]),
});
