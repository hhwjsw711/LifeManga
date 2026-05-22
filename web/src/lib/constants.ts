const GLOBAL_CLEAN_INK_RULE = `
CRITICAL DRAWING RULES (override anything else if conflict):
- CLEAN, CONFIDENT INK LINES with strong weight variation, like a printed manga page that just came off a professional inker's desk.
- GENEROUS WHITE SPACE. Faces and clothing should be mostly white with just a few decisive shadow shapes.
- DO NOT use sketchy, scribbly, pencil-rough, charcoal, or photo-realistic textures.
- Use SOLID FLAT BLACKS for major shadows, screen-tone dot patterns ONLY where appropriate (hair, clothing folds), NOT scattered everywhere.
- Avoid heavy crosshatching/stippling on faces and skin — keep skin almost entirely white.
- Backgrounds should be SIMPLIFIED: clean perspective lines, geometric shapes, lots of white. No noisy textures.
- Speech bubbles must be perfectly clean ovals with crisp single-line borders.
- The page should look CRISP and READABLE at thumbnail size.`;

export const MANGA_STYLES = [
  {
    id: "shonenJump",
    displayName: "经典少年Jump风",
    subtitle: "间谍过家家 / 咒术回战 那种现代少年漫干净线条",
    prompt: `Modern mainstream Weekly Shonen Jump manga style, in the vein of Spy x Family, Jujutsu Kaisen, Chainsaw Man, My Hero Academia, or Oshi no Ko. Clean confident inking with strong line-weight variation. Big expressive eyes with sharp highlights, dynamic but readable poses, sharp angular hair drawn as simple solid black silhouettes. Use screen-tone halftones SPARINGLY (only on hair, eyes, and one or two key shadow areas). Plenty of white space. Speed lines used purposefully — not scattered all over the page. The page must read crisp and clean.${GLOBAL_CLEAN_INK_RULE}`,
  },
  {
    id: "sliceOfLife",
    displayName: "日常治愈风",
    subtitle: "辉夜大小姐 / 邻家女孩 那种温柔日常感",
    prompt: `Gentle modern Japanese slice-of-life manga style, like Kaguya-sama: Love is War, Komi Can't Communicate, or Yotsuba&!. Soft, very clean ink lines. Mostly white faces with subtle delicate shading. Calm warm composition, lots of negative space. Speech bubbles are clean rounded rectangles or soft ovals. Backgrounds are simplified and uncluttered. NO heavy crosshatching, NO sketchy lines.${GLOBAL_CLEAN_INK_RULE}`,
  },
  {
    id: "darkSeinen",
    displayName: "暗黑剧情风",
    subtitle: "我推的孩子 / 链锯人 那种有质感的剧情漫画",
    prompt: `Modern seinen manga style, in the vein of Oshi no Ko, Chainsaw Man, or 20th Century Boys. Sharp confident inking with strong contrast: large solid-black shadow shapes versus clean white skin. Mature realistic proportions but still stylized. Atmospheric lighting through bold black silhouettes, NOT through scribbly hatching. Use screen tones for clothing and dramatic gradients. Keep faces and skin clean — let the silhouettes carry the mood.`,
  },
  {
    id: "retroGekiga",
    displayName: "复古剧画风",
    subtitle: "70-80 年代写实剧画，浓厚老派气息",
    prompt: `Retro 1970s-80s Japanese gekiga manga style, like early Naoki Urasawa or Yoshihiro Tatsumi. Realistic but still firmly stylized — confident hand-inked lines, classic crosshatching used DELIBERATELY for shadows on clothing and backgrounds (not scattered randomly). Vintage screen-tone patterns. Faces remain mostly clean with character. Period-appropriate composition. Avoid pencil-sketch roughness — this should still look like a finished printed page.`,
  },
  {
    id: "chibi4Koma",
    displayName: "萌系四格风",
    subtitle: "Q 版四格漫画，可爱搞笑",
    prompt: `Cute chibi 4-koma comedy manga style, like Lucky Star, K-On!, or Azumanga Daioh. Super-deformed rounded character proportions, large simple eyes, clean thin confident ink lines. Almost no shading — just a tiny bit of light screen tone. Tons of white space, light and airy composition. Add small cute symbols (sparkles, sweat drops, music notes, hearts) tastefully. Speech bubbles are perfect clean ovals.${GLOBAL_CLEAN_INK_RULE}`,
  },
  {
    id: "sportsHotBlooded",
    displayName: "运动热血风",
    subtitle: "灌篮高手 / 排球少年 那种动感燃系",
    prompt: `Modern sports manga style, like Haikyuu!!, Kuroko no Basket, or Blue Lock. Dynamic action with confident clean inking, dramatic foreshortened poses, intense determined expressions. Speed lines used PURPOSEFULLY — radiating from a single focal point, not scattered. Sweat drops and motion effects with crisp clean lines. Backgrounds simplified to focus attention on the characters. Keep faces and skin mostly white — let the body language carry the energy.${GLOBAL_CLEAN_INK_RULE}`,
  },
  {
    id: "scifiMecha",
    displayName: "科幻机甲风",
    subtitle: "攻壳机动队 / AKIRA 那种赛博机械感",
    prompt: `Detailed sci-fi mecha manga style, like Ghost in the Shell, AKIRA, or modern Mobile Suit Gundam manga. Mechanical and architectural elements drawn with precise ruler-clean lines and accurate perspective. Characters with clean sharp inking, mature stylized proportions. Use screen tones thoughtfully on metal surfaces and lighting gradients. Keep human skin/faces relatively clean. Cyberpunk or hard-sci-fi atmosphere through composition, not noisy textures.${GLOBAL_CLEAN_INK_RULE}`,
  },
  {
    id: "horrorJunjiIto",
    displayName: "悬疑氛围风",
    subtitle: "Monster / 死亡笔记 那种紧张心理悬疑感（非暴力）",
    prompt: `Atmospheric mystery-thriller manga style, in the vein of Naoki Urasawa's Monster and 20th Century Boys, or Death Note. Dense but precise and CONTROLLED crosshatching for dramatic shadow — every stroke deliberate, never sketchy. Strong cinematic chiaroscuro: deep solid blacks against crisp clean whites. Tension comes from COMPOSITION and LIGHTING — long shadows, off-kilter camera angles, half-lit faces, fog, empty corridors, silhouettes — NOT from violent or graphic imagery.

STRICT CONTENT GUARDRAILS (always honor these):
- NO blood, NO wounds, NO injury, NO gore.
- NO monsters, NO body horror, NO disfigurement, NO weapons drawn aggressively.
- NO depictions of death or harm.
- Keep all characters fully clothed, intact, and unharmed.
- The mood is suspenseful and psychological, like a detective thriller, not a horror movie.`,
  },
] as const;

export const CHARACTER_ART_STYLES = [
  {
    id: "jpAnime",
    displayName: "日系动漫",
    subtitle: "Japanese Anime",
    prompt:
      "Japanese anime/manga illustration style: clean cel-shaded look, vibrant colors, large expressive eyes with detailed highlights, smooth skin, dynamic hair with individual strand detail, simplified nose and mouth, characteristic anime proportions (elongated limbs, stylized face). White background, full body front view centered.",
  },
  {
    id: "usComics",
    displayName: "美漫风格",
    subtitle: "US Comics",
    prompt:
      "American superhero comic book illustration style: bold ink outlines, heavy shadows and highlights, muscular exaggerated anatomy, dynamic heroic pose, cross-hatching for shading, primary color palette with strong contrast. White background, full body front view centered.",
  },
  {
    id: "krManhwa",
    displayName: "韩漫风格",
    subtitle: "Korean Manhwa",
    prompt:
      "Korean manhwa/webtoon illustration style: tall slender proportions, elegant detailed eyes, soft gradient coloring, glamorous fashion-forward styling, smooth airbrushed skin, luxurious hair rendering, sophisticated modern aesthetic. White background, full body front view centered.",
  },
  {
    id: "kawaii",
    displayName: "卡哇伊",
    subtitle: "Kawaii",
    prompt:
      "Ultra-kawaii cute illustration style: round soft features, enormous sparkly eyes, pastel color palette, rosy cheek blush marks, tiny nose and mouth, fluffy rounded hair, adorable pose, decorated with stars and hearts and ribbons, sugary sweet atmosphere. White background, full body front view centered. ADULT character rendered in cute style.",
  },
  {
    id: "chibi",
    displayName: "Q版",
    subtitle: "Chibi",
    prompt:
      "Chibi/SD (super-deformed) illustration style: 2-3 head-height ratio, oversized round head, huge expressive eyes, tiny simplified body, stubby limbs, round cheeks, exaggerated cute expressions, pastel or bright colors. This is an ADULT character drawn in chibi style — keep adult fashion/clothing, just simplify proportions to chibi. White background, full body front view centered.",
  },
  {
    id: "render3D",
    displayName: "3D渲染",
    subtitle: "3D Render",
    prompt:
      "High-quality 3D CGI character render style: realistic lighting with subsurface scattering, detailed textures on skin and clothing, studio lighting setup with rim light, photorealistic material rendering, slightly stylized anime-influenced proportions, clean background. White background, full body front view centered.",
  },
  {
    id: "semiReal",
    displayName: "半写实",
    subtitle: "Semi-Realistic",
    prompt:
      "Semi-realistic illustration style bridging anime and realism: anatomically correct proportions with subtle stylization, detailed realistic eyes with visible iris patterns, natural skin texture with visible pores, realistic hair with volume and flow, naturalistic lighting and shadows. White background, full body front view centered.",
  },
  {
    id: "watercolor",
    displayName: "水彩风格",
    subtitle: "Watercolor",
    prompt:
      "Traditional watercolor painting illustration style: soft wet-on-wet color blending, visible brush strokes and water bloom effects, muted pastel palette with occasional vivid accents, delicate pencil underdrawing visible through wash, paper texture showing through, artistic loose edges, dreamy atmospheric quality. White background, full body front view centered.",
  },
  {
    id: "pixelArt",
    displayName: "像素风",
    subtitle: "Pixel Art",
    prompt:
      "Retro pixel art character illustration style: clean pixel grid rendering, limited color palette (16-32 colors), visible pixel structure, dithering for shading, sprite-style character design, nostalgic 16-bit game aesthetic, crisp edges, no anti-aliasing. White background, full body front view centered.",
  },
] as const;

export const BUBBLE_MODES = [
  { id: "chinese", label: "中文" },
  { id: "japanese", label: "日文" },
  { id: "english", label: "英文" },
  { id: "empty", label: "留空" },
  { id: "none", label: "无对话框" },
] as const;

export const IMAGE_SIZES = [
  { value: "1024x1024", label: "1:1 方形" },
  { value: "1024x1536", label: "2:3 竖版" },
  { value: "1536x1024", label: "3:2 横版" },
  { value: "auto", label: "自动" },
] as const;

export const IMAGE_QUALITIES = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "auto", label: "自动" },
] as const;

export const SCRIPT_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
  { value: "gpt-5", label: "GPT-5" },
] as const;

export const POSE_GROUPS = [
  {
    label: "日常动作",
    poses: ["站立", "行走", "坐着", "跑步", "吃零食", "看书", "睡觉", "伸懒腰"],
  },
  {
    label: "情绪表达",
    poses: [
      "开心大笑",
      "愤怒握拳",
      "悲伤落泪",
      "惊讶张嘴",
      "害羞脸红",
      "冷静思考",
    ],
  },
  {
    label: "动作场景",
    poses: ["跳跃", "战斗姿势", "飞踢", "挥剑", "冲刺"],
  },
  {
    label: "互动姿势",
    poses: ["握手", "拥抱", "背对背", "对话", "并肩而行"],
  },
  {
    label: "镜头角度",
    poses: [
      "正面",
      "侧面",
      "背面",
      "仰视",
      "俯视",
      "四分之三侧面",
      "过肩",
      "特写",
      "全身远景",
    ],
  },
] as const;
