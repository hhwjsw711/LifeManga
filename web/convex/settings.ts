import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

const VALID_STYLES = [
  "shonenJump",
  "sliceOfLife",
  "darkSeinen",
  "retroGekiga",
  "chibi4Koma",
  "sportsHotBlooded",
  "scifiMecha",
  "horrorJunjiIto",
];
const VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024", "auto"];
const VALID_QUALITIES = ["low", "medium", "high", "auto"];
const VALID_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"];

const VALID_BUBBLE_MODES = ["chinese", "japanese", "english", "empty", "none"];
const VALID_IMAGE_COUNTS = [1, 2, 3, 4];
const VALID_PANEL_COUNTS = [2, 3, 4, 5, 6, 7, 8];

const DEFAULT_SETTINGS = {
  defaultStyle: "shonenJump",
  imageCount: 1,
  imageSize: "1024x1536",
  imageQuality: "medium",
  storyModeOn: false,
  panelCount: 6,
  scriptModel: "gpt-4o-mini",
  bubbleTextMode: "chinese",
  isColor: false,
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return DEFAULT_SETTINGS;
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!settings) return DEFAULT_SETTINGS;
    return {
      defaultStyle: settings.defaultStyle,
      imageCount: settings.imageCount,
      imageSize: settings.imageSize,
      imageQuality: settings.imageQuality,
      storyModeOn: settings.storyModeOn,
      panelCount: settings.panelCount,
      scriptModel: settings.scriptModel,
      bubbleTextMode: settings.bubbleTextMode,
      isColor: settings.isColor,
    };
  },
});

function validateEnum<T>(
  value: T | undefined,
  allowed: T[],
  name: string,
): void {
  if (value !== undefined && !allowed.includes(value)) {
    throw new Error(`无效的${name}`);
  }
}

export const upsert = mutation({
  args: {
    defaultStyle: v.optional(v.string()),
    imageCount: v.optional(v.number()),
    imageSize: v.optional(v.string()),
    imageQuality: v.optional(v.string()),
    storyModeOn: v.optional(v.boolean()),
    panelCount: v.optional(v.number()),
    scriptModel: v.optional(v.string()),
    bubbleTextMode: v.optional(v.string()),
    isColor: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    validateEnum(args.defaultStyle, VALID_STYLES, "风格");
    validateEnum(args.imageCount, VALID_IMAGE_COUNTS, "图片数量");
    validateEnum(args.imageSize, VALID_SIZES, "图片尺寸");
    validateEnum(args.imageQuality, VALID_QUALITIES, "图片质量");
    validateEnum(args.panelCount, VALID_PANEL_COUNTS, "分格数");
    validateEnum(args.scriptModel, VALID_MODELS, "剧本模型");
    validateEnum(args.bubbleTextMode, VALID_BUBBLE_MODES, "对话框模式");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch("userSettings", existing._id, args);
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        defaultStyle: args.defaultStyle ?? DEFAULT_SETTINGS.defaultStyle,
        imageCount: args.imageCount ?? DEFAULT_SETTINGS.imageCount,
        imageSize: args.imageSize ?? DEFAULT_SETTINGS.imageSize,
        imageQuality: args.imageQuality ?? DEFAULT_SETTINGS.imageQuality,
        storyModeOn: args.storyModeOn ?? DEFAULT_SETTINGS.storyModeOn,
        panelCount: args.panelCount ?? DEFAULT_SETTINGS.panelCount,
        scriptModel: args.scriptModel ?? DEFAULT_SETTINGS.scriptModel,
        bubbleTextMode: args.bubbleTextMode ?? DEFAULT_SETTINGS.bubbleTextMode,
        isColor: args.isColor ?? DEFAULT_SETTINGS.isColor,
      });
    }
  },
});
