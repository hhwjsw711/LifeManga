import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  buildBubbleDirective,
  buildColorDirective,
  CLEAN_INK_RULE,
  DEFAULT_BUBBLE_MODE,
  DEFAULT_SCRIPT_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_IMAGE_QUALITY,
} from "./lib/prompts";

async function addLog(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
  level: string,
  message: string,
) {
  try {
    await ctx.runMutation(internal.jobs.addLog, { jobId, level, message });
  } catch (logErr) {
    console.error("Failed to write job log:", logErr, {
      jobId,
      level,
      message,
    });
  }
}

async function requireApiKey(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await ctx.runMutation(internal.jobs.failJob, {
      jobId,
      errorMessage: "OpenAI API Key 未配置，请联系管理员",
    });
    return null;
  }
  return apiKey;
}

async function handleActionError(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
  e: unknown,
): Promise<void> {
  const message = e instanceof Error ? e.message : String(e);
  await addLog(ctx, jobId, "error", message);
  const isNetworkError =
    (e instanceof TypeError && e.message === "Failed to fetch") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT");
  if (isNetworkError) {
    await ctx.runMutation(internal.jobs.timeoutJob, {
      jobId,
      errorMessage: message,
    });
  } else {
    await ctx.runMutation(internal.jobs.failJob, {
      jobId,
      errorMessage: message,
    });
  }
}

async function storageIdToUrl(
  ctx: ActionCtx,
  storageId: Id<"_storage"> | undefined,
): Promise<string | null> {
  if (!storageId) return null;
  return await ctx.storage.getUrl(storageId);
}

async function resolveImageBlob(
  ctx: ActionCtx,
  storageId: Id<"_storage">,
): Promise<Blob | null> {
  const url = await storageIdToUrl(ctx, storageId);
  if (!url) return null;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(
      `Failed to fetch storage blob ${storageId}: ${resp.status} ${resp.statusText}`,
    );
    return null;
  }
  return await resp.blob();
}

interface ImageEditResult {
  storageId: Id<"_storage">;
}

async function callImagesEdit(
  ctx: ActionCtx,
  args: {
    jobId: Id<"jobs">;
    prompt: string;
    n: number;
    size: string;
    quality: string;
    imageBlobs?: Array<{ blob: Blob; filename: string }>;
  },
  apiKey: string,
): Promise<ImageEditResult[]> {
  const formData = new FormData();
  formData.append("model", "gpt-image-2");
  formData.append("prompt", args.prompt);
  formData.append("n", String(args.n));
  formData.append("size", args.size);
  formData.append("quality", args.quality);

  if (args.imageBlobs) {
    for (const { blob, filename } of args.imageBlobs) {
      formData.append("image[]", blob, filename);
    }
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let userMessage = `OpenAI 请求失败 (${response.status})`;
    try {
      const errorJson = JSON.parse(errorBody);
      const msg = errorJson.error?.message ?? "";
      if (msg.includes("safety") || msg.includes("content_policy")) {
        userMessage =
          "内容安全审核未通过。如果您上传的是成人照片，这是误报，请尝试其他照片或风格。如果是儿童照片，系统不允许处理。";
      } else if (response.status === 429) {
        userMessage = "API 请求频率超限，请稍后再试。";
      } else if (response.status >= 500) {
        userMessage = `OpenAI 服务器错误 (${response.status})，请稍后重试。`;
      } else {
        userMessage = `请求失败: ${msg}`;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(userMessage);
  }

  const result = await response.json();
  if (!Array.isArray(result?.data)) {
    throw new Error("OpenAI 返回了无效的图片数据格式");
  }

  const results = await Promise.all(
    result.data.map(async (img: { url?: string; b64_json?: string }) => {
      if (img.url) {
        const imgResp = await fetch(img.url);
        const blob = await imgResp.blob();
        const storageId = await ctx.storage.store(blob);
        return { storageId };
      } else if (img.b64_json) {
        try {
          const binary = atob(img.b64_json);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/png" });
          const storageId = await ctx.storage.store(blob);
          return { storageId };
        } catch (decodeError) {
          await addLog(
            ctx,
            args.jobId,
            "warning",
            `b64_json 解码失败: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`,
          );
          return null;
        }
      }
      return null;
    }),
  );

  return results.filter((r): r is ImageEditResult => r !== null);
}

function buildScriptPrompt(args: {
  style: string;
  isColor: boolean;
  bubbleMode: string;
  characterDirective?: string;
  userHint?: string;
  hasPreviousPage: boolean;
  panelCount: number;
}): string {
  const bubbleInstruction = buildBubbleDirective(args.bubbleMode);

  return `You are a professional manga scriptwriter. Create a ${args.panelCount}-panel manga story script based on the provided photos.

Style: ${args.style}
${buildColorDirective(args.isColor)}
${bubbleInstruction}

${args.characterDirective ?? ""}

${args.hasPreviousPage ? "A previous manga page is provided for continuity — match its style and characters." : ""}

${args.userHint ? `User hint: ${args.userHint}` : ""}

Return ONLY a JSON object with this exact structure:
{
  "title": "2-6 character Chinese title",
  "synopsis": "One-sentence story synopsis in Chinese",
  "panels": [
    {
      "description": "Detailed visual description in English for the image model",
      "dialogue": "Chinese dialogue text (or null if none)",
      "dialogueJa": "Japanese kana reading of dialogue (or null if none)",
      "narration": "Chinese narration text (or null if none)",
      "narrationJa": "Japanese kana reading of narration (or null if none)",
      "sfx": "Sound effect in Japanese katakana like ドン! (or null if none)"
    }
  ]
}

Each panel description must be vivid and detailed enough for an image generation model to render. Include composition, character poses, expressions, and mood.`;
}

function buildRenderPrompt(args: {
  stylePrompt: string;
  script: {
    title: string;
    synopsis: string;
    panels: Array<{
      description: string;
      dialogue?: string;
      dialogueJa?: string;
      narration?: string;
      narrationJa?: string;
      sfx?: string;
    }>;
  };
  bubbleMode: string;
  isColor: boolean;
}): string {
  const colorDirective = buildColorDirective(args.isColor);

  const bubbleDirective = buildBubbleDirective(args.bubbleMode);

  const panelDescriptions = args.script.panels
    .map((panel, i) => {
      const parts: string[] = [`Panel ${i + 1}: ${panel.description}`];
      if (panel.dialogue)
        parts.push(`Speech bubble with dialogue: "${panel.dialogue}"`);
      if (panel.dialogueJa)
        parts.push(`Japanese kana reading: "${panel.dialogueJa}"`);
      if (panel.narration) parts.push(`Narration box: "${panel.narration}"`);
      if (panel.narrationJa)
        parts.push(`Japanese narration kana: "${panel.narrationJa}"`);
      if (panel.sfx) parts.push(`Sound effect: ${panel.sfx}`);
      return parts.join(". ");
    })
    .join("\n\n");

  return `${colorDirective}
${args.stylePrompt}
${CLEAN_INK_RULE}
${bubbleDirective}

Story: "${args.script.title}" — ${args.script.synopsis}

${panelDescriptions}`;
}

async function resolveCharacterPhotoIds(
  ctx: ActionCtx,
  characterIds: string[] | undefined,
): Promise<Id<"_storage">[]> {
  if (!characterIds || characterIds.length === 0) return [];
  const results = await Promise.all(
    characterIds.map(async (charId) => {
      try {
        const character = await ctx.runQuery(internal.characters.getForAction, {
          characterId: charId as Id<"characters">,
        });
        return character?.sourcePhotoId ?? null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((id): id is Id<"_storage"> => id !== null);
}

export const generateManga = action({
  args: {
    jobId: v.id("jobs"),
    stylePrompt: v.string(),
    userPrompt: v.optional(v.string()),
    inputImageIds: v.optional(v.array(v.id("_storage"))),
    previousPageImageId: v.optional(v.id("_storage")),
    characterReferenceIds: v.optional(v.array(v.id("_storage"))),
    characterDirective: v.optional(v.string()),
    n: v.number(),
    size: v.string(),
    quality: v.string(),
    bubbleDirective: v.optional(v.string()),
    isColor: v.boolean(),
    renderScript: v.optional(
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
    bubbleMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerJob = await ctx.runQuery(internal.jobs.verifyOwnership, {
      jobId: args.jobId,
    });
    if (!ownerJob) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "无权限操作此任务",
      });
      return;
    }

    const apiKey = await requireApiKey(ctx, args.jobId);
    if (!apiKey) return;

    try {
      await ctx.runMutation(internal.jobs.updateStage, {
        jobId: args.jobId,
        stageMessage: "正在生成漫画...",
      });

      let prompt: string;
      if (args.renderScript) {
        prompt = buildRenderPrompt({
          stylePrompt: args.stylePrompt,
          script: args.renderScript,
          bubbleMode: args.bubbleMode ?? "none",
          isColor: args.isColor,
        });
      } else {
        const parts: string[] = [
          buildColorDirective(args.isColor),
          args.stylePrompt,
          CLEAN_INK_RULE,
        ];

        if (args.bubbleDirective) {
          parts.push(args.bubbleDirective);
        }

        if (args.previousPageImageId) {
          parts.push(
            "CONTINUITY: The user provides a previous manga page. Match its character designs, panel layout style, inking weight, and tonal density exactly.",
          );
        }

        if (args.characterDirective) {
          parts.push(args.characterDirective);
        }

        if (args.userPrompt) {
          parts.push(`User request: ${args.userPrompt}`);
        }

        prompt = parts.join(" ");
      }

      await addLog(ctx, args.jobId, "info", "正在调用 OpenAI 图片生成 API...");

      const allStorageIds: Array<{ id: Id<"_storage">; filename: string }> = [];
      if (args.inputImageIds) {
        for (const storageId of args.inputImageIds) {
          allStorageIds.push({ id: storageId, filename: "input.png" });
        }
      }
      if (args.previousPageImageId) {
        allStorageIds.push({
          id: args.previousPageImageId,
          filename: "previous_page.png",
        });
      }
      if (args.characterReferenceIds) {
        for (const storageId of args.characterReferenceIds) {
          allStorageIds.push({ id: storageId, filename: "character_ref.png" });
        }
      }

      const blobs = await Promise.all(
        allStorageIds.map(({ id }) => resolveImageBlob(ctx, id)),
      );
      const imageBlobs = blobs
        .map((blob, i) =>
          blob ? { blob, filename: allStorageIds[i].filename } : null,
        )
        .filter((b): b is { blob: Blob; filename: string } => b !== null);

      const results = await callImagesEdit(
        ctx,
        {
          jobId: args.jobId,
          prompt,
          n: args.n,
          size: args.size,
          quality: args.quality,
          imageBlobs: imageBlobs.length > 0 ? imageBlobs : undefined,
        },
        apiKey,
      );

      if (results.length === 0) {
        await addLog(ctx, args.jobId, "error", "OpenAI 返回了 0 张图片");
        await ctx.runMutation(internal.jobs.failJob, {
          jobId: args.jobId,
          errorMessage: "生成失败：未收到图片数据",
        });
        return;
      }

      await addLog(
        ctx,
        args.jobId,
        "success",
        "OpenAI 返回图片数据，正在保存...",
      );

      const outputStorageIds = results.map((r) => r.storageId);

      await addLog(
        ctx,
        args.jobId,
        "info",
        `已保存 ${outputStorageIds.length} 张图片`,
      );

      await ctx.runMutation(internal.mangaItems.createFromAction, {
        jobId: args.jobId,
        outputStorageIds,
      });
    } catch (e: unknown) {
      await handleActionError(ctx, args.jobId, e);
    }
  },
});

export const generateStoryScript = action({
  args: {
    jobId: v.id("jobs"),
    inputImageIds: v.optional(v.array(v.id("_storage"))),
    previousPageImageId: v.optional(v.id("_storage")),
    characterReferenceIds: v.optional(v.array(v.id("_storage"))),
    characterDirective: v.optional(v.string()),
    style: v.string(),
    userHint: v.optional(v.string()),
    panelCount: v.number(),
    scriptModel: v.string(),
    bubbleTextMode: v.string(),
    isColor: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ownerJob = await ctx.runQuery(internal.jobs.verifyOwnership, {
      jobId: args.jobId,
    });
    if (!ownerJob) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "无权限操作此任务",
      });
      return null;
    }

    const apiKey = await requireApiKey(ctx, args.jobId);
    if (!apiKey) return null;

    try {
      await ctx.runMutation(internal.jobs.updateStage, {
        jobId: args.jobId,
        stageMessage: "正在构思剧情...",
      });

      const textPart = buildScriptPrompt({
        style: args.style,
        isColor: args.isColor,
        bubbleMode: args.bubbleTextMode,
        characterDirective: args.characterDirective,
        userHint: args.userHint ?? undefined,
        hasPreviousPage: !!args.previousPageImageId,
        panelCount: args.panelCount,
      });

      const contentParts: {
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }[] = [{ type: "text", text: textPart }];

      const allStorageIds: Array<{
        id: Id<"_storage">;
        label: string;
        prependText?: string;
      }> = [];
      if (args.inputImageIds) {
        for (const storageId of args.inputImageIds) {
          allStorageIds.push({ id: storageId, label: "input" });
        }
      }
      if (args.previousPageImageId) {
        allStorageIds.push({
          id: args.previousPageImageId,
          label: "previous",
          prependText: "This is the previous manga page for continuity:",
        });
      }
      if (args.characterReferenceIds) {
        const firstCharId = args.characterReferenceIds[0];
        if (firstCharId) {
          allStorageIds.push({
            id: firstCharId,
            label: "character",
            prependText:
              "These are character reference images to include in the story:",
          });
        }
      }

      const urls = await Promise.all(
        allStorageIds.map(({ id }) => storageIdToUrl(ctx, id)),
      );

      let lastLabel = "";
      for (let i = 0; i < urls.length; i++) {
        const { label, prependText } = allStorageIds[i];
        if (label !== lastLabel && prependText) {
          contentParts.push({ type: "text", text: prependText });
          lastLabel = label;
        }
        const url = urls[i];
        if (url) {
          contentParts.push({ type: "image_url", image_url: { url } });
        }
      }

      await addLog(
        ctx,
        args.jobId,
        "info",
        `正在调用 ${args.scriptModel} 生成剧本...`,
      );

      const script = await callChatCompletionsForScript(
        ctx,
        args.jobId,
        apiKey,
        args.scriptModel,
        contentParts,
      );

      if (script) {
        await addLog(
          ctx,
          args.jobId,
          "success",
          `剧本生成成功，共 ${script.panels.length} 格`,
        );
        await ctx.runMutation(internal.jobs.completeJob, { jobId: args.jobId });
        return script;
      }

      return null;
    } catch (e: unknown) {
      await handleActionError(ctx, args.jobId, e);
      return null;
    }
  },
});

export const generateCharacterSheet = action({
  args: {
    jobId: v.id("jobs"),
    sourcePhotoId: v.id("_storage"),
    name: v.string(),
    bio: v.optional(v.string()),
    artStylePrompt: v.string(),
    size: v.string(),
    quality: v.string(),
    isColor: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ownerJob = await ctx.runQuery(internal.jobs.verifyOwnership, {
      jobId: args.jobId,
    });
    if (!ownerJob) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "无权限操作此任务",
      });
      return null;
    }

    const apiKey = await requireApiKey(ctx, args.jobId);
    if (!apiKey) return null;

    try {
      await ctx.runMutation(internal.jobs.updateStage, {
        jobId: args.jobId,
        stageMessage: `正在生成 ${args.name} 的角色设定...`,
      });

      const prompt = `${args.artStylePrompt}

${buildColorDirective(args.isColor)}

ADULT character named "${args.name}". ${args.bio ?? ""}
Character reference sheet: full body front view, centered on white background. Top-right: 4 expression studies (happy, angry, sad, surprised). Bottom: 3-4 lifestyle items with bilingual (Japanese + English) caption arrows. Accessory callout with labeled arrows. Do NOT include any brand names or logos.`;

      await addLog(ctx, args.jobId, "info", "正在生成角色设定图...");

      const sourceBlob = await resolveImageBlob(ctx, args.sourcePhotoId);
      if (!sourceBlob) {
        await addLog(ctx, args.jobId, "error", "无法获取角色照片");
        await ctx.runMutation(internal.jobs.failJob, {
          jobId: args.jobId,
          errorMessage: "无法获取角色照片",
        });
        return null;
      }

      const results = await callImagesEdit(
        ctx,
        {
          jobId: args.jobId,
          prompt,
          n: 1,
          size: args.size,
          quality: args.quality,
          imageBlobs: [{ blob: sourceBlob, filename: "source.png" }],
        },
        apiKey,
      );

      if (results.length === 0) {
        await ctx.runMutation(internal.jobs.failJob, {
          jobId: args.jobId,
          errorMessage: "未收到图片数据",
        });
        return null;
      }

      await addLog(ctx, args.jobId, "success", "角色设定图生成完成");
      await ctx.runMutation(internal.jobs.completeJob, { jobId: args.jobId });

      return results[0].storageId;
    } catch (e: unknown) {
      await handleActionError(ctx, args.jobId, e);
      return null;
    }
  },
});

export const generatePoseSheet = action({
  args: {
    jobId: v.id("jobs"),
    sourcePhotoId: v.id("_storage"),
    name: v.string(),
    bio: v.optional(v.string()),
    poseLabels: v.array(v.string()),
    artStylePrompt: v.string(),
    isColor: v.boolean(),
    size: v.string(),
    quality: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerJob = await ctx.runQuery(internal.jobs.verifyOwnership, {
      jobId: args.jobId,
    });
    if (!ownerJob) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "无权限操作此任务",
      });
      return null;
    }

    const apiKey = await requireApiKey(ctx, args.jobId);
    if (!apiKey) return null;

    try {
      await ctx.runMutation(internal.jobs.updateStage, {
        jobId: args.jobId,
        stageMessage: `正在生成 ${args.name} 的姿势图...`,
      });

      const posesText = args.poseLabels.join(", ");
      const prompt = `${args.artStylePrompt}

${buildColorDirective(args.isColor)}

ADULT character named "${args.name}". ${args.bio ?? ""}
Pose sheet: Render the following poses in a single composite image with white background — ${posesText}. Each pose should be labeled with bilingual (Japanese + English) text below. Clean character sheet layout, consistent design across all poses.`;

      await addLog(
        ctx,
        args.jobId,
        "info",
        `正在生成姿势图 (${args.poseLabels.length} 个姿势)...`,
      );

      const sourceBlob = await resolveImageBlob(ctx, args.sourcePhotoId);
      if (!sourceBlob) {
        await addLog(ctx, args.jobId, "error", "无法获取角色照片");
        await ctx.runMutation(internal.jobs.failJob, {
          jobId: args.jobId,
          errorMessage: "无法获取角色照片",
        });
        return null;
      }

      const results = await callImagesEdit(
        ctx,
        {
          jobId: args.jobId,
          prompt,
          n: 1,
          size: args.size,
          quality: args.quality,
          imageBlobs: [{ blob: sourceBlob, filename: "source.png" }],
        },
        apiKey,
      );

      if (results.length === 0) {
        await ctx.runMutation(internal.jobs.failJob, {
          jobId: args.jobId,
          errorMessage: "未收到图片数据",
        });
        return null;
      }

      await addLog(ctx, args.jobId, "success", "姿势图生成完成");
      await ctx.runMutation(internal.jobs.completeJob, { jobId: args.jobId });

      return results[0].storageId;
    } catch (e: unknown) {
      await handleActionError(ctx, args.jobId, e);
      return null;
    }
  },
});

export const retryJobAction = action({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const ownerJob = await ctx.runQuery(internal.jobs.verifyOwnership, {
      jobId: args.jobId,
    });
    if (!ownerJob) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "无权限操作此任务",
      });
      return;
    }

    const apiKey = await requireApiKey(ctx, args.jobId);
    if (!apiKey) return;

    const job = await ctx.runQuery(internal.jobs.getForRetry, {
      jobId: args.jobId,
    });
    if (!job) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId: args.jobId,
        errorMessage: "任务不存在",
      });
      return;
    }

    if (job.phase !== "failed" && job.phase !== "timeoutUnknown") {
      throw new Error("只能重试失败或超时的任务");
    }

    await ctx.runMutation(internal.jobs.resetForRetry, { jobId: args.jobId });

    try {
      if (job.kind === "storyScript") {
        await retryStoryScript(ctx, args.jobId, job, apiKey);
      } else {
        await retryMangaGeneration(ctx, args.jobId, job, apiKey);
      }
    } catch (e: unknown) {
      await handleActionError(ctx, args.jobId, e);
    }
  },
});

async function callChatCompletionsForScript(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
  apiKey: string,
  scriptModel: string,
  contentParts: { type: string; text?: string; image_url?: { url: string } }[],
): Promise<{
  title: string;
  synopsis: string;
  panels: Array<{
    description: string;
    dialogue?: string;
    dialogueJa?: string;
    narration?: string;
    narrationJa?: string;
    sfx?: string;
  }>;
} | null> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: scriptModel,
            messages: [{ role: "user", content: contentParts }],
            max_completion_tokens: 4000,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        let userMessage = `OpenAI 请求失败 (${response.status})`;
        try {
          const errorJson = JSON.parse(errorBody);
          userMessage = errorJson.error?.message ?? userMessage;
        } catch {
          // Ignore parse error
        }
        lastError = userMessage;
        if (response.status >= 500) {
          await addLog(
            ctx,
            jobId,
            "warning",
            `服务器错误，重试中 (${attempt + 1}/3)`,
          );
          continue;
        }
        await addLog(ctx, jobId, "error", userMessage);
        await ctx.runMutation(internal.jobs.failJob, {
          jobId,
          errorMessage: userMessage,
        });
        return null;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "空响应";
        continue;
      }

      let script;
      try {
        script = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastError = "无法解析JSON响应";
          continue;
        }
        try {
          script = JSON.parse(jsonMatch[0]);
        } catch {
          lastError = "无法解析JSON响应";
          continue;
        }
      }

      if (!script.panels || !Array.isArray(script.panels)) {
        lastError = "剧本格式错误";
        continue;
      }

      for (const panel of script.panels) {
        for (const key of [
          "dialogue",
          "dialogueJa",
          "narration",
          "narrationJa",
          "sfx",
        ] as const) {
          if (panel[key] === null || panel[key] === undefined) {
            delete panel[key];
          }
        }
      }

      return script;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        lastError = `请求超时 (120s)，模型 ${scriptModel} 响应过慢`;
      } else {
        lastError = e instanceof Error ? e.message : String(e);
      }
      await addLog(
        ctx,
        jobId,
        "warning",
        `请求异常，重试中 (${attempt + 1}/3): ${lastError}`,
      );
      continue;
    }
  }

  await addLog(ctx, jobId, "error", lastError ?? "生成剧本失败");
  await ctx.runMutation(internal.jobs.failJob, {
    jobId,
    errorMessage: lastError ?? "生成剧本失败",
  });
  return null;
}

async function retryStoryScript(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
  job: {
    style: string;
    userPromptText?: string;
    wasColorOn?: boolean;
    inputImageIds?: string[];
    previousPageImageId?: string;
    characterIds?: string[];
    panelCount?: number;
    scriptModel?: string;
    bubbleMode?: string;
  },
  apiKey: string,
) {
  const panelCount = job.panelCount ?? 6;
  const scriptModel = job.scriptModel ?? DEFAULT_SCRIPT_MODEL;
  const bubbleMode = job.bubbleMode ?? DEFAULT_BUBBLE_MODE;

  const textPart = buildScriptPrompt({
    style: job.style,
    isColor: job.wasColorOn ?? false,
    bubbleMode,
    userHint: job.userPromptText ?? undefined,
    hasPreviousPage: !!job.previousPageImageId,
    panelCount,
  });

  const contentParts: {
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
  }[] = [{ type: "text", text: textPart }];

  const allStorageIds: Array<{
    id: Id<"_storage">;
    label: string;
    prependText?: string;
  }> = [];
  if (job.inputImageIds) {
    for (const storageId of job.inputImageIds) {
      allStorageIds.push({ id: storageId as Id<"_storage">, label: "input" });
    }
  }
  if (job.previousPageImageId) {
    allStorageIds.push({
      id: job.previousPageImageId as Id<"_storage">,
      label: "previous",
      prependText: "This is the previous manga page for continuity:",
    });
  }
  if (job.characterIds && job.characterIds.length > 0) {
    allStorageIds.push({
      id: job.characterIds[0] as unknown as Id<"_storage">,
      label: "character",
      prependText:
        "These are character reference images to include in the story:",
    });
  }

  const urls = await Promise.all(
    allStorageIds.map(({ id }) => ctx.storage.getUrl(id)),
  );

  let lastLabel = "";
  for (let i = 0; i < urls.length; i++) {
    const { label, prependText } = allStorageIds[i];
    if (label !== lastLabel && prependText) {
      contentParts.push({ type: "text", text: prependText });
      lastLabel = label;
    }
    const url = urls[i];
    if (url) {
      contentParts.push({ type: "image_url", image_url: { url } });
    }
  }

  const characterPhotoIds = await resolveCharacterPhotoIds(
    ctx,
    job.characterIds,
  );
  if (characterPhotoIds.length > 0) {
    const charUrls = await Promise.all(
      characterPhotoIds.map((id) => ctx.storage.getUrl(id)),
    );
    for (const url of charUrls) {
      if (url) {
        contentParts.push({ type: "image_url", image_url: { url } });
      }
    }
  }

  await addLog(ctx, jobId, "info", `重试：正在调用 ${scriptModel} 生成剧本...`);

  const script = await callChatCompletionsForScript(
    ctx,
    jobId,
    apiKey,
    scriptModel,
    contentParts,
  );
  if (script) {
    await addLog(
      ctx,
      jobId,
      "success",
      `重试成功，剧本生成完成，共 ${script.panels.length} 格`,
    );
    await ctx.runMutation(internal.jobs.completeJob, { jobId });
  }
}

async function retryMangaGeneration(
  ctx: ActionCtx,
  jobId: Id<"jobs">,
  job: {
    style: string;
    userPromptText?: string;
    wasColorOn?: boolean;
    bubbleMode?: string;
    inputImageIds?: string[];
    previousPageImageId?: string;
    characterIds?: string[];
    imageCount?: number;
    imageSize?: string;
    imageQuality?: string;
  },
  apiKey: string,
) {
  const colorDirective = buildColorDirective(job.wasColorOn ?? false);

  const parts: string[] = [
    colorDirective,
    `Style: ${job.style}`,
    CLEAN_INK_RULE,
  ];

  const bubbleDirective = buildBubbleDirective(job.bubbleMode);
  if (bubbleDirective) parts.push(bubbleDirective);

  if (job.previousPageImageId) {
    parts.push(
      "CONTINUITY: Match the previous manga page's character designs, panel layout style, inking weight, and tonal density exactly.",
    );
  }

  if (job.userPromptText) {
    parts.push(`User request: ${job.userPromptText}`);
  }

  const prompt = parts.join(" ");

  await addLog(ctx, jobId, "info", "重试：正在调用 OpenAI 图片生成 API...");

  const allStorageIds: Array<{ id: Id<"_storage">; filename: string }> = [];
  if (job.inputImageIds) {
    for (const storageId of job.inputImageIds) {
      allStorageIds.push({
        id: storageId as Id<"_storage">,
        filename: "input.png",
      });
    }
  }
  if (job.previousPageImageId) {
    allStorageIds.push({
      id: job.previousPageImageId as Id<"_storage">,
      filename: "previous_page.png",
    });
  }

  const blobs = await Promise.all(
    allStorageIds.map(({ id }) => resolveImageBlob(ctx, id)),
  );
  const imageBlobs = blobs
    .map((blob, i) =>
      blob ? { blob, filename: allStorageIds[i].filename } : null,
    )
    .filter((b): b is { blob: Blob; filename: string } => b !== null);

  const characterPhotoIds = await resolveCharacterPhotoIds(
    ctx,
    job.characterIds,
  );
  if (characterPhotoIds.length > 0) {
    const charBlobs = await Promise.all(
      characterPhotoIds.map((id) => resolveImageBlob(ctx, id)),
    );
    for (const blob of charBlobs) {
      if (blob) imageBlobs.push({ blob, filename: "character_ref.png" });
    }
  }

  const results = await callImagesEdit(
    ctx,
    {
      jobId,
      prompt,
      n: job.imageCount ?? 1,
      size: job.imageSize ?? DEFAULT_IMAGE_SIZE,
      quality: job.imageQuality ?? DEFAULT_IMAGE_QUALITY,
      imageBlobs: imageBlobs.length > 0 ? imageBlobs : undefined,
    },
    apiKey,
  );

  if (results.length === 0) {
    await ctx.runMutation(internal.jobs.failJob, {
      jobId,
      errorMessage: "重试失败：未收到图片数据",
    });
    return;
  }

  const outputStorageIds = results.map((r) => r.storageId);
  await addLog(
    ctx,
    jobId,
    "info",
    `重试成功，已保存 ${outputStorageIds.length} 张图片`,
  );
  await ctx.runMutation(internal.mangaItems.createFromAction, {
    jobId,
    outputStorageIds,
  });
}
