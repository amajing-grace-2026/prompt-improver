/* ============================================================
   local-engine.js — Engine offline (tanpa API key)
   - analyze(prompt, platformId)  -> { score, covered, missing, questions }
   - generate(prompt, platformId, answers, opts) -> result
   Kualitas di bawah engine AI, tapi selalu bisa dipakai.
   ============================================================ */

window.PI_LOCAL = (() => {
  const { PLATFORMS, wc } = window.PI_PLATFORMS;

  // Tentukan jumlah pertanyaan dari tingkat kelengkapan
  function questionBudget(scorePct, missingCount) {
    let n;
    if (scorePct < 30) n = 10;
    else if (scorePct < 50) n = 8;
    else if (scorePct < 70) n = 6;
    else if (scorePct < 85) n = 4;
    else n = 3;
    return Math.max(3, Math.min(10, Math.min(n, Math.max(3, missingCount))));
  }

  function analyze(prompt, platformId) {
    const pf = PLATFORMS[platformId];
    const p = prompt || "";
    let total = 0, got = 0;
    const covered = [], missing = [];
    for (const d of pf.dims) {
      total += d.weight;
      let ok = false;
      try { ok = !!d.test(p); } catch (e) { ok = false; }
      if (ok) { got += d.weight; covered.push(d); } else missing.push(d);
    }
    const score = total ? Math.round((got / total) * 100) : 0;
    // urutkan missing berdasar bobot (prioritas)
    missing.sort((a, b) => b.weight - a.weight);
    const budget = questionBudget(score, missing.length);
    let picks = missing.slice(0, budget);
    // Kalau pertanyaan dari dimensi yang hilang < 3, tambah pertanyaan "penajam" dari dimensi yang sudah ada tapi bobot tinggi
    if (picks.length < 3) {
      const extra = covered
        .filter((d) => d.weight >= 2)
        .slice(0, 3 - picks.length)
        .map((d) => ({
          ...d,
          id: d.id,
          question: `Kamu sudah menyebut ${d.label.toLowerCase()}. Mau dipertajam? ${d.question}`,
          why: "Dimensi ini sudah ada, tapi detail tambahan biasanya memberi lompatan kualitas terbesar.",
        }));
      picks = picks.concat(extra);
    }
    const questions = picks.map((d, i) => ({
      id: d.id,
      n: i + 1,
      dim: d.label,
      question: d.question,
      why: d.why,
      options: d.options || [],
      placeholder: d.placeholder || "",
      allowSkip: true,
    }));
    return {
      engine: "local",
      score,
      verdict: verdict(score),
      covered: covered.map((d) => d.label),
      missing: missing.map((d) => d.label),
      questions,
      summary: `Prompt mencakup ${covered.length} dari ${pf.dims.length} dimensi penting untuk ${pf.name}.`,
    };
  }

  function verdict(score) {
    if (score < 30) return "Sangat umum — model akan menebak hampir semuanya.";
    if (score < 50) return "Kurang detail — hasil akan generik.";
    if (score < 70) return "Cukup — beberapa elemen penting masih kosong.";
    if (score < 85) return "Bagus — tinggal dipertajam.";
    return "Sangat lengkap — hanya perlu polesan.";
  }

  // Ambil jawaban terisi
  const ans = (answers, id) => {
    const a = answers && answers[id];
    if (!a) return "";
    if (a.skipped) return "";
    return [a.option, a.text].filter(Boolean).join(" — ").trim();
  };

  // ------------------- GENERATORS -------------------
  function generate(prompt, platformId, answers, opts = {}) {
    const fn = GEN[platformId] || GEN.omni;
    const res = fn(prompt.trim(), answers || {}, opts);
    res.engine = "local";
    res.platform = platformId;
    res.before = analyze(prompt, platformId).score;
    res.after = analyze(res.prompt, platformId).score;
    res.note = "Dibuat oleh engine lokal (tanpa AI). Untuk terjemahan otomatis ke bahasa Inggris dan hasil yang jauh lebih kreatif, aktifkan engine AI dengan API key Gemini.";
    return res;
  }

  const join = (parts, sep = " ") => parts.filter((s) => s && String(s).trim()).map((s) => String(s).trim()).join(sep);
  const sentence = (s) => (s ? s.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").replace(/[.\s]+$/, "") + "." : "");

  const GEN = {
    veo(raw, a, opts) {
      const subject = ans(a, "subject"), action = ans(a, "action"), setting = ans(a, "setting");
      const light = ans(a, "time_light"), camera = ans(a, "camera"), style = ans(a, "style");
      const audio = ans(a, "audio"), mood = ans(a, "mood"), fmt = ans(a, "format_video"), neg = ans(a, "negative");
      const aspect = /9:16|vertikal|vertical|reels|tiktok|shorts/i.test(fmt) ? "9:16" : "16:9";

      // Kalimat inti: [kamera] of [subjek] [aksi] [in setting]
      const core = join([
        camera || "Cinematic medium shot, slow push-in",
        "of",
        subject ? subject : raw,
        action ? (subject ? "who " + action : "— " + action) : "",
        setting ? "in " + setting : "",
      ]);
      const prompt = join([
        sentence(core),
        subject ? sentence("Scene concept: " + raw) : "",
        light ? sentence("Lighting: " + light) : "",
        sentence("Visual style: " + (style || "cinematic, photorealistic, shallow depth of field, natural color grading") + (mood ? ". Mood: " + mood : "")),
        sentence("Audio: " + (audio || "natural ambient sound matching the scene, subtle sound effects, no music")),
        "Aspect ratio " + aspect + ", 8 seconds, smooth realistic motion, consistent character and lighting throughout.",
      ], " ");

      const negative = join([neg, "subtitles, captions, on-screen text, watermark, logo, distorted faces, extra limbs, flickering, morphing, jittery camera"], ", ");

      const shotList = [
        { n: 1, title: "Establishing", prompt: prompt.replace(/^.*?of/, "Wide establishing shot, slow drone-like push-in, of") },
        { n: 2, title: "Main action", prompt },
        { n: 3, title: "Detail / reaction", prompt: prompt.replace(/^.*?of/, "Extreme close-up, static camera, shallow focus, of") },
      ];

      return {
        prompt,
        negative,
        settings: { aspect, duration: "8s", mode: opts.mode || "Text-to-Video" },
        json: {
          shot: camera || "cinematic medium shot, slow push-in",
          subject: subject || raw,
          action: action || "",
          setting: setting || "",
          lighting: light || "",
          style: style || "cinematic, photorealistic",
          mood: mood || "",
          audio: audio || "natural ambient sound, no music",
          negative_prompt: negative,
          aspect_ratio: aspect,
          duration_seconds: 8,
        },
        variants: [
          { label: "Lebih dramatis", prompt: prompt.replace(/Visual style:[^.]*\./, "Visual style: high-contrast cinematic, dramatic low-key lighting, anamorphic lens flares, teal-and-orange grade.") },
          { label: "Lebih natural / dokumenter", prompt: prompt.replace(/Visual style:[^.]*\./, "Visual style: naturalistic documentary look, handheld camera, soft available light, muted realistic colors.") },
        ],
        shotList,
        changes: [
          "Menambahkan instruksi kamera dan pergerakan eksplisit.",
          "Memisahkan subjek, aksi, latar, cahaya, gaya, dan audio ke kalimat terstruktur.",
          "Mendeskripsikan audio secara eksplisit agar Veo tidak menebak.",
          "Memindahkan larangan ke negative prompt dalam bentuk kata benda.",
          "Menetapkan aspect ratio dan durasi 8 detik.",
        ],
        tips: PLATFORMS.veo.guide.slice(0, 4),
      };
    },

    vids(raw, a) {
      const topic = ans(a, "topic") || raw, aud = ans(a, "audience"), dur = ans(a, "duration") || "60-90 detik, 5-6 adegan";
      const points = ans(a, "points"), voice = ans(a, "voice") || "Voiceover AI, Bahasa Indonesia", tone = ans(a, "tone") || "profesional tapi hangat";
      const cta = ans(a, "cta"), brand = ans(a, "brand"), fmt = ans(a, "format_video");
      const aspect = /9:16|vertikal|vertical|reels|tiktok|shorts/i.test(fmt) ? "9:16" : "16:9";
      const prompt = [
        `Buat video ${aspect} berdurasi ${dur} tentang: ${topic}.`,
        aud ? `Audiens: ${aud}.` : "",
        `Nada: ${tone}. Narasi: ${voice}; kalimat narasi pendek (maks 20 kata) dan natural.`,
        "Struktur adegan:",
        "1. HOOK (0-5 dtk): satu kalimat pembuka yang langsung menyentuh masalah/kebutuhan penonton.",
        "2. KONTEKS: kenapa topik ini penting bagi penonton.",
        points ? `3-n. ISI: ${points}` : "3-n. ISI: 3 poin utama, satu poin per adegan, masing-masing dengan contoh konkret.",
        `Penutup/CTA: ${cta || "rangkum pesan inti dan beri satu langkah jelas berikutnya"}.`,
        brand ? `Brand/aset: ${brand}.` : "",
        "Untuk tiap adegan berikan: judul adegan, teks narasi, teks di layar (maks 8 kata), dan deskripsi visual (klip AI 8 detik atau stok/aset).",
        "Deskripsi visual untuk klip AI harus mengikuti gaya Veo: satu aksi, jenis shot, pencahayaan, gaya visual konsisten.",
      ].filter(Boolean).join("\n");
      return {
        prompt,
        negative: "jargon internal tanpa penjelasan, teks di layar lebih dari 8 kata, musik yang menutupi narasi",
        settings: { aspect, duration: dur, mode: "Help me create" },
        variants: [
          { label: "Versi lebih singkat (30-45 dtk)", prompt: prompt.replace(dur, "30-45 detik, 3-4 adegan") },
          { label: "Versi energik untuk sosial media", prompt: prompt.replace(`Nada: ${tone}`, "Nada: energik, cepat, kalimat pendek, cocok sosial media") },
        ],
        changes: [
          "Menetapkan durasi, aspect ratio, dan jumlah adegan.",
          "Menyusun struktur hook → konteks → isi → CTA yang dimengerti Vids.",
          "Menentukan bahasa dan gaya narasi voiceover.",
          "Meminta output per adegan (narasi, teks layar, visual) agar langsung bisa dipakai.",
        ],
        tips: PLATFORMS.vids.guide.slice(0, 4),
      };
    },

    image(raw, a) {
      const subject = ans(a, "subject"), setting = ans(a, "setting"), comp = ans(a, "composition"), light = ans(a, "time_light");
      const style = ans(a, "style"), color = ans(a, "color"), lens = ans(a, "lens"), mood = ans(a, "mood");
      const fmt = ans(a, "format_image"), purpose = ans(a, "purpose"), neg = ans(a, "negative");
      const aspect = (fmt.match(/\d+:\d+/) || ["1:1"])[0];
      const isPhoto = !/ilustrasi|illustration|3d|anime|kartun|cartoon|lukisan|painting|bukan gaya foto/i.test(style + lens);
      const prompt = join([
        sentence(join([comp || "Medium shot", "of", subject || raw, setting ? "in " + setting : ""])),
        subject ? sentence("Concept: " + raw) : "",
        sentence("Lighting: " + (light || "soft, directional natural light with gentle shadows")),
        sentence("Color palette: " + (color || "harmonious, natural, slightly cinematic")),
        sentence("Style: " + (style || (isPhoto ? "photorealistic editorial photograph" : "polished digital illustration")) + (mood ? ", mood: " + mood : "")),
        isPhoto ? sentence("Camera: " + (lens || "85mm lens, f/2.0, shallow depth of field, sharp focus on subject")) : "",
        purpose ? sentence("Purpose: " + purpose) : "",
        "Highly detailed, 8k, coherent anatomy, aspect ratio " + aspect + ".",
      ]);
      const negative = join([neg, "text, watermark, logo, blurry, low quality, deformed hands, extra fingers, duplicate subject, oversaturated"], ", ");
      return {
        prompt, negative,
        settings: { aspect, mode: "Text-to-Image" },
        variants: [
          { label: "Lebih artistik", prompt: prompt.replace(/Style:[^.]*\./, "Style: painterly editorial illustration, visible brush texture, bold shapes, limited palette.") },
          { label: "Lebih komersial / bersih", prompt: prompt.replace(/Lighting:[^.]*\./, "Lighting: clean three-point studio lighting, softbox key, seamless backdrop.") },
        ],
        changes: [
          "Menyusun subjek, latar, komposisi, cahaya, warna, gaya, dan kamera secara eksplisit.",
          "Menambahkan istilah fotografi/ilustrasi nyata untuk hasil lebih tajam.",
          "Menetapkan aspect ratio.",
          "Memindahkan larangan ke negative prompt.",
        ],
        tips: PLATFORMS.image.guide.slice(0, 4),
      };
    },

    gemini(raw, a) {
      const goal = ans(a, "goal"), ctx = ans(a, "context"), aud = ans(a, "audience"), fmt = ans(a, "format");
      const cons = ans(a, "constraints"), role = ans(a, "role"), tone = ans(a, "tone"), len = ans(a, "length");
      const ex = ans(a, "examples"), succ = ans(a, "success"), lang = ans(a, "language") || "Bahasa Indonesia";
      const prompt = [
        `# PERAN\n${role && !/tidak perlu/i.test(role) ? role : "Kamu adalah pakar senior di bidang yang relevan dengan tugas ini, teliti, jujur, dan praktis."}`,
        `# KONTEKS\n${ctx || "(Isi konteks: situasi, data, apa yang sudah dicoba.)"}${aud ? `\nAudiens hasil: ${aud}.` : ""}`,
        `# TUGAS\n${raw}${goal ? `\nTujuan akhir: ${goal}.` : ""}`,
        `# ATURAN\n- ${cons || "Jangan mengarang fakta; tandai bagian yang tidak pasti."}\n- Jika ada informasi penting yang kurang, ajukan maksimal 3 pertanyaan klarifikasi sebelum menjawab.\n- Bahasa output: ${lang}.${tone ? `\n- Nada: ${tone}.` : ""}${len ? `\n- Panjang: ${len}.` : ""}`,
        `# FORMAT OUTPUT\n${fmt || "Markdown: heading singkat, poin-poin padat, tanpa basa-basi pembuka/penutup."}`,
        ex && !/tidak ada/i.test(ex) ? `# CONTOH / REFERENSI\n${ex}` : "",
        `# KRITERIA KUALITAS\n${succ || "Langsung bisa dipakai tanpa edit besar; spesifik, bukan generik; setiap klaim bisa ditindaklanjuti."}\nSebelum menjawab, periksa draf-mu terhadap kriteria ini dan perbaiki bila perlu.`,
      ].filter(Boolean).join("\n\n");
      const system = `Kamu adalah ${role && !/tidak perlu/i.test(role) ? role : "asisten pakar yang teliti dan jujur"}. Selalu jawab dalam ${lang}. ${cons || "Jangan mengarang fakta."} Format default: ${fmt || "Markdown ringkas"}.`;
      return {
        prompt,
        negative: "",
        system,
        settings: { mode: "System instruction + user prompt" },
        variants: [
          { label: "Versi ringkas (1 paragraf)", prompt: `${role ? role + ". " : ""}${raw}. ${goal ? "Tujuan: " + goal + ". " : ""}${aud ? "Untuk: " + aud + ". " : ""}Format: ${fmt || "Markdown ringkas"}. ${cons || "Jangan mengarang fakta."} Jawab dalam ${lang}.` },
          { label: "Versi bertahap (chain-of-thought)", prompt: prompt + "\n\n# CARA KERJA\n1) Rangkum pemahamanmu atas tugas dalam 2 kalimat. 2) Susun rencana singkat. 3) Kerjakan. 4) Periksa terhadap kriteria kualitas dan revisi." },
        ],
        changes: [
          "Memberi struktur PERAN → KONTEKS → TUGAS → ATURAN → FORMAT → KRITERIA.",
          "Menambahkan aturan anti-halusinasi dan izin bertanya.",
          "Menetapkan bahasa, nada, panjang, dan format output eksplisit.",
          "Menambahkan kriteria kualitas agar model memeriksa jawabannya sendiri.",
          "Menyediakan System Instruction untuk AI Studio.",
        ],
        tips: PLATFORMS.gemini.guide.slice(0, 4),
      };
    },

    omni(raw, a) {
      const mod = ans(a, "modality"), subject = ans(a, "subject"), ref = ans(a, "references"), style = ans(a, "style");
      const setting = ans(a, "setting"), mood = ans(a, "mood"), fmt = ans(a, "format"), cons = ans(a, "constraints");
      const neg = ans(a, "negative"), lang = ans(a, "language") || "English";
      const prompt = [
        `OUTPUT: ${mod || "(specify modality: video / image / text / audio)"}.`,
        `SUBJECT: ${subject || raw}.`,
        setting ? `SETTING: ${setting}.` : "",
        ref && !/tidak ada/i.test(ref) ? `REFERENCE HANDLING: ${ref}.` : "",
        `STYLE: ${style || "cinematic, coherent, high detail"}${mood ? `; mood: ${mood}` : ""}.`,
        `CONSTRAINTS: ${cons || "stay faithful to the subject; no extra elements"}; text language: ${lang}.`,
        fmt ? `FORMAT: ${fmt}.` : "",
        `AVOID: ${join([neg, "text artifacts, watermark, distortion, inconsistent identity"], ", ")}.`,
        !subject ? `ORIGINAL IDEA: ${raw}` : "",
      ].filter(Boolean).join("\n");
      return {
        prompt, negative: join([neg, "text artifacts, watermark, distortion"], ", "),
        settings: { mode: "Generate" },
        variants: [{ label: "Versi naratif (satu paragraf)", prompt: prompt.replace(/\n/g, " ").replace(/[A-Z ]+:/g, "") }],
        changes: ["Menyatakan modalitas output secara eksplisit.", "Memisahkan subjek, gaya, batasan, dan larangan dalam blok berlabel.", "Menetapkan bahasa untuk elemen teks."],
        tips: PLATFORMS.omni.guide.slice(0, 3),
      };
    },
  };

  return { analyze, generate, questionBudget };
})();
