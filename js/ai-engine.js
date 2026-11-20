/* ============================================================
   ai-engine.js — Engine AI via Gemini API (BYOK: key milik pengguna)
   Key disimpan hanya di browser (localStorage) dan dikirim langsung
   ke generativelanguage.googleapis.com. Tidak ada server perantara.
   ============================================================ */

window.PI_AI = (() => {
  const { PLATFORMS } = window.PI_PLATFORMS;
  const BASE = "https://generativelanguage.googleapis.com/v1beta";
  const DEFAULT_MODEL = "gemini-2.5-flash";

  const getKey = () => localStorage.getItem("pi_api_key") || "";
  const setKey = (k) => (k ? localStorage.setItem("pi_api_key", k.trim()) : localStorage.removeItem("pi_api_key"));
  const getModel = () => localStorage.getItem("pi_model") || DEFAULT_MODEL;
  const setModel = (m) => localStorage.setItem("pi_model", m);

  async function fetchModels(key) {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    if (!r.ok) throw new Error(await errText(r));
    const j = await r.json();
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name }));
  }

  async function listModels(key) {
    return (await fetchModels(key))
      .filter((m) => /gemini/i.test(m.id) && !/embedding|aqa|tts|image|audio|live|native/i.test(m.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  // Model yang bisa menghasilkan gambar (Nano Banana / Gemini image)
  async function pickImageModel() {
    const cached = sessionStorage.getItem("pi_image_model");
    if (cached) return cached;
    const all = (await fetchModels(getKey())).filter((m) => /gemini.*image/i.test(m.id) && !/preview-tts/i.test(m.id));
    const pick = all.find((m) => /flash.*image(?!.*preview)/i.test(m.id)) || all.find((m) => /flash/i.test(m.id)) || all[0];
    if (!pick) throw new Error("Key ini tidak punya akses ke model gambar Gemini.");
    sessionStorage.setItem("pi_image_model", pick.id);
    return pick.id;
  }

  async function errText(r) {
    try {
      const j = await r.json();
      return j.error?.message || `${r.status} ${r.statusText}`;
    } catch { return `${r.status} ${r.statusText}`; }
  }

  // image: {mime, data(base64)} opsional
  function userParts(text, image) {
    const parts = [];
    if (image?.data) parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
    parts.push({ text });
    return parts;
  }

  async function post(model, body) {
    const key = getKey();
    if (!key) throw new Error("API key Gemini belum diisi.");
    const r = await fetch(`${BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await errText(r));
    return r.json();
  }

  const textOf = (j) => (j.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");

  async function callJSON(system, user, { temperature = 0.6, model, image } = {}) {
    const j = await post(model || getModel(), {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: userParts(user, image) }],
      generationConfig: { temperature, responseMimeType: "application/json", maxOutputTokens: 8192 },
    });
    const text = textOf(j);
    if (!text) throw new Error("Model tidak mengembalikan teks (finishReason: " + (j.candidates?.[0]?.finishReason || "?") + ").");
    return parseJSON(text);
  }

  function parseJSON(text) {
    let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return JSON.parse(t); } catch {}
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try { return JSON.parse(t.slice(s, e + 1)); } catch {}
    }
    throw new Error("Respons model bukan JSON valid.");
  }

  const platformBrief = (pf) =>
    `TARGET PLATFORM: ${pf.name} (${pf.desc})\n` +
    `PROMPT DIMENSIONS THAT MATTER (in priority order): ${pf.dims.map((d) => `${d.label} [w${d.weight}]`).join("; ")}\n` +
    `PLATFORM RULES:\n${pf.guide.map((g, i) => `${i + 1}. ${g}`).join("\n")}`;

  const imageBrief = (platformId, mode) => {
    if (platformId === "veo") return /image|frame/i.test(mode || "")
      ? "A REFERENCE IMAGE is attached and will be used as the starting frame (image-to-video). The prompt must describe MOTION, camera movement, timing and audio — do not re-describe what is already visible except to anchor the subject."
      : "A REFERENCE IMAGE is attached. Extract the subject's exact look, wardrobe, setting and palette from it and write them into the prompt so the video matches it.";
    if (platformId === "image") return "A REFERENCE IMAGE is attached. If the user wants an edit, write a conversational Nano Banana edit instruction stating exactly what to keep and what to change. Otherwise use it as a style/subject reference and describe the relevant traits explicitly.";
    if (platformId === "omni") return "A REFERENCE IMAGE is attached. State explicitly which traits to keep and which to change.";
    return "A REFERENCE IMAGE is attached. Use what is visible in it as factual context for the task.";
  };

  // ---------------- ANALYZE ----------------
  async function analyze(prompt, platformId, uiLang = "id", ctx = {}) {
    const pf = PLATFORMS[platformId];
    const system = `You are a world-class prompt engineer who specializes in Google's generative AI tools (Veo 3 / Flow, Google Vids, Imagen / Nano Banana, Gemini in AI Studio) and multimodal models.
Your job in this step: audit a user's raw prompt and decide which information is missing to turn it into a "super prompt" that produces dramatically better results.

${platformBrief(pf)}
${ctx.image ? "\n" + imageBrief(platformId, ctx.mode) + " Count everything clearly visible in the image as already specified; do not ask about it.\n" : ""}${ctx.preset ? `\nThe user picked the style preset "${ctx.preset.label}", which already fixes: ${Object.keys(ctx.preset.fields).join(", ")}. Do not ask about those unless the prompt contradicts them.\n` : ""}
HOW TO DECIDE THE NUMBER OF QUESTIONS (strict):
- Compute completeness 0-100 from the dimensions above, weighted by [w].
- completeness < 30  -> 9-10 questions
- 30-49              -> 7-8 questions
- 50-69              -> 5-6 questions
- 70-84              -> 4 questions
- >= 85              -> 3 questions (sharpening questions)
Never fewer than 3, never more than 10. Prioritize questions that unlock the biggest quality gain. Do not ask about things the prompt already states clearly. Do not ask two things in one question.

QUESTION STYLE:
- Written in ${uiLang === "id" ? "Bahasa Indonesia" : "English"}, friendly, concrete, one sentence (max two).
- Each question offers 3-6 short, concrete, mutually-different options the user can tap, plus free text is always allowed. Options must be actual creative suggestions tailored to THIS prompt (not generic words like "other"). Put the recommended option first.
- "why" explains in one sentence what quality improvement answering it unlocks.

Return ONLY JSON:
{
 "score": <int 0-100>,
 "verdict": "<one sentence in ${uiLang === "id" ? "Bahasa Indonesia" : "English"}>",
 "detected": {"<dimension>": "<what the prompt already specifies>", ...},
 "missing": ["<dimension label>", ...],
 "intent": "<one sentence: what the user is most likely trying to make>",
 "questions": [
   {"id": "<snake_case>", "dim": "<dimension label>", "question": "...", "why": "...", "options": ["...", "..."], "placeholder": "<example answer>"}
 ]
}`;
    const user = `RAW PROMPT:\n"""\n${prompt}\n"""`;
    const j = await callJSON(system, user, { temperature: 0.5, image: ctx.image });
    j.engine = "ai";
    j.questions = (j.questions || []).slice(0, 10).map((q, i) => ({ ...q, n: i + 1, allowSkip: true, options: q.options || [] }));
    j.covered = Object.keys(j.detected || {});
    j.summary = j.intent || "";
    return j;
  }

  // ---------------- GENERATE ----------------
  async function generate(prompt, platformId, answers, opts = {}) {
    const pf = PLATFORMS[platformId];
    const outLang = opts.outputLang || pf.outputLang;
    const langName = { en: "English", id: "Bahasa Indonesia", both: "English, followed by a Bahasa Indonesia translation" }[outLang] || "English";
    const clips = Math.max(1, Math.min(5, +opts.clips || 1));
    const answered = Object.entries(answers || {})
      .map(([id, a]) => {
        if (!a || a.skipped) return `- ${id}: (user skipped — decide the best creative choice yourself and make it excellent)`;
        return `- ${id}: ${[a.option, a.text].filter(Boolean).join(" — ")}${a.preset ? " (from style preset)" : ""}`;
      })
      .join("\n");

    const veoRule = clips > 1
      ? `The user wants a SEQUENCE of exactly ${clips} consecutive 8-second clips that tell one continuous mini-story (setup → development → payoff). Write a "characterBible": one dense paragraph that fixes every recurring character's age, face, hair, body, wardrobe and colors, plus the location and lighting look; then a "shotList" of exactly ${clips} items, each a complete standalone Veo prompt that repeats the character bible VERBATIM, has one clear action, its own shot type and camera move, and audio that continues naturally from the previous clip. The main "prompt" field = shot 1.`
      : "One clear action per 8-second clip. Include shot type + camera movement, subject details, action, setting, lighting, style, explicit audio (ambience / SFX / dialogue in quotes with speaker / music or 'no music'). Also produce a structured JSON version of the prompt and an optional 3-shot list (establishing / main / detail) with an identical character description in every shot.";

    const system = `You are a world-class prompt engineer and creative director for Google's generative AI tools. Transform the user's raw prompt plus their answers into a SUPER PROMPT that is precise, vivid, technically correct for the platform, and produces far better output than the original.

${platformBrief(pf)}
${opts.image ? "\n" + imageBrief(platformId, opts.mode) + "\n" : ""}
WRITING RULES:
- Main prompt language: ${langName}. ${platformId === "gemini" || platformId === "vids" ? "" : "Visual prompts work best in English; keep any dialogue in the language the user implied and say so (e.g. 'speaking in Indonesian')."}
- Be specific and sensory; replace vague words (beautiful, nice, cool) with concrete visual/technical descriptors.
- Keep everything the user explicitly asked for. Fill gaps with strong, coherent creative choices — never with placeholders like [insert].
- Where the user skipped a question, choose the option that best serves the intent and keep it consistent with everything else.
- Do NOT put negations in the main prompt; put them in "negative" as a comma-separated list of nouns.
- ${platformId === "veo" ? veoRule : ""}
- ${platformId === "vids" ? "Produce a 'Help me create' brief AND a scene-by-scene storyboard: for each scene give title, voiceover narration (<= 20 words), on-screen text (<= 8 words), and a visual description written as a Veo clip prompt (one action, shot, lighting, style)." : ""}
- ${platformId === "image" ? "Structure: subject + details, pose/action, setting, composition, lighting, color palette, style/medium, camera/lens if photographic, quality terms, aspect ratio." : ""}
- ${platformId === "gemini" ? "Structure the prompt with clear sections: ROLE, CONTEXT, TASK, RULES, OUTPUT FORMAT, EXAMPLES (if any), QUALITY BAR with a self-check instruction. Also produce a concise 'system' instruction suitable for AI Studio's System Instruction field." : ""}
- ${platformId === "omni" ? "Open with the output modality. Use labeled blocks (OUTPUT / SUBJECT / REFERENCE HANDLING / STYLE / CONSTRAINTS / AVOID)." : ""}
- Provide 2-3 meaningful variants (different mood / style / angle), each a full standalone prompt.
- "changes": 4-8 bullets (in Bahasa Indonesia) explaining what you improved and why it matters for this platform.
- "tips": 3-5 short platform-specific tips (Bahasa Indonesia) for getting the best result when running this prompt.
- "settings": recommended technical settings (aspect ratio, duration, model/mode, clips, etc.).

Return ONLY JSON with this shape (omit keys that do not apply):
{
 "prompt": "<the super prompt>",
 "negative": "<comma-separated nouns>",
 "system": "<system instruction, gemini only>",
 "json": {<structured prompt object, veo only>},
 "characterBible": "<veo sequences only>",
 "shotList": [{"n":1,"title":"...","prompt":"..."}],
 "storyboard": [{"n":1,"title":"...","narration":"...","onScreenText":"...","visual":"..."}],
 "variants": [{"label":"...","prompt":"..."}],
 "settings": {"aspect":"16:9","duration":"8s","mode":"..."},
 "changes": ["..."],
 "tips": ["..."],
 "after": <int 0-100 your honest completeness score of the new prompt>
}`;

    const { image, ...optsForModel } = opts;
    const user = `RAW PROMPT:\n"""\n${prompt}\n"""\n\nUSER ANSWERS:\n${answered || "(none)"}\n\nMODE/OPTIONS: ${JSON.stringify({ ...optsForModel, previous: undefined, feedback: undefined, hasReferenceImage: !!image })}${opts.feedback ? `\n\nPREVIOUS RESULT TO REFINE:\n"""\n${opts.previous}\n"""\nUSER FEEDBACK ON IT: ${opts.feedback}\nApply the feedback faithfully while keeping everything else that worked.` : ""}`;

    const j = await callJSON(system, user, { temperature: 0.75, image });
    j.engine = "ai";
    j.platform = platformId;
    j.before = window.PI_LOCAL.analyze(prompt, platformId).score;
    if (typeof j.after !== "number") j.after = Math.max(j.before, window.PI_LOCAL.analyze(j.prompt || "", platformId).score);
    j.variants = j.variants || [];
    j.changes = j.changes || [];
    j.tips = j.tips || [];
    return j;
  }

  // ---------------- RUN (uji A/B teks) ----------------
  async function run(prompt, system, image) {
    const body = {
      contents: [{ role: "user", parts: userParts(prompt, image) }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    const j = await post(getModel(), body);
    const t = textOf(j);
    if (!t) throw new Error("Tidak ada teks (finishReason: " + (j.candidates?.[0]?.finishReason || "?") + ").");
    return t;
  }

  // ---------------- IMAGE (tes Nano Banana) ----------------
  async function generateImage(prompt, image) {
    const model = await pickImageModel();
    const j = await post(model, {
      contents: [{ role: "user", parts: userParts(prompt, image) }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    });
    const parts = j.candidates?.[0]?.content?.parts || [];
    const img = parts.find((p) => p.inlineData?.data);
    if (!img) throw new Error("Model tidak mengembalikan gambar. " + (textOf(j) || ""));
    return { model, src: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}` };
  }

  async function testKey(key) {
    const models = await listModels(key);
    if (!models.length) throw new Error("Key valid tetapi tidak ada model Gemini yang tersedia.");
    return models;
  }

  return { getKey, setKey, getModel, setModel, listModels, analyze, generate, run, generateImage, testKey, DEFAULT_MODEL };
})();
