/* ============================================================
   presets.js — Preset gaya sekali klik per platform
   Setiap preset mengisi dimensi (id = id dimensi di platforms.js)
   yang BELUM dijawab pengguna. Jawaban pengguna selalu menang.
   ============================================================ */
window.PI_PRESETS = {
  veo: [
    { id: "ad", label: "💎 Iklan produk premium", fields: {
      camera: "Slow orbiting macro shot, 100mm lens, ultra-smooth motion control",
      time_light: "dramatic studio lighting, single soft key light, glossy reflections, pure black backdrop",
      style: "high-end commercial look, ultra crisp, luxurious, rich contrast",
      audio: "minimal elegant electronic pulse, subtle whoosh and shimmer sound effects",
      mood: "luxurious, confident" } },
    { id: "vlog", label: "🎒 Vlog sinematik", fields: {
      camera: "Handheld medium shot, 24mm lens, natural walking movement",
      time_light: "golden hour, warm low sun, soft long shadows",
      style: "cinematic travel-vlog look, warm grade, light film grain",
      audio: "natural ambient sound of the location, light acoustic guitar music",
      mood: "warm, adventurous" } },
    { id: "horror", label: "🕯️ Film horor", fields: {
      camera: "Slow creeping dolly-in from a low angle",
      time_light: "dim low-key lighting, cold moonlight through a window, deep shadows",
      style: "cinematic horror look, desaturated, heavy film grain",
      audio: "eerie low drone, distant creaks, faint breathing, no music",
      mood: "dread, suspense" } },
    { id: "anime", label: "🌸 Anime lukis tangan", fields: {
      camera: "Gentle slow pan with subtle parallax",
      time_light: "soft afternoon light, gentle bloom, floating dust particles",
      style: "hand-painted 2D anime style, soft watercolor backgrounds, clean line art",
      audio: "soft piano melody, gentle wind and birdsong",
      mood: "nostalgic, peaceful" } },
    { id: "nature", label: "🦅 Dokumenter alam", fields: {
      camera: "Telephoto long-lens tracking shot, 400mm, stabilized",
      time_light: "natural early-morning light with drifting mist",
      style: "nature documentary look, ultra sharp, true-to-life colors",
      audio: "rich natural ambience, no music, no narration",
      mood: "awe, calm" } },
    { id: "ugc", label: "📱 UGC / konten TikTok", fields: {
      camera: "Selfie-style handheld close-up, front-camera framing",
      time_light: "natural indoor window light",
      style: "authentic smartphone UGC look, natural and unpolished",
      audio: "the person speaks directly to camera with natural room tone",
      format_video: "9:16",
      mood: "casual, energetic" } },
  ],
  image: [
    { id: "ecom", label: "🛍️ Foto produk e-commerce", fields: {
      composition: "Centered hero product shot, three-quarter angle",
      time_light: "clean three-point studio lighting, large softbox key, soft shadow",
      style: "professional e-commerce product photography",
      color: "neutral seamless light-grey backdrop, accurate product colors",
      lens: "100mm macro lens, f/8, everything sharp",
      purpose: "e-commerce product photo, accurate colors, clean backdrop" } },
    { id: "portrait", label: "📸 Potret editorial", fields: {
      composition: "Medium close-up, rule of thirds",
      time_light: "soft window light from the side, gentle falloff",
      style: "editorial magazine portrait, natural skin texture",
      lens: "85mm portrait lens, f/1.8, creamy bokeh",
      color: "muted warm tones, film-like color" } },
    { id: "poster", label: "🎞️ Poster film", fields: {
      composition: "Bold vertical poster composition, subject large, clear space at top for title",
      time_light: "dramatic rim light, volumetric haze",
      style: "cinematic movie poster key art, high contrast",
      color: "teal-and-orange cinematic palette",
      format_image: "3:4" } },
    { id: "flat", label: "🎨 Ilustrasi flat vector", fields: {
      style: "flat vector illustration, clean geometric shapes, no gradients, thick consistent outlines",
      color: "limited palette of 5 harmonious colors",
      lens: "not photographic (illustration / 3D render)",
      composition: "Centered composition with generous negative space" } },
    { id: "3d", label: "🧸 Karakter 3D lucu", fields: {
      style: "cute stylized 3D character render, soft clay-like materials, rounded shapes",
      time_light: "soft global illumination, gentle rim light",
      color: "soft pastel palette",
      lens: "not photographic (illustration / 3D render)",
      composition: "Full-body shot on a simple pastel background" } },
    { id: "ingredient", label: "🧬 Ingredient karakter Flow", fields: {
      composition: "Full-body front view, neutral standing pose, character centered",
      time_light: "even, flat, shadowless studio light",
      style: "clean character reference sheet, consistent features",
      color: "plain light-grey background",
      purpose: "character reference sheet for Flow ingredients: neutral pose, full body, plain background, consistent features" } },
  ],
  vids: [
    { id: "update", label: "📊 Update tim internal", fields: {
      audience: "tim internal, ditonton saat meeting mingguan",
      duration: "60-90 detik, 5 adegan",
      tone: "profesional, ringkas, positif",
      voice: "Voiceover AI, Bahasa Indonesia, tenang dan jelas",
      cta: "tanyakan di kanal tim jika ada pertanyaan" } },
    { id: "tutorial", label: "🧭 Tutorial produk", fields: {
      audience: "pengguna baru yang belum pernah memakai produk",
      duration: "1-2 menit, 6-8 adegan, satu langkah per adegan",
      tone: "edukatif, sabar, jelas",
      voice: "Voiceover AI, Bahasa Indonesia",
      cta: "coba langkah-langkahnya sekarang" } },
    { id: "promo", label: "🚀 Promosi sosial media", fields: {
      audience: "publik di Instagram / TikTok",
      duration: "30-45 detik, 4 adegan, hook kuat di 3 detik pertama",
      tone: "energik, cepat, kalimat pendek",
      voice: "Voiceover AI, Bahasa Indonesia, antusias",
      format_video: "9:16",
      cta: "kunjungi link di bio" } },
    { id: "training", label: "🎓 Pelatihan / onboarding", fields: {
      audience: "karyawan baru",
      duration: "3-5 menit, 8-10 adegan",
      tone: "hangat, suportif, terstruktur",
      voice: "Voiceover AI, Bahasa Indonesia",
      cta: "selesaikan checklist minggu pertama" } },
  ],
  gemini: [
    { id: "critic", label: "🧐 Analis kritis", fields: {
      role: "konsultan senior yang kritis, jujur, dan berbasis data",
      format: "Ringkasan 3 kalimat, lalu tabel: temuan, bukti, risiko, rekomendasi",
      constraints: "Jangan mengarang fakta; tandai asumsi; sebutkan sisi lemah argumen",
      tone: "lugas dan profesional" } },
    { id: "copy", label: "✍️ Copywriter persuasif", fields: {
      role: "copywriter direct-response berpengalaman 10 tahun",
      format: "3 variasi copy, masing-masing: headline, body, CTA",
      tone: "persuasif, hangat, konkret",
      length: "maksimal 80 kata per variasi" } },
    { id: "teacher", label: "👩‍🏫 Guru yang sabar", fields: {
      role: "guru yang sabar dan pandai memakai analogi sehari-hari",
      audience: "pemula tanpa latar belakang teknis",
      format: "Penjelasan bertahap dengan contoh, lalu 3 soal latihan beserta kunci",
      tone: "ramah dan menyemangati" } },
    { id: "json", label: "🧩 Output JSON (developer)", fields: {
      format: "JSON valid saja, tanpa teks lain; sertakan skema field yang jelas",
      constraints: "Jangan tambahkan komentar atau markdown; gunakan null jika data tidak ada",
      tone: "netral" } },
  ],
  omni: [
    { id: "social", label: "📣 Paket konten sosmed", fields: {
      modality: "an image plus accompanying text",
      style: "scroll-stopping, bold, clean social media aesthetic",
      format: "1 gambar 4:5 + caption maks 50 kata + 5 hashtag",
      language: "Bahasa Indonesia" } },
    { id: "edit", label: "🪄 Edit gambar referensi", fields: {
      modality: "a single image",
      references: "keep the character's identity, face and hair exactly as in the reference",
      constraints: "change only what is requested; keep lighting direction consistent" } },
  ],
};
