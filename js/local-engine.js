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
    if (opts.image) res.note += " Gambar referensi hanya dibaca oleh engine AI; engine lokal mengabaikannya.";
    return res;
  }

  const join = (parts, sep = " ") => parts.filter((s) => s && String(s).trim()).map((s) => String(s).trim()).join(sep);
  const sentence = (s) => (s ? s.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").replace(/[.\s]+$/, "") + "." : "");

  // ------------------- CERITA (cerpen & novel) -------------------
  const KISHO = [
    ["Ki (pengenalan)", "Kenalkan tokoh dan dunianya lewat momen keseharian yang spesifik."],
    ["Shō (pengembangan)", "Perdalam situasi dan hubungan; biarkan pembaca merasa nyaman."],
    ["Ten (putaran)", "Hadirkan unsur tak terduga yang mengubah cara kita melihat semuanya."],
    ["Ketsu (penyatuan)", "Satukan semuanya; akhiri dengan makna baru yang terasa tenang namun dalam."],
  ];
  const SHORT_BEATS = [
    ["Pembuka", "Mulai dari momen yang sudah bergerak; kenalkan tokoh lewat tindakan dalam 1-2 paragraf pertama."],
    ["Pemicu", "Kejadian yang mengganggu keseimbangan dan memaksa tokoh bertindak."],
    ["Komplikasi", "Usaha tokoh gagal atau memperburuk keadaan; taruhan naik."],
    ["Titik balik", "Tokoh menemukan atau memutuskan sesuatu yang mengubah arah cerita."],
    ["Klimaks", "Konfrontasi dengan konflik utama; tokoh membuat pilihan sulit."],
    ["Resolusi", "Konsekuensi pilihan itu dan gambar terakhir yang membekas."],
  ];
  function novelBeat(i, n) {
    const f = n <= 1 ? 0 : i / (n - 1);
    if (i === 0) return ["Pembuka", "Perkenalkan tokoh utama dalam keseharian yang sudah retak; tanam keinginan dan kelemahannya."];
    if (i === n - 1) return ["Resolusi", "Tunjukkan dunia setelah konflik; perlihatkan perubahan tokoh; tutup tema dengan gambar yang membekas."];
    if (f <= 0.12) return ["Insiden pemicu", "Kejadian yang mengguncang keseimbangan dan memaksa tokoh memilih."];
    if (f <= 0.25) return ["Titik tanpa kembali", "Tokoh ragu lalu berkomitmen; akhir babak satu mengunci arah cerita."];
    if (f < 0.45) return ["Rintangan & sekutu", "Tokoh mencoba dengan cara lama; munculkan subplot, sekutu, dan lawan; taruhan naik."];
    if (f <= 0.55) return ["Titik tengah", "Pengungkapan atau kemenangan semu yang mengubah pemahaman tokoh tentang konflik."];
    if (f < 0.72) return ["Tekanan meningkat", "Antagonis membalas; kelemahan tokoh mulai merugikan; hubungan retak."];
    if (f <= 0.8) return ["Titik terendah", "Tokoh kehilangan sesuatu yang penting; semua tampak gagal."];
    if (f < 0.93) return ["Menuju klimaks", "Tokoh menemukan kekuatan dari kelemahannya dan menyusun langkah terakhir."];
    return ["Klimaks", "Konfrontasi utama; tokoh membuat pilihan yang membuktikan perubahannya."];
  }
  function chapterCount(len) {
    if (/web novel|serial/i.test(len)) return 10;
    const m = len.match(/(\d+)\s*(?:-\s*(\d+))?\s*(bab|chapters?)/i);
    if (m) return Math.min(30, Math.max(3, Math.round(m[2] ? (+m[1] + +m[2]) / 2 : +m[1])));
    return 20;
  }
  function chapterWords(len, n) {
    if (/web novel|serial/i.test(len)) return "1.500-2.500 kata";
    const m = len.match(/(\d+)\s*(?:-\s*(\d+))?\s*(ribu|rb|k)/i);
    if (m) {
      const total = (m[2] ? (+m[1] + +m[2]) / 2 : +m[1]) * 1000;
      const w = Math.round(total / n / 100) * 100;
      return `sekitar ${w.toLocaleString("id-ID")} kata`;
    }
    const k = len.match(/(\d[\d.]*)\s*kata/i);
    return k ? `sekitar ${k[1]} kata` : "2.000-3.000 kata";
  }

  function story(raw, a, opts, isNovel) {
    const v = (id, d = "") => ans(a, id) || d;
    const genre = v("genre"), premise = v("premise"), hero = v("protagonist"), cast = v("cast");
    const setting = v("setting_story"), pov = v("pov", "orang ketiga terbatas, masa lalu");
    const tone = v("tone_story"), aud = v("audience_story", "pembaca dewasa umum");
    const style = v("style_story", "prosa lugas dan sinematik, detail indrawi yang spesifik, dialog dengan subteks");
    const theme = v("theme"), ending = v("ending"), avoid = v("avoid_story");
    const lang = v("language_story", "Bahasa Indonesia yang luwes");
    const structure = v("structure");
    const len = isNovel ? v("length_novel", "novel sekitar 60 ribu kata, 20 bab") : v("length_short", "cerpen 1.500-3.000 kata");
    const mode = opts.mode || "";

    const bible = [
      `GENRE: ${genre || "tentukan dari ide cerita"}`,
      `PREMIS: ${premise || raw}`,
      `TOKOH UTAMA: ${hero || "rancang satu tokoh utama yang spesifik: nama, usia, pekerjaan, keinginan terbesar, ketakutan, kelemahan, dan cara bicara yang khas"}`,
      isNovel ? `PEMERAN LAIN: ${cast || "rancang antagonis dengan motif yang masuk akal dan 2-3 tokoh pendukung yang masing-masing punya keinginan sendiri"}` : "",
      `LATAR: ${setting || "pilih latar yang spesifik dan bisa dirasakan: nama tempat, waktu, cuaca, bau, dan suara"}`,
      `SUDUT PANDANG: ${pov}`,
      `NADA: ${tone || "selaras dengan genre"}`,
      theme ? `TEMA: ${theme}` : "",
      ending ? `AKHIR: ${ending}` : "",
      `GAYA: ${style}`,
    ].filter(Boolean).join("\n");

    const rules = [
      `- Panjang: ${len}.`,
      `- Pembaca: ${aud}.`,
      `- Bahasa: ${lang}.`,
      "- Show, don't tell: tunjukkan emosi lewat aksi, gestur, dan detail indrawi.",
      "- Dialog terasa natural, punya subteks, dan membedakan suara tiap tokoh.",
      "- Setiap adegan harus mengubah sesuatu: informasi, hubungan, atau taruhan.",
      "- Hindari klise khas AI: pembuka dengan cuaca, frasa 'tanpa ia sadari', ceramah moral di akhir, dan penyelesaian kebetulan (deus ex machina).",
      avoid && !/tidak ada/i.test(avoid) ? `- Batasan konten: ${avoid}.` : "",
    ].filter(Boolean).join("\n");

    const role = `Kamu adalah ${isNovel ? "novelis" : "penulis cerita pendek"} berpengalaman${genre ? " di genre " + genre : ""}, dengan prosa yang hidup, spesifik, dan bebas klise.`;

    if (!isNovel) {
      const beats = /kish/i.test(structure) ? KISHO : SHORT_BEATS;
      const beatText = beats.map(([t, d], i) => `${i + 1}. ${t}: ${d}`).join("\n");
      const out = /kerangka/i.test(mode)
        ? "Pertama, tulis kerangka beat (5-7 poin) dan profil singkat tokoh. Berhenti dan tunggu persetujuan saya sebelum menulis cerita."
        : /pembuka/i.test(mode)
          ? "Tulis 3 versi paragraf pembuka dengan pendekatan berbeda (aksi, suasana, dialog), masing-masing maksimal 150 kata dan diberi label."
          : "Tulis judul, lalu cerita lengkap. Jangan tambahkan komentar pembuka atau penutup.";
      const prompt = `# PERAN\n${role}\n\n# IDE CERITA\n${raw}\n\n# STORY BIBLE\n${bible}\n\n# STRUKTUR\n${beatText}\n\n# ATURAN MENULIS\n${rules}\n\n# OUTPUT\n${out}`;
      return {
        prompt,
        storyBible: bible,
        outline: beats.map(([t, d], i) => ({ n: i + 1, title: t, summary: d })),
        system: `${role}\n\nSTORY BIBLE:\n${bible}\n\nATURAN MENULIS:\n${rules}`,
        settings: { mode: mode || "Tulis cerpen utuh", panjang: len, temperature: "0.9-1.0" },
        variants: [
          { label: "Kerangka dulu, baru tulis", prompt: prompt.replace(/# OUTPUT\n[\s\S]*$/, "# OUTPUT\nPertama, tulis kerangka beat dan profil tokoh. Berhenti dan tunggu persetujuan saya.") },
          { label: "Tiga versi pembuka", prompt: prompt.replace(/# OUTPUT\n[\s\S]*$/, "# OUTPUT\nTulis 3 versi paragraf pembuka berbeda (aksi, suasana, dialog), maksimal 150 kata masing-masing.") },
        ],
        changes: [
          "Menambahkan peran penulis yang sesuai genre.",
          "Menyusun story bible: premis, tokoh, latar, sudut pandang, nada, gaya.",
          "Memberi struktur beat agar alur tidak kehilangan arah.",
          "Menambahkan aturan menulis anti-klise dan 'show, don't tell'.",
          "Menetapkan panjang, pembaca, dan bahasa naskah.",
        ],
        tips: PLATFORMS.cerpen.guide.slice(0, 4),
      };
    }

    const n = chapterCount(len);
    const words = chapterWords(len, n);
    const outline = Array.from({ length: n }, (_, i) => {
      const [t, d] = novelBeat(i, n);
      return {
        n: i + 1, title: t, summary: d,
        prompt: `Tulis Bab ${i + 1} (${t}) dari novel ini. Tujuan bab: ${d} Ikuti STORY BIBLE dan ATURAN MENULIS di instruksi sistem. Panjang bab: ${words}. Buka dengan kalimat yang langsung menarik dan akhiri dengan kait yang membuat pembaca ingin lanjut.${i > 0 ? " Ringkasan bab sebelumnya: (tempel 3-5 kalimat ringkasan bab sebelumnya di sini)." : ""}`,
      };
    });
    const steps = /tulis bab/i.test(mode)
      ? "Tulis bab yang saya sebutkan berikut ini berdasarkan story bible dan kerangka. Jaga konsistensi nama, fakta, dan suara tokoh."
      : /lanjutkan|revisi/i.test(mode)
        ? "Saya akan menempelkan naskah saya. Baca dulu, rangkum gaya, tokoh, dan konsistensinya dalam 5 poin, lalu lanjutkan atau revisi sesuai permintaan saya tanpa mengubah suara penulis."
        : `1. Perluas story bible: profil lengkap tiap tokoh (keinginan, ketakutan, rahasia, cara bicara), aturan dunia, dan garis waktu.\n2. Susun kerangka ${n} bab: judul, ringkasan 3 kalimat, fungsi bab dalam busur cerita, dan kait di akhir bab.\n3. Berhenti dan tunggu persetujuan saya. Setelah itu tulis satu bab per permintaan.`;
    const prompt = `# PERAN\n${role}\n\n# IDE NOVEL\n${raw}\n\n# STORY BIBLE\n${bible}\n\n# STRUKTUR\n${structure || "Tiga babak klasik"}, ${n} bab, ${words} per bab.\n\n# ATURAN MENULIS\n${rules}\n- Jaga konsistensi nama, usia, fakta, dan garis waktu di seluruh bab.\n\n# LANGKAH KERJA\n${steps}`;
    return {
      prompt,
      storyBible: bible,
      outline,
      system: `${role}\n\nSTORY BIBLE:\n${bible}\n\nATURAN MENULIS:\n${rules}\n- Jaga konsistensi nama, usia, fakta, dan garis waktu di seluruh bab.`,
      settings: { mode: mode || "Story bible + kerangka bab", panjang: len, bab: n, "per bab": words, temperature: "0.9-1.0" },
      variants: [
        { label: "Prompt ringkas", prompt: `${role} Bantu saya menulis novel: ${raw}. ${genre ? "Genre " + genre + ". " : ""}${n} bab, ${words} per bab. Mulai dengan story bible dan kerangka bab, lalu tunggu persetujuan saya.` },
      ],
      changes: [
        "Mengubah ide menjadi sesi kerja novel bertahap: story bible, kerangka, lalu bab demi bab.",
        `Menyusun kerangka ${n} bab berdasarkan struktur tiga babak.`,
        "Menyediakan prompt siap tempel untuk setiap bab.",
        "Menambahkan aturan konsistensi dan anti-klise.",
        "Menyediakan System Instruction untuk AI Studio agar konsisten sepanjang sesi.",
      ],
      tips: PLATFORMS.novel.guide.slice(3, 8),
    };
  }

  const GEN = {
    veo(raw, a, opts) {
      const subject = ans(a, "subject"), action = ans(a, "action"), setting = ans(a, "setting");
      const light = ans(a, "time_light"), camera = ans(a, "camera"), style = ans(a, "style");
      const audio = ans(a, "audio"), mood = ans(a, "mood"), fmt = ans(a, "format_video"), neg = ans(a, "negative");
      const aspect = /9:16|vertikal|vertical|reels|tiktok|shorts/i.test(fmt) ? "9:16" : "16:9";

      // Durasi: <= 8 detik satu aksi; 10-15 detik (Omni Flash) memakai timeline bertanda waktu
      const dur = Math.max(3, Math.min(15, +opts.duration || 8));
      const long = dur >= 10;
      const cut1 = Math.round(dur / 3), cut2 = Math.round((dur * 2) / 3);
      const timeline = long
        ? sentence(`Timeline: [0-${cut1}s] ${subject ? "the subject is introduced in the environment" : "the scene is established"}; [${cut1}-${cut2}s] ${action ? "the subject " + action : "the main action unfolds"}; [${cut2}-${dur}s] a clear payoff, a reaction or the result of the action, as the camera settles`)
        : "";
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
        timeline,
        sentence("Audio: " + (audio || "natural ambient sound matching the scene, subtle sound effects, no music")),
        "Aspect ratio " + aspect + ", " + dur + " seconds" + (long ? ", one continuous take with a clear beginning, middle and end" : "") + ", smooth realistic motion, consistent character and lighting throughout.",
      ], " ");

      const negative = join([neg, "subtitles, captions, on-screen text, watermark, logo, distorted faces, extra limbs, flickering, morphing, jittery camera"], ", ");

      // Sequence: N klip berurutan dengan character bible identik di setiap klip
      const clips = Math.max(1, Math.min(5, +opts.clips || 1));
      const characterBible = clips > 1
        ? `Recurring subject (keep IDENTICAL in every clip): ${subject || raw}. Same wardrobe, colors, proportions and face in every shot.${setting ? " Location: " + setting + "." : ""}`
        : "";
      const SHOTS = [
        ["Establishing", "Wide establishing shot, slow drone-like push-in,", "the subject is introduced in the environment"],
        ["Main action", camera || "Cinematic medium shot, slow push-in,", action || "the main action begins"],
        ["Detail / reaction", "Extreme close-up, static camera, shallow focus,", "a telling detail and the subject's reaction"],
        ["Turn", "Smooth tracking shot following the subject,", "the situation changes or escalates"],
        ["Closing", "Slow pull-back to a wide shot,", "the moment resolves and the scene settles"],
      ];
      const order = clips === 1 ? [0, 1, 2] : clips === 2 ? [0, 1] : clips === 3 ? [0, 1, 2] : clips === 4 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4];
      const base = timeline ? prompt.replace(" " + timeline, "") : prompt;
      const shotList = order.map((k, i) => {
        const [title, shot, beat] = SHOTS[k];
        const p = clips > 1
          ? join([shot.replace(/,$/, "") + ":", beat + ".", characterBible, base.replace(/^.*?\bof\b[^.]*\./, "").trim(), i > 0 ? "Audio continues naturally from the previous clip." : ""])
          : base.replace(/^.*?\bof\b/, shot.replace(/,$/, "") + " of");
        return { n: i + 1, title, prompt: p };
      });

      return {
        prompt,
        negative,
        settings: { aspect, duration: dur + "s", model: long ? "Gemini Omni Flash 1.2 (Flow)" : "Omni Flash 1.2 atau Veo 3.1 Lite", mode: opts.mode || "Text-to-Video", clips: clips > 1 ? clips + " klip" : "" },
        characterBible,
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
          duration_seconds: dur,
          ...(long ? { timeline } : {}),
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
          long ? `Menetapkan durasi ${dur} detik dengan timeline bertanda waktu, agar klip panjang punya awal, tengah, dan akhir yang jelas.` : `Menetapkan aspect ratio dan durasi ${dur} detik.`,
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

    cerpen(raw, a, opts) { return story(raw, a, opts, false); },
    novel(raw, a, opts) { return story(raw, a, opts, true); },

    assistant(raw, a, opts) {
      const v = (id, d = "") => ans(a, id) || d;
      const purpose = v("purpose", raw), role = v("role"), scope = v("scope"), know = v("knowledge"), flow = v("workflow");
      const tone = v("tone", "ramah, jelas, dan profesional");
      const fmt = v("format", "jawaban singkat (maksimal 5 kalimat) kecuali pengguna meminta detail; gunakan poin bila ada langkah");
      const edge = v("edge"), ex = v("examples"), lang = v("language", "Bahasa Indonesia");
      const identity = role && !/tidak perlu/i.test(role) ? `Kamu adalah ${role}.` : "Kamu adalah asisten khusus yang membantu sesuai tujuan di bawah.";
      const prompt = [
        `# IDENTITAS\n${identity}`,
        `# TUJUAN\n${purpose}${purpose !== raw ? "\nKebutuhan pemilik: " + raw : ""}`,
        `# RUANG LINGKUP\n- Fokus pada tujuan di atas.\n- ${scope || "Jika diminta hal di luar tujuan, tolak dengan sopan dan arahkan kembali."}\n- Jangan mengarang fakta, harga, kebijakan, atau janji yang tidak ada di sumber pengetahuan.`,
        `# PENGETAHUAN & SUMBER\n${know || "Gunakan informasi dari pemilik di bawah ini atau di file terlampir sebagai sumber utama."}\n<pengetahuan>\n(tempel FAQ, katalog, harga, atau kebijakan di sini)\n</pengetahuan>`,
        `# ALUR PERCAKAPAN\n${flow || "1. Sapa singkat. 2. Tanyakan kebutuhan bila belum jelas (maksimal 2 pertanyaan). 3. Jawab atau beri rekomendasi. 4. Tawarkan langkah berikutnya."}`,
        `# GAYA & FORMAT\n- Nada: ${tone}.\n- Format: ${fmt}.\n- Bahasa: ${lang}; ikuti bahasa pengguna bila berbeda.`,
        `# KASUS KHUSUS\n- Tidak tahu jawabannya: ${edge || "katakan jujur, jangan menebak, dan arahkan ke kontak manusia."}\n- Pertanyaan di luar topik: tolak dengan sopan dan kembalikan ke topik.\n- Pengguna marah atau komplain: akui perasaannya, rangkum masalahnya, tawarkan solusi atau eskalasi.\n- Permintaan berbahaya atau melanggar kebijakan: tolak dengan sopan.`,
        `# CONTOH\n${ex && !/tidak ada/i.test(ex) ? ex : "Pengguna: Halo, bisa bantu?\nAsisten: Halo! Tentu. Boleh ceritakan apa yang kamu butuhkan?"}`,
      ].join("\n\n");
      return {
        prompt,
        settings: { mode: opts.mode || "Gemini Gem" },
        variants: [
          { label: "Versi ringkas", prompt: `${identity} Tujuan: ${purpose}. ${scope ? "Batasan: " + scope + ". " : ""}Nada ${tone}. Format: ${fmt}. Jangan mengarang informasi; jika tidak tahu, katakan jujur dan arahkan ke manusia. Jawab dalam ${lang}.` },
          { label: "Pesan pembuka asisten", prompt: "Halo! 👋 Saya siap membantu. Boleh ceritakan apa yang sedang kamu butuhkan?" },
        ],
        changes: [
          "Menyusun instruksi sebagai 'job description': identitas, tujuan, lingkup, sumber, alur, gaya, kasus khusus.",
          "Menambahkan aturan anti-mengarang dan perilaku saat tidak tahu.",
          "Menyiapkan tempat untuk data pengetahuan (FAQ, katalog, kebijakan).",
          "Menambahkan contoh percakapan untuk mengunci gaya.",
        ],
        tips: PLATFORMS.assistant.guide.slice(0, 4),
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
