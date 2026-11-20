/* ============================================================
   app.js — state, rendering, interaksi
   ============================================================ */
(() => {
  const { PLATFORMS, ORDER, SECTIONS, wc } = window.PI_PLATFORMS;
  const TEXT_PLATFORMS = ["gemini", "cerpen", "novel", "assistant"];
  const DROP_TEXT = {
    video: "📎 Klik atau seret gambar ke sini (frame awal Flow, foto produk, karakter, gambar yang mau diedit)",
    story: "📎 Gambar inspirasi tokoh, tempat, atau suasana (dibaca engine AI)",
    general: "📎 Gambar atau screenshot sebagai konteks tugas (dibaca engine AI)",
  };
  const LOCAL = window.PI_LOCAL;
  const AI = window.PI_AI;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Opsi pertanyaan bisa string atau {label, value}: label tampil ke pengguna, value masuk ke prompt
  const optLabel = (o) => (typeof o === "string" ? o : o.label);
  const optValue = (o) => (typeof o === "string" ? o : (o.value ?? o.label));

  const REPO_URL = "https://github.com/amajing-grace-2026/prompt-improver";
  $("#ghLink").href = REPO_URL;

  // ---------------- STATE ----------------
  const state = {
    platform: PLATFORMS[localStorage.getItem("pi_platform")] ? localStorage.getItem("pi_platform") : "veo",
    section: "video",
    mode: "",
    outputLang: "en",
    raw: "",
    analysis: null,
    answers: {},
    result: null,
    activeTab: "prompt",
    clips: 1,
    image: null, // {mime, data, name, preview}
    preset: null,
  };

  // ---------------- ENGINE ----------------
  function enginePref() { return localStorage.getItem("pi_engine") || "auto"; }
  function activeEngine() {
    const pref = enginePref();
    if (pref === "local") return "local";
    if (pref === "ai") return AI.getKey() ? "ai" : "local";
    return AI.getKey() ? "ai" : "local";
  }
  function renderEngineBadge() {
    const e = activeEngine();
    const b = $("#engineBadge");
    b.innerHTML = e === "ai" ? `⚡ Engine: <b>AI · ${esc(AI.getModel())}</b>` : `⚙ Engine: <b>Lokal</b>`;
    b.classList.toggle("ai", e === "ai");
    $("#engineNote").innerHTML = e === "ai"
      ? `Engine AI aktif (Gemini <code>${esc(AI.getModel())}</code>) — pertanyaan dan hasil disesuaikan dengan konteks prompt-mu.`
      : `Engine lokal aktif (tanpa API key). Hasil lebih dasar dan tidak menerjemahkan otomatis. <a href="#" id="linkSetKey">Pasang API key Gemini gratis</a> untuk hasil jauh lebih baik.`;
    const l = $("#linkSetKey");
    if (l) l.onclick = (ev) => { ev.preventDefault(); openModal("settingsModal"); };
  }

  // ---------------- STEP NAV ----------------
  function goStep(n) {
    $$(".step-panel").forEach((p) => p.classList.add("hidden"));
    $(`#step${n}`).classList.remove("hidden");
    $$(".stepper .step").forEach((s) => {
      const k = +s.dataset.step;
      s.classList.toggle("is-active", k === n);
      s.classList.toggle("is-done", k < n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $$(".stepper .step").forEach((s) => s.addEventListener("click", () => {
    const k = +s.dataset.step;
    if (k === 1) goStep(1);
    if (k === 2 && state.analysis) goStep(2);
    if (k === 3 && state.result) goStep(3);
  }));

  // ---------------- STEP 1 ----------------
  function renderPlatforms() {
    const sec = SECTIONS.find((s) => s.id === state.section) || SECTIONS[0];
    $("#sectionTabs").innerHTML = SECTIONS.map((s) => `<button class="section-tab ${s.id === sec.id ? "is-active" : ""}" role="tab" aria-selected="${s.id === sec.id}" data-sec="${s.id}">
        <span class="ico">${s.icon}</span><span><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span></button>`).join("");
    $$("#sectionTabs .section-tab").forEach((b) => b.addEventListener("click", () => selectSection(b.dataset.sec)));
    const grid = $("#platformGrid");
    grid.innerHTML = sec.platforms.map((id) => {
      const p = PLATFORMS[id];
      return `<button class="pf-card ${id === state.platform ? "is-selected" : ""}" role="radio" aria-checked="${id === state.platform}" data-pf="${id}">
        <span class="ico">${p.icon}</span><b>${esc(p.name)}</b><small>${esc(p.short)}</small></button>`;
    }).join("");
    grid.querySelectorAll(".pf-card").forEach((b) => b.addEventListener("click", () => selectPlatform(b.dataset.pf)));
    $("#dropText").textContent = DROP_TEXT[sec.id] || DROP_TEXT.video;
    renderModes();
    renderExamples();
  }
  function selectSection(id) {
    if (id === state.section) return;
    const sec = SECTIONS.find((s) => s.id === id);
    if (!sec) return;
    const last = localStorage.getItem("pi_platform_" + id);
    selectPlatform(sec.platforms.includes(last) ? last : sec.platforms[0]);
  }
  function selectPlatform(id) {
    state.platform = id;
    state.section = PLATFORMS[id].section || "video";
    localStorage.setItem("pi_platform", id);
    localStorage.setItem("pi_platform_" + state.section, id);
    renderPlatforms();
    $("#langSelect").value = PLATFORMS[id].outputLang;
    state.outputLang = PLATFORMS[id].outputLang;
    renderTips();
    state.preset = null;
    renderPresets();
    $("#clipsField").classList.toggle("hidden", id !== "veo");
  }
  function renderModes() {
    const p = PLATFORMS[state.platform];
    const sel = $("#modeSelect");
    sel.innerHTML = p.settings.extra.map((m) => `<option>${esc(m)}</option>`).join("");
    state.mode = sel.value;
  }
  function renderExamples() {
    const p = PLATFORMS[state.platform];
    $("#exampleChips").innerHTML = `<span class="muted small" style="align-self:center">Coba contoh:</span>` +
      p.examples.map((e) => `<button class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join("");
    $$("#exampleChips .chip").forEach((c) => c.addEventListener("click", () => {
      $("#rawPrompt").value = c.dataset.ex;
      updateCount();
    }));
  }
  function updateCount() {
    const n = wc($("#rawPrompt").value);
    $("#charCount").textContent = `${n} kata`;
  }
  $("#rawPrompt").addEventListener("input", updateCount);
  $("#modeSelect").addEventListener("change", (e) => (state.mode = e.target.value));
  $("#langSelect").addEventListener("change", (e) => (state.outputLang = e.target.value));

  async function analyze() {
    const raw = $("#rawPrompt").value.trim();
    if (!raw) return toast("Tulis prompt dulu ya.");
    state.raw = raw;
    state.answers = {};
    showLoading("Menganalisis prompt & menyusun pertanyaan…");
    try {
      const engine = activeEngine();
      let a;
      if (engine === "ai") {
        try { a = await AI.analyze(raw, state.platform, "id", { image: state.image, preset: currentPreset(), mode: state.mode }); }
        catch (e) { toast("Engine AI gagal: " + e.message + " — memakai engine lokal."); a = LOCAL.analyze(raw, state.platform); }
      } else a = LOCAL.analyze(raw, state.platform);
      a = dropPresetQuestions(a);
      state.analysis = a;
      renderAnalysis();
      renderQuestions();
      goStep(2);
    } finally { hideLoading(); }
  }

  async function quickGenerate() {
    const raw = $("#rawPrompt").value.trim();
    if (!raw) return toast("Tulis prompt dulu ya.");
    state.raw = raw;
    state.analysis = LOCAL.analyze(raw, state.platform);
    state.answers = {};
    for (const q of state.analysis.questions) state.answers[q.id] = { skipped: true };
    renderAnalysis(); renderQuestions();
    await generate();
  }

  // ---------------- STEP 2 ----------------
  function ringColor(s) { return s < 40 ? "var(--bad)" : s < 70 ? "var(--warn)" : "var(--ok)"; }
  function renderAnalysis() {
    const a = state.analysis;
    const p = PLATFORMS[state.platform];
    const covered = a.covered || [];
    const missing = a.missing || [];
    $("#analysisBox").innerHTML = `
      <div class="score-ring" style="--pct:${a.score};--ring-color:${ringColor(a.score)}"><b>${a.score}</b><small>/100</small></div>
      <div class="analysis-text">
        <h3>${esc(a.verdict || "")}</h3>
        <p class="muted small">${esc(a.summary || "")} · Target: <b>${esc(p.name)}</b> · ${a.questions.length} pertanyaan · engine ${a.engine === "ai" ? "AI" : "lokal"}</p>
        <div class="chips">
          ${covered.map((c) => `<span class="chip static ok">✓ ${esc(c)}</span>`).join("")}
          ${missing.map((c) => `<span class="chip static miss">✗ ${esc(c)}</span>`).join("")}
          ${currentPreset() ? `<span class="chip static">🎨 Preset: ${esc(currentPreset().label)}</span>` : ""}
          ${state.image ? `<span class="chip static">📎 Gambar referensi${a.engine === "ai" ? "" : " (hanya dibaca engine AI)"}</span>` : ""}
        </div>
      </div>`;
  }
  function renderQuestions() {
    const qs = state.analysis.questions;
    $("#questions").innerHTML = qs.map((q) => {
      const a = state.answers[q.id] || {};
      return `<div class="q-card ${a.skipped ? "is-skipped" : ""}" data-q="${esc(q.id)}">
        <div class="q-head"><div class="q-num">${q.n}</div>
          <div><div class="q-dim">${esc(q.dim || "")}</div><div class="q-text">${esc(q.question)}</div><div class="q-why">${esc(q.why || "")}</div></div></div>
        <div class="chips">${(q.options || []).map((o) => `<button class="chip ${a.optionLabel === optLabel(o) ? "is-selected" : ""}" data-opt="${esc(optValue(o))}" data-label="${esc(optLabel(o))}">${esc(optLabel(o))}</button>`).join("")}</div>
        <input type="text" class="q-input" placeholder="${esc(q.placeholder || "Atau tulis jawabanmu sendiri…")}" value="${esc(a.text || "")}" />
        <div class="q-foot"><button class="q-skip">${a.skipped ? "Jawab pertanyaan ini" : "Lewati — biarkan AI memutuskan"}</button></div>
      </div>`;
    }).join("");
    $$(".q-card").forEach((card) => {
      const id = card.dataset.q;
      card.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
        const cur = state.answers[id] || {};
        const same = cur.optionLabel === c.dataset.label;
        state.answers[id] = { ...cur, option: same ? "" : c.dataset.opt, optionLabel: same ? "" : c.dataset.label, skipped: false };
        card.querySelectorAll(".chip").forEach((x) => x.classList.toggle("is-selected", !same && x === c));
        card.classList.remove("is-skipped");
        card.querySelector(".q-skip").textContent = "Lewati — biarkan AI memutuskan";
      }));
      card.querySelector(".q-input").addEventListener("input", (e) => {
        state.answers[id] = { ...(state.answers[id] || {}), text: e.target.value, skipped: false };
        card.classList.remove("is-skipped");
      });
      card.querySelector(".q-skip").addEventListener("click", () => {
        const cur = state.answers[id] || {};
        const now = !cur.skipped;
        state.answers[id] = { ...cur, skipped: now };
        card.classList.toggle("is-skipped", now);
        card.querySelector(".q-skip").textContent = now ? "Jawab pertanyaan ini" : "Lewati — biarkan AI memutuskan";
      });
    });
  }

  async function generate(feedback) {
    showLoading(feedback ? "Memperbaiki super prompt sesuai masukanmu…" : "Menyusun super prompt…");
    try {
      const engine = activeEngine();
      const opts = { mode: state.mode, outputLang: state.outputLang, clips: state.platform === "veo" ? state.clips : 1, image: state.image, preset: currentPreset()?.label || "" };
      // Pertanyaan yang tidak disentuh dikirim sebagai "dilewati" agar model memutuskan sendiri
      const base = { ...state.answers };
      for (const q of state.analysis?.questions || []) if (!base[q.id]) base[q.id] = { skipped: true };
      const answers = withPreset(base);
      if (feedback && state.result) { opts.feedback = feedback; opts.previous = state.result.prompt; }
      let r;
      if (engine === "ai") {
        try { r = await AI.generate(state.raw, state.platform, answers, opts); }
        catch (e) { toast("Engine AI gagal: " + e.message + " — memakai engine lokal."); r = LOCAL.generate(state.raw, state.platform, answers, opts); }
      } else {
        r = LOCAL.generate(state.raw, state.platform, answers, opts);
        if (feedback) r.note = "Engine lokal tidak bisa menerapkan masukan bebas. Aktifkan engine AI untuk fitur 'perbaiki lagi'.";
      }
      state.result = r;
      state.activeTab = "prompt";
      renderResult();
      saveHistory();
      goStep(3);
      $("#feedback").value = "";
    } finally { hideLoading(); }
  }

  // ---------------- STEP 3 ----------------
  const PLATFORM_LINKS = {
    veo: [["Buka Google Flow ↗", "https://labs.google/flow"], ["Buka Gemini ↗", "https://gemini.google.com"], ["Vertex AI Media Studio ↗", "https://console.cloud.google.com/vertex-ai/studio/media"]],
    vids: [["Buka Google Vids ↗", "https://vids.google.com"], ["Buka Google Flow ↗", "https://labs.google/flow"]],
    image: [["Buka AI Studio ↗", "https://aistudio.google.com"], ["Buka Whisk ↗", "https://labs.google/fx/tools/whisk"], ["Buka Gemini ↗", "https://gemini.google.com"]],
    gemini: [["Buka AI Studio ↗", "https://aistudio.google.com/prompts/new_chat"], ["Buka Gemini ↗", "https://gemini.google.com"]],
    omni: [["Buka AI Studio ↗", "https://aistudio.google.com"], ["Buka Google Flow ↗", "https://labs.google/flow"]],
    cerpen: [["Buka AI Studio ↗", "https://aistudio.google.com/prompts/new_chat"], ["Buka Gemini ↗", "https://gemini.google.com"]],
    novel: [["Buka AI Studio ↗", "https://aistudio.google.com/prompts/new_chat"], ["Buka Gemini ↗", "https://gemini.google.com"]],
    assistant: [["Buat Gem ↗", "https://gemini.google.com/gems/create"], ["Buka AI Studio ↗", "https://aistudio.google.com/prompts/new_chat"]],
  };

  function codebox(text, label = "Salin") {
    return `<div class="codebox"><pre>${esc(text)}</pre><button class="btn small copy" data-copy="${esc(text)}">${label}</button></div>`;
  }

  function renderResult() {
    const r = state.result;
    const p = PLATFORMS[state.platform];
    const tabs = [["prompt", state.platform === "assistant" ? "Instruksi asisten" : "Super prompt"]];
    if (r.storyBible) tabs.push(["bible2", "Story bible"]);
    if (r.outline?.length) tabs.push(["outline", `Kerangka (${r.outline.length})`]);
    if (r.negative) tabs.push(["negative", "Negative prompt"]);
    if (r.system) tabs.push(["system", "System instruction"]);
    if (r.json) tabs.push(["json", "JSON (terstruktur)"]);
    if (r.characterBible) tabs.push(["bible", "Character bible"]);
    if (r.shotList?.length) tabs.push(["shots", `Shot list (${r.shotList.length})`]);
    if (r.storyboard?.length) tabs.push(["story", `Storyboard (${r.storyboard.length})`]);
    const settings = Object.entries(r.settings || {}).filter(([, v]) => v);

    const panes = {
      prompt: codebox(r.prompt),
      negative: r.negative ? codebox(r.negative) : "",
      system: r.system ? codebox(r.system) : "",
      json: r.json ? codebox(JSON.stringify(r.json, null, 2)) : "",
      bible: r.characterBible ? `<p class="muted small">Tempel teks ini PERSIS sama di setiap klip agar karakter dan dunia tetap konsisten.</p>${codebox(r.characterBible)}` : "",
      shots: (r.shotList || []).map((s) => `<div class="shot"><b>Shot ${s.n} — ${esc(s.title || "")}</b><pre>${esc(s.prompt)}</pre><div class="row gap" style="margin-top:6px"><button class="btn small copy" data-copy="${esc(s.prompt)}">Salin shot ${s.n}</button></div></div>`).join(""),
      bible2: r.storyBible ? `<p class="muted small">Acuan tetap untuk seluruh cerita. Di AI Studio, tempel di System Instruction bersama aturan menulis.</p>${codebox(r.storyBible)}` : "",
      outline: (r.outline || []).map((o) => `<div class="shot"><b>${state.platform === "novel" ? "Bab" : "Beat"} ${o.n} — ${esc(o.title || "")}</b><div class="meta">${esc(o.summary || "")}</div>${o.prompt ? `<pre>${esc(o.prompt)}</pre><div class="row gap" style="margin-top:6px"><button class="btn small copy" data-copy="${esc(o.prompt)}">Salin prompt bab ${o.n}</button></div>` : ""}</div>`).join(""),
      story: (r.storyboard || []).map((s) => `<div class="shot"><b>Adegan ${s.n} — ${esc(s.title || "")}</b>
          <div class="meta">🎙 Narasi: ${esc(s.narration || "-")}</div><div class="meta">🔤 Teks layar: ${esc(s.onScreenText || "-")}</div>
          <pre>${esc(s.visual || "")}</pre><div class="row gap" style="margin-top:6px"><button class="btn small copy" data-copy="${esc(s.visual || "")}">Salin prompt visual</button></div></div>`).join(""),
    };

    $("#resultBox").innerHTML = `
      <div class="result-top">
        <div class="score-compare">
          <span class="score-pill">Sebelum: ${r.before ?? "–"}</span><span>→</span><span class="score-pill after">Sesudah: ${r.after ?? "–"}</span>
          <span class="muted small">kelengkapan untuk ${esc(p.name)}</span>
        </div>
        <div class="settings-badges">${settings.map(([k, v]) => `<span class="chip static">${esc(k)}: ${esc(v)}</span>`).join("")}<span class="chip static">${r.engine === "ai" ? "⚡ AI" : "⚙ Lokal"}</span></div>
      </div>
      <div class="tabs">${tabs.map(([id, label]) => `<button class="tab ${state.activeTab === id ? "is-active" : ""}" data-tab="${id}">${esc(label)}</button>`).join("")}</div>
      ${tabs.map(([id]) => `<div class="tabpane ${state.activeTab === id ? "is-active" : ""}" data-pane="${id}">${panes[id]}</div>`).join("")}
      ${r.note ? `<p class="note">ⓘ ${esc(r.note)}</p>` : ""}
      <div class="open-links">
        <button class="btn primary copy" data-copy="${esc(r.prompt)}">📋 Salin super prompt</button>
        ${(PLATFORM_LINKS[state.platform] || []).map(([t, u]) => `<a class="btn ghost" href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join("")}
        <button class="btn ghost" id="btnDownloadTxt">⬇ .txt</button>
        <button class="btn ghost" id="btnDownloadJson">⬇ .json</button>
        <button class="btn ghost" id="btnShare">🔗 Bagikan</button>
      </div>
      <div id="labBox"></div>
      ${r.variants?.length ? `<h3 style="margin-top:18px">Variasi</h3>${r.variants.map((v) => `<details class="variant"><summary>${esc(v.label)}</summary>${codebox(v.prompt)}</details>`).join("")}` : ""}
      <div class="result-grid">
        <div class="card"><h4>Apa yang diperbaiki</h4><ul>${(r.changes || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
        <div class="card"><h4>Tips menjalankan di ${esc(p.name)}</h4><ul>${(r.tips || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
      </div>`;

    $$("#resultBox .tab").forEach((t) => t.addEventListener("click", () => {
      state.activeTab = t.dataset.tab;
      $$("#resultBox .tab").forEach((x) => x.classList.toggle("is-active", x === t));
      $$("#resultBox .tabpane").forEach((x) => x.classList.toggle("is-active", x.dataset.pane === t.dataset.tab));
    }));
    $("#btnDownloadTxt").addEventListener("click", () => download(`super-prompt-${state.platform}.txt`, exportText(r)));
    $("#btnDownloadJson").addEventListener("click", () => download(`super-prompt-${state.platform}.json`, JSON.stringify({ platform: state.platform, raw: state.raw, answers: state.answers, result: r }, null, 2)));
    $("#btnShare").addEventListener("click", shareResult);
    renderLab();
  }

  function exportText(r) {
    const p = PLATFORMS[state.platform];
    let t = `# SUPER PROMPT — ${p.name}\n\n${r.prompt}\n`;
    if (r.negative) t += `\n## NEGATIVE PROMPT\n${r.negative}\n`;
    if (r.system) t += `\n## SYSTEM INSTRUCTION\n${r.system}\n`;
    if (r.settings) t += `\n## SETTINGS\n${Object.entries(r.settings).map(([k, v]) => `${k}: ${v}`).join("\n")}\n`;
    if (r.storyBible) t += `\n## STORY BIBLE\n${r.storyBible}\n`;
    if (r.outline?.length) t += `\n## KERANGKA\n${r.outline.map((o) => `${o.n}. ${o.title} — ${o.summary}${o.prompt ? `\n   Prompt: ${o.prompt}` : ""}`).join("\n")}\n`;
    if (r.characterBible) t += `\n## CHARACTER BIBLE\n${r.characterBible}\n`;
    if (r.shotList?.length) t += `\n## SHOT LIST\n${r.shotList.map((s) => `Shot ${s.n} — ${s.title}\n${s.prompt}`).join("\n\n")}\n`;
    if (r.storyboard?.length) t += `\n## STORYBOARD\n${r.storyboard.map((s) => `Adegan ${s.n} — ${s.title}\nNarasi: ${s.narration}\nTeks layar: ${s.onScreenText}\nVisual: ${s.visual}`).join("\n\n")}\n`;
    if (r.variants?.length) t += `\n## VARIASI\n${r.variants.map((v) => `[${v.label}]\n${v.prompt}`).join("\n\n")}\n`;
    t += `\n## PROMPT AWAL\n${state.raw}\n`;
    return t;
  }

  // ---------------- HISTORY ----------------
  function loadHistory() { try { return JSON.parse(localStorage.getItem("pi_history") || "[]"); } catch { return []; } }
  function saveHistory() {
    const h = loadHistory();
    h.unshift({ t: Date.now(), platform: state.platform, raw: state.raw, answers: state.answers, analysis: state.analysis, result: state.result, mode: state.mode, outputLang: state.outputLang, clips: state.clips, preset: state.preset, hadImage: !!state.image });
    localStorage.setItem("pi_history", JSON.stringify(h.slice(0, 40)));
  }
  function renderHistory() {
    const h = loadHistory();
    $("#historyBody").innerHTML = h.length ? h.map((it, i) => `<div class="hist-item" data-i="${i}">
      <div class="meta"><span>${PLATFORMS[it.platform]?.icon || ""} ${esc(PLATFORMS[it.platform]?.name || it.platform)}</span><span>${new Date(it.t).toLocaleString("id-ID")}</span></div>
      <p>${esc(it.raw)}</p></div>`).join("") : `<p class="muted">Belum ada riwayat.</p>`;
    $$(".hist-item").forEach((el) => el.addEventListener("click", () => {
      const it = loadHistory()[+el.dataset.i];
      if (!it) return;
      Object.assign(state, { platform: it.platform, raw: it.raw, answers: it.answers || {}, analysis: it.analysis, result: it.result, mode: it.mode || "", outputLang: it.outputLang || "en", activeTab: "prompt" });
      selectPlatform(it.platform);
      state.preset = it.preset || null; state.clips = it.clips || 1; $("#clipsSelect").value = state.clips; renderPresets();
      $("#rawPrompt").value = it.raw; updateCount();
      if (it.analysis) { renderAnalysis(); renderQuestions(); }
      if (it.result) { renderResult(); goStep(3); } else goStep(1);
      closeAll();
    }));
  }
  $("#btnClearHistory").addEventListener("click", () => {
    if (confirm("Hapus semua riwayat di browser ini?")) { localStorage.removeItem("pi_history"); renderHistory(); }
  });

  // ---------------- TIPS ----------------
  function renderTips() {
    const p = PLATFORMS[state.platform];
    $("#tipsTitle").textContent = `${p.icon} Panduan ${p.name}`;
    $("#tipsBody").innerHTML = `<p class="muted">${esc(p.desc)}</p><h4>Dimensi yang dicek</h4><div class="chips">${p.dims.map((d) => `<span class="chip static">${esc(d.label)}</span>`).join("")}</div>
      <h4 style="margin-top:14px">Aturan emas</h4><ol>${p.guide.map((g) => `<li>${esc(g)}</li>`).join("")}</ol>`;
  }

  // ---------------- SETTINGS ----------------
  async function populateModels(key) {
    const sel = $("#modelSelect");
    const cur = AI.getModel();
    try {
      const models = await AI.listModels(key);
      sel.innerHTML = models.map((m) => `<option value="${esc(m.id)}" ${m.id === cur ? "selected" : ""}>${esc(m.id)}</option>`).join("");
      if (!models.some((m) => m.id === cur)) {
        const pick = models.find((m) => /2\.5-flash$/.test(m.id)) || models.find((m) => /flash/.test(m.id)) || models[0];
        if (pick) { AI.setModel(pick.id); sel.value = pick.id; }
      }
      return models;
    } catch (e) { throw e; }
  }
  $("#btnTestKey").addEventListener("click", async () => {
    const key = $("#apiKey").value.trim();
    const st = $("#keyStatus");
    if (!key) { st.textContent = "Isi API key dulu."; return; }
    st.textContent = "Menguji key…";
    try {
      await AI.testKey(key);
      AI.setKey(key);
      await populateModels(key);
      st.textContent = "✓ Key valid dan tersimpan di browser ini.";
      renderEngineBadge();
      toast("Engine AI aktif ⚡");
    } catch (e) { st.textContent = "✗ " + e.message; }
  });
  $("#btnClearKey").addEventListener("click", () => {
    AI.setKey(""); $("#apiKey").value = ""; $("#keyStatus").textContent = "Key dihapus."; renderEngineBadge();
  });
  $("#btnToggleKey").addEventListener("click", () => {
    const i = $("#apiKey"); i.type = i.type === "password" ? "text" : "password";
  });
  $("#modelSelect").addEventListener("change", (e) => { AI.setModel(e.target.value); renderEngineBadge(); });
  $("#engineSelect").addEventListener("change", (e) => { localStorage.setItem("pi_engine", e.target.value); renderEngineBadge(); });

  // ---------------- MODAL / DRAWER ----------------
  function openModal(id) {
    closeAll();
    $("#overlay").classList.remove("hidden");
    $(`#${id}`).classList.remove("hidden");
    if (id === "settingsModal") {
      $("#apiKey").value = AI.getKey();
      $("#engineSelect").value = enginePref();
      if (AI.getKey()) populateModels(AI.getKey()).catch(() => {});
    }
    if (id === "historyDrawer") renderHistory();
    if (id === "tipsDrawer") renderTips();
  }
  function closeAll() {
    $("#overlay").classList.add("hidden");
    ["settingsModal", "tipsDrawer", "historyDrawer"].forEach((i) => $(`#${i}`).classList.add("hidden"));
  }
  $("#overlay").addEventListener("click", closeAll);
  $$("[data-close]").forEach((b) => b.addEventListener("click", closeAll));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  $("#engineBadge").addEventListener("click", () => openModal("settingsModal"));
  $("#btnHistory").addEventListener("click", () => openModal("historyDrawer"));
  $("#btnTips").addEventListener("click", () => openModal("tipsDrawer"));

  // ---------------- THEME ----------------
  function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); localStorage.setItem("pi_theme", t); }
  $("#btnTheme").addEventListener("click", () => applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light"));
  applyTheme(localStorage.getItem("pi_theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));

  // ---------------- UTIL ----------------
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 2600); }
  function showLoading(txt) { $("#loadingText").textContent = txt; $("#loading").classList.remove("hidden"); }
  function hideLoading() { $("#loading").classList.add("hidden"); }
  function download(name, content) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".copy");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Tersalin ✓"); }
    catch { const ta = document.createElement("textarea"); ta.value = b.dataset.copy; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("Tersalin ✓"); }
  });

  // ---------------- BUTTONS ----------------
  $("#btnAnalyze").addEventListener("click", analyze);
  $("#btnQuick").addEventListener("click", quickGenerate);
  $("#btnGenerate").addEventListener("click", () => generate());
  $("#btnSkipAll").addEventListener("click", () => { for (const q of state.analysis.questions) state.answers[q.id] = { skipped: true }; generate(); });
  $("#btnBack1").addEventListener("click", () => goStep(1));
  $("#btnBack2").addEventListener("click", () => goStep(state.analysis ? 2 : 1));
  $("#btnRefine").addEventListener("click", () => { const f = $("#feedback").value.trim(); if (!f) return toast("Tulis dulu apa yang ingin diubah."); generate(f); });
  $("#btnNew").addEventListener("click", () => { state.analysis = null; state.result = null; state.answers = {}; $("#rawPrompt").value = ""; updateCount(); goStep(1); });
  $("#rawPrompt").addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze(); });

  // ---------------- PRESETS ----------------
  const PRESETS = window.PI_PRESETS || {};
  function currentPreset() { return (PRESETS[state.platform] || []).find((p) => p.id === state.preset) || null; }
  function renderPresets() {
    const list = PRESETS[state.platform] || [];
    $("#presetChips").innerHTML = list.length
      ? list.map((p) => `<button class="chip ${p.id === state.preset ? "is-selected" : ""}" data-preset="${esc(p.id)}" title="${esc(Object.values(p.fields).join(" · "))}">${esc(p.label)}</button>`).join("")
      : `<span class="muted small">Belum ada preset untuk platform ini.</span>`;
    $$("#presetChips .chip").forEach((c) => c.addEventListener("click", () => {
      state.preset = state.preset === c.dataset.preset ? null : c.dataset.preset;
      renderPresets();
    }));
  }
  // Preset mengisi dimensi yang tidak dijawab; jawaban pengguna selalu menang
  function withPreset(answers) {
    const p = currentPreset();
    if (!p) return answers;
    const out = { ...answers };
    for (const [id, val] of Object.entries(p.fields)) {
      const a = out[id];
      if (!(a && !a.skipped && (a.option || a.text))) out[id] = { option: val, preset: true };
    }
    return out;
  }
  // Engine lokal: jangan tanyakan dimensi yang sudah diisi preset (tetap minimal 3 pertanyaan)
  function dropPresetQuestions(a) {
    const p = currentPreset();
    if (!p || a.engine !== "local") return a;
    const keep = a.questions.filter((q) => !(q.id in p.fields));
    const rest = a.questions.filter((q) => q.id in p.fields);
    const qs = keep.concat(rest.slice(0, Math.max(0, 3 - keep.length)));
    return { ...a, questions: qs.map((q, i) => ({ ...q, n: i + 1 })) };
  }

  // ---------------- GAMBAR REFERENSI ----------------
  async function loadImage(file) {
    if (!file || !/^image\//.test(file.type)) return toast("File harus berupa gambar.");
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/jpeg", 0.85);
      state.image = { mime: "image/jpeg", data: dataUrl.split(",")[1], name: file.name, preview: dataUrl };
      renderImage();
      if (activeEngine() !== "ai") toast("Gambar tersimpan. Pasang API key agar engine AI bisa membacanya.");
    } catch { toast("Gambar tidak bisa dibaca."); }
    finally { URL.revokeObjectURL(url); }
  }
  function renderImage() {
    const has = !!state.image;
    $("#refPreview").classList.toggle("hidden", !has);
    $("#dropzone").classList.toggle("hidden", has);
    if (has) $("#refImg").src = state.image.preview;
  }
  $("#refInput").addEventListener("change", (e) => loadImage(e.target.files[0]));
  $("#dropzone").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#refInput").click(); } });
  ["dragover", "dragenter"].forEach((ev) => $("#dropzone").addEventListener(ev, (e) => { e.preventDefault(); $("#dropzone").classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((ev) => $("#dropzone").addEventListener(ev, () => $("#dropzone").classList.remove("is-over")));
  $("#dropzone").addEventListener("drop", (e) => { e.preventDefault(); loadImage(e.dataTransfer.files[0]); });
  $("#btnRefRemove").addEventListener("click", () => { state.image = null; $("#refInput").value = ""; renderImage(); });
  document.addEventListener("paste", (e) => {
    if ($("#step1").classList.contains("hidden")) return;
    const f = [...(e.clipboardData?.files || [])].find((x) => /^image\//.test(x.type));
    if (f) { e.preventDefault(); loadImage(f); }
  });
  $("#clipsSelect").addEventListener("change", (e) => (state.clips = +e.target.value));

  // ---------------- LAB: uji A/B & tes gambar ----------------
  function renderLab() {
    const box = $("#labBox");
    if (!box) return;
    const hasKey = !!AI.getKey();
    let html = "";
    if (TEXT_PLATFORMS.includes(state.platform)) {
      const isAsst = state.platform === "assistant";
      html = `<div class="lab"><div class="lab-text"><b>🧪 Uji A/B</b><p class="muted small">${isAsst ? "Kirim satu pesan uji ke asisten dengan instruksi asli dan instruksi baru, lalu bandingkan jawabannya." : "Jalankan prompt asli dan super prompt di Gemini, lalu bandingkan hasilnya berdampingan."}</p>${isAsst ? `<input id="abMsg" type="text" value="Halo, saya mau tanya. Bisa bantu?" aria-label="Pesan uji untuk asisten" />` : ""}</div><button class="btn" id="btnAB" ${hasKey ? "" : "disabled"}>Jalankan uji A/B</button></div>`;
    }
    if (state.platform === "image") html = `<div class="lab"><div><b>🖼️ Tes generate gambar</b><p class="muted small">Coba super prompt langsung dengan model gambar Gemini (Nano Banana). Butuh key yang punya akses model gambar.</p></div><button class="btn" id="btnImgTest" ${hasKey ? "" : "disabled"}>Generate gambar</button></div>`;
    if (html && !hasKey) html += `<p class="hint">Fitur ini butuh API key Gemini. <a href="#" class="js-open-settings">Pasang key</a>.</p>`;
    box.innerHTML = html ? html + `<div id="labOut"></div>` : "";
    box.querySelector(".js-open-settings")?.addEventListener("click", (e) => { e.preventDefault(); openModal("settingsModal"); });
    $("#btnAB")?.addEventListener("click", runAB);
    $("#btnImgTest")?.addEventListener("click", runImageTest);
  }
  async function runAB() {
    const r = state.result;
    $("#labOut").innerHTML = `<div class="ab-grid"><div class="card"><h4>Prompt asli</h4><div class="ab-text" id="abA">⏳ Menjalankan…</div></div><div class="card ab-win"><h4>Super prompt ✦</h4><div class="ab-text" id="abB">⏳ Menjalankan…</div></div></div>`;
    $("#btnAB").disabled = true;
    const show = (sel, p) => p.then((t) => ($(sel).textContent = t)).catch((e) => ($(sel).textContent = "✗ " + e.message));
    if (state.platform === "assistant") {
      const msg = $("#abMsg")?.value.trim() || "Halo, bisa bantu?";
      await Promise.all([show("#abA", AI.run(msg, state.raw, state.image)), show("#abB", AI.run(msg, r.prompt, state.image))]);
    } else {
      await Promise.all([show("#abA", AI.run(state.raw, "", state.image)), show("#abB", AI.run(r.prompt, r.system || "", state.image))]);
    }
    $("#btnAB").disabled = false;
  }
  async function runImageTest() {
    const r = state.result;
    $("#labOut").innerHTML = `<p class="muted">⏳ Membuat gambar…</p>`;
    $("#btnImgTest").disabled = true;
    try {
      const res = await AI.generateImage(r.negative ? `${r.prompt}\n\nAvoid: ${r.negative}.` : r.prompt, state.image);
      $("#labOut").innerHTML = `<figure class="gen-img"><img src="${res.src}" alt="Hasil uji super prompt" /><figcaption class="muted small">Model: ${esc(res.model)} · <a href="${res.src}" download="super-prompt-test.png">unduh</a></figcaption></figure>`;
    } catch (e) {
      $("#labOut").innerHTML = `<p class="note">✗ ${esc(e.message)} Kamu tetap bisa menyalin prompt ke AI Studio atau Gemini.</p>`;
    } finally { $("#btnImgTest").disabled = false; }
  }

  // ---------------- LINK BAGIKAN ----------------
  function bytesToB64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64ToBytes(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(s + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
  }
  async function pipeBytes(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
  async function encodeShare(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) return "z" + bytesToB64(await pipeBytes(raw, new CompressionStream("deflate-raw")));
    return "j" + bytesToB64(raw);
  }
  async function decodeShare(s) {
    const bytes = b64ToBytes(s.slice(1));
    const out = s[0] === "z" ? await pipeBytes(bytes, new DecompressionStream("deflate-raw")) : bytes;
    return JSON.parse(new TextDecoder().decode(out));
  }
  async function shareResult() {
    const r = state.result;
    const keep = ["prompt", "negative", "system", "json", "storyBible", "outline", "characterBible", "shotList", "storyboard", "variants", "settings", "changes", "tips", "before", "after", "engine"];
    const payload = { v: 1, p: state.platform, raw: state.raw, r: Object.fromEntries(keep.filter((k) => r[k] != null && r[k] !== "").map((k) => [k, r[k]])) };
    const url = `${location.origin}${location.pathname}#s=${await encodeShare(payload)}`;
    try { await navigator.clipboard.writeText(url); toast("Link tersalin ✓ — prompt tersimpan di dalam link"); }
    catch { window.prompt("Salin link ini:", url); }
  }
  async function loadShared() {
    const m = location.hash.match(/^#s=([\w-]+)$/);
    if (!m) return;
    try {
      const d = await decodeShare(m[1]);
      if (!PLATFORMS[d.p]) throw new Error("platform");
      selectPlatform(d.p);
      state.raw = d.raw || ""; $("#rawPrompt").value = state.raw; updateCount();
      state.analysis = null; state.answers = {};
      state.result = { ...d.r, note: "Dibuka dari link bagikan. Klik 'Mulai baru' untuk membuat prompt sendiri." };
      state.activeTab = "prompt";
      renderResult(); goStep(3);
    } catch { toast("Link bagikan rusak atau tidak lengkap."); }
  }

  // ---------------- PWA ----------------
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("#btnInstall").classList.remove("hidden"); });
  $("#btnInstall").addEventListener("click", async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice;
    installEvt = null; $("#btnInstall").classList.add("hidden");
  });

  // ---------------- INIT ----------------
  renderPlatforms();
  selectPlatform(state.platform);
  renderEngineBadge();
  updateCount();
  // URL params: ?p=veo&q=prompt
  const u = new URLSearchParams(location.search);
  if (u.get("p") && PLATFORMS[u.get("p")]) selectPlatform(u.get("p"));
  if (u.get("q")) { $("#rawPrompt").value = u.get("q"); updateCount(); }
  loadShared();
})();
