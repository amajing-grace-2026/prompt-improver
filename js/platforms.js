/* ============================================================
   platforms.js — Knowledge base per target platform
   Setiap platform punya:
   - dims      : dimensi informasi yang membuat prompt "lengkap"
   - guide     : aturan best-practice (dipakai engine AI & panel tips)
   - examples  : contoh prompt cepat
   - settings  : opsi teknis (aspect ratio, durasi, dsb.)
   ============================================================ */

window.PI_PLATFORMS = (() => {
  // Helper: regex gabungan (case-insensitive), dukung ID + EN
  const rx = (...words) => new RegExp("\\b(" + words.join("|") + ")\\b", "i");

  // -----------------------------------------------------------
  // Kamus kata kunci bersama
  // -----------------------------------------------------------
  const K = {
    camera: rx(
      "close[- ]?up", "extreme close[- ]?up", "wide shot", "wide angle", "medium shot", "full shot",
      "establishing shot", "over[- ]the[- ]shoulder", "pov", "point of view", "first[- ]person",
      "aerial", "drone", "bird'?s[- ]eye", "top[- ]down", "low angle", "high angle", "dutch angle",
      "tracking shot", "dolly", "dolly zoom", "pan(ning)?", "tilt(ing)?", "crane", "steadicam", "handheld",
      "zoom (in|out)", "push in", "pull out", "orbit", "rack focus", "slow[- ]motion", "slow[- ]mo", "timelapse",
      "time[- ]lapse", "hyperlapse", "\\d{2,3}\\s?mm", "lens", "anamorphic", "macro", "fisheye", "telephoto",
      "shallow depth of field", "bokeh", "depth of field", "dof",
      "kamera", "sudut rendah", "sudut tinggi", "dari atas", "dari udara", "gerak lambat", "zoom", "lensa"
    ),
    lighting: rx(
      "golden hour", "blue hour", "sunset", "sunrise", "dawn", "dusk", "midday", "noon", "night", "midnight",
      "moonlight", "candlelight", "neon", "backlit", "backlight", "rim light", "soft light", "hard light",
      "diffused", "overcast", "dramatic lighting", "chiaroscuro", "volumetric", "god rays", "studio lighting",
      "three[- ]point", "natural light", "ambient light", "low[- ]key", "high[- ]key", "silhouette", "lantern",
      "fluorescent", "spotlight", "cinematic lighting", "foggy", "misty", "rainy", "stormy", "snowy",
      "pagi", "siang", "sore", "malam", "senja", "fajar", "cahaya", "pencahayaan", "lampu", "redup", "terang", "hujan", "berkabut"
    ),
    style: rx(
      "cinematic", "photorealistic", "photo[- ]?realistic", "hyper[- ]?realistic", "realistic", "anime", "manga",
      "pixar", "disney", "3d render", "3d animation", "cgi", "claymation", "stop[- ]motion", "watercolor", "oil painting",
      "sketch", "line art", "pixel art", "low poly", "cyberpunk", "steampunk", "noir", "film noir", "vintage", "retro",
      "35mm film", "16mm", "super 8", "kodak", "fujifilm", "polaroid", "documentary", "commercial", "editorial",
      "fashion", "surreal", "minimalist", "abstract", "fantasy", "sci[- ]?fi", "horror", "ghibli", "ukiyo-e",
      "vaporwave", "synthwave", "art deco", "baroque", "impressionist", "comic", "cartoon", "illustration",
      "gaya", "sinematik", "realistis", "kartun", "lukisan", "ilustrasi", "animasi"
    ),
    audio: rx(
      "audio", "sound", "sounds", "sfx", "sound effects?", "music", "soundtrack", "score", "ambient", "ambience",
      "dialogue", "dialog", "says", "saying", "speaks", "whisper(s|ing)?", "shout(s|ing)?", "voice[- ]?over", "narration",
      "narrator", "footsteps", "rain sounds", "wind", "birds chirping", "crowd noise", "silence", "silent", "muted",
      "suara", "musik", "berkata", "bicara", "berbicara", "dialog", "narasi", "efek suara", "hening"
    ),
    setting: rx(
      "in a", "in the", "inside", "outside", "at a", "at the", "on a", "on the", "city", "street", "alley", "forest",
      "jungle", "beach", "ocean", "sea", "lake", "river", "mountain", "desert", "village", "town", "rooftop", "office",
      "kitchen", "bedroom", "living room", "studio", "warehouse", "factory", "school", "classroom", "hospital", "cafe",
      "caf[eé]", "restaurant", "market", "temple", "church", "castle", "space", "spaceship", "planet", "underwater",
      "park", "garden", "field", "road", "highway", "station", "airport", "bridge", "tokyo", "paris", "new york", "jakarta", "bali",
      "di dalam", "di luar", "di sebuah", "di atas", "kota", "jalan", "hutan", "pantai", "laut", "gunung", "desa",
      "kantor", "dapur", "kamar", "pasar", "sekolah", "kafe", "warung", "sawah", "taman"
    ),
    action: rx(
      "\\w+ing", "walks?", "runs?", "jumps?", "dances?", "sits?", "stands?", "looks?", "turns?", "opens?", "closes?",
      "holds?", "drinks?", "eats?", "drives?", "flies?", "swims?", "fights?", "laughs?", "cries?", "smiles?", "talks?",
      "me[nmgy]\\w{3,}", "ber\\w{3,}",
      "sedang", "berjalan", "berlari", "melompat", "menari", "duduk", "berdiri", "menatap", "melihat", "membuka",
      "memegang", "minum", "makan", "mengemudi", "terbang", "berenang", "tertawa", "menangis", "tersenyum", "bicara",
      "berbicara", "bermain", "bekerja", "memasak", "menulis", "membaca"
    ),
    mood: rx(
      "mood", "tone", "atmosphere", "vibe", "feel(ing)?", "happy", "joyful", "cheerful", "sad", "melancholic", "tense",
      "suspenseful", "eerie", "creepy", "calm", "peaceful", "serene", "epic", "dramatic", "romantic", "nostalgic",
      "mysterious", "playful", "energetic", "cozy", "warm", "cold", "lonely", "hopeful", "dark", "gritty", "whimsical",
      "suasana", "nuansa", "ceria", "sedih", "tegang", "tenang", "damai", "epik", "dramatis", "romantis", "misterius", "hangat", "gelap"
    ),
    aspect: rx("16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "4:5", "vertical", "portrait", "landscape", "horizontal", "square", "vertikal", "horizontal", "persegi"),
    duration: rx("\\d+\\s?(s|sec|secs|second|seconds|detik)", "\\d+\\s?(min|minute|minutes|menit)"),
    negative: rx("no ", "without", "avoid", "don'?t", "never", "tanpa", "jangan", "hindari", "bukan"),
    color: rx(
      "color palette", "colou?rs?", "palette", "monochrome", "black and white", "b&w", "sepia", "pastel", "vibrant", "saturated",
      "desaturated", "muted", "teal and orange", "warm tones?", "cool tones?", "neon colou?rs?", "earth tones?",
      "warna", "palet", "hitam putih", "pastel", "cerah", "pudar"
    ),
    composition: rx(
      "composition", "rule of thirds", "centered", "symmetr(y|ical)", "leading lines", "negative space", "framing", "foreground",
      "background", "midground", "headroom", "golden ratio", "close[- ]?up", "wide shot", "medium shot", "full[- ]body", "portrait shot", "headshot",
      "komposisi", "tengah", "simetris", "latar depan", "latar belakang", "seluruh badan"
    ),
    quality: rx("4k", "8k", "hdr", "high detail", "highly detailed", "ultra[- ]detailed", "sharp focus", "high resolution", "detail tinggi", "tajam", "resolusi tinggi"),
    character: rx(
      "man", "woman", "boy", "girl", "child", "kid", "baby", "teenager", "elderly", "old man", "old woman", "person", "people",
      "robot", "android", "cat", "dog", "bird", "dragon", "monster", "alien", "knight", "samurai", "astronaut", "chef", "doctor",
      "teacher", "scientist", "warrior", "princess", "detective", "wearing", "dressed", "hair", "eyes", "skin", "years? old",
      "pria", "wanita", "laki", "perempuan", "anak", "bayi", "remaja", "kakek", "nenek", "orang", "kucing", "anjing", "naga",
      "robot", "astronot", "koki", "dokter", "guru", "mengenakan", "memakai", "rambut", "mata", "tahun"
    ),
    // text/gemini
    audience: rx("audience", "for (beginners|experts|kids|children|students|developers|managers|executives|customers)", "reader", "target", "pembaca", "audiens", "untuk (pemula|anak|siswa|mahasiswa|developer|manajer|pelanggan|klien)", "umur", "usia"),
    role: rx("you are", "act as", "as a", "pretend", "role", "persona", "expert", "bertindak sebagai", "kamu adalah", "anda adalah", "sebagai (seorang)?", "ahli", "pakar"),
    format: rx("format", "json", "markdown", "table", "bullet", "list", "csv", "yaml", "xml", "html", "outline", "numbered", "steps?", "paragraphs?", "headings?", "tabel", "poin", "daftar", "langkah", "paragraf", "berformat"),
    length: rx("\\d+\\s?(words?|kata|sentences?|kalimat|paragraphs?|paragraf|lines?|baris|pages?|halaman|items?|poin|points?|bullets?)", "short", "brief", "concise", "long", "detailed", "comprehensive", "singkat", "ringkas", "panjang", "lengkap", "mendetail"),
    tone: rx("tone", "formal", "informal", "casual", "friendly", "professional", "funny", "humorous", "witty", "serious", "academic", "persuasive", "empathetic", "nada", "santai", "profesional", "lucu", "serius", "akademis", "persuasif", "ramah"),
    constraints: rx("must", "must not", "should", "do not", "don'?t", "never", "always", "only", "avoid", "limit", "max(imum)?", "min(imum)?", "harus", "jangan", "wajib", "hanya", "hindari", "maksimal", "minimal", "batas"),
    examples: rx("example", "examples", "e\\.g\\.", "for instance", "such as", "like this", "contoh", "misalnya", "seperti"),
    context: rx("context", "background", "because", "since", "currently", "we are", "i am", "my", "our", "konteks", "latar", "karena", "saat ini", "kami", "saya", "aku"),
    goal: rx("goal", "objective", "purpose", "so that", "in order to", "to help", "tujuan", "agar", "supaya", "untuk membantu", "sasaran"),
    language: rx("in (english|indonesian|bahasa|spanish|japanese|french|german|mandarin|chinese|korean|arabic)", "dalam bahasa", "bahasa (indonesia|inggris|jepang|mandarin|korea|arab|spanyol|prancis|jerman)"),
    cta: rx("call to action", "cta", "subscribe", "sign up", "buy", "visit", "learn more", "click", "download", "daftar", "beli", "kunjungi", "pelajari", "klik", "unduh", "ajakan"),
    brand: rx("brand", "logo", "company", "product name", "tagline", "merek", "perusahaan", "produk", "slogan"),
    structure: rx("intro", "introduction", "outline", "sections?", "scenes?", "chapters?", "parts?", "opening", "closing", "ending", "pembuka", "penutup", "bagian", "adegan", "struktur", "poin utama", "key points?"),
  };

  const wc = (s) => (s.trim().match(/\S+/g) || []).length;

  // -----------------------------------------------------------
  // Definisi dimensi (bersama) — bisa dipakai beberapa platform
  // Setiap dim: id, label, weight(1-3), test(prompt)->bool, question, options, placeholder
  // -----------------------------------------------------------
  const D = {
    subject: {
      id: "subject", label: "Subjek utama", weight: 3,
      test: (p) => wc(p) >= 4 || K.character.test(p),
      question: "Siapa atau apa subjek utamanya? Deskripsikan detail fisiknya (usia, pakaian, ciri khas, material).",
      why: "Model generatif bekerja paling baik dengan subjek yang spesifik dan visual, bukan konsep abstrak.",
      options: [
        { label: "Seorang karakter manusia (jelaskan ciri-cirinya)", value: "a single human character with distinct, specific features" },
        { label: "Hewan / makhluk", value: "an animal or creature with specific fur/skin texture and size" },
        { label: "Produk / objek", value: "a hero product/object with precise materials and finish" },
        { label: "Pemandangan tanpa karakter", value: "a landscape/environment with no characters" },
      ],
      placeholder: "cth: wanita 30-an, jas hujan kuning, rambut hitam pendek, membawa payung merah",
    },
    action: {
      id: "action", label: "Aksi / gerakan", weight: 3,
      test: (p) => K.action.test(p),
      question: "Apa yang terjadi atau dilakukan subjek selama klip? (Satu aksi jelas paling efektif untuk 8 detik.)",
      why: "Veo menghasilkan gerakan paling bagus kalau ada satu aksi utama yang jelas dengan awal dan akhir.",
      options: [
        { label: "Berjalan / bergerak menuju kamera", value: "walks slowly toward the camera" },
        { label: "Melakukan aktivitas spesifik (jelaskan)", value: "performs one specific activity" },
        { label: "Diam, hanya ekspresi / gerakan halus", value: "stays mostly still with subtle expressions and micro-movements" },
        { label: "Transformasi / perubahan bertahap", value: "gradually transforms over the course of the shot" },
      ],
      placeholder: "cth: berbalik perlahan ke arah kamera lalu tersenyum tipis",
    },
    setting: {
      id: "setting", label: "Latar / lokasi", weight: 3,
      test: (p) => K.setting.test(p),
      question: "Di mana adegan ini berlangsung? Sebutkan lokasi dan detail lingkungannya.",
      why: "Latar menentukan 50% suasana visual: tekstur, warna, kedalaman, dan elemen latar belakang.",
      options: [
        { label: "Kota modern / jalanan", value: "a modern city street with layered background detail" },
        { label: "Alam (hutan, pantai, gunung)", value: "a natural landscape (forest, beach or mountains) with atmospheric depth" },
        { label: "Interior (rumah, kantor, kafe, studio)", value: "an interior space with tactile textures and practical lights" },
        { label: "Fantasi / sci-fi / dunia imajinatif", value: "an imaginative fantasy / sci-fi world with coherent design language" },
      ],
      placeholder: "cth: gang sempit Tokyo saat hujan, papan neon memantul di aspal basah",
    },
    time_light: {
      id: "time_light", label: "Waktu & pencahayaan", weight: 2,
      test: (p) => K.lighting.test(p),
      question: "Kapan waktunya dan seperti apa pencahayaannya?",
      why: "Pencahayaan adalah pengendali mood paling kuat dan sering diabaikan dalam prompt biasa.",
      options: [
        { label: "Golden hour (hangat, lembut)", value: "golden hour, warm low sun, soft long shadows" },
        { label: "Malam dengan neon / lampu kota", value: "night, neon signs and city lights reflecting on wet surfaces" },
        { label: "Siang terang, cahaya natural", value: "bright midday natural daylight, crisp and clean" },
        { label: "Dramatis, kontras tinggi (low-key)", value: "dramatic low-key lighting, high contrast, deep shadows, single hard key light" },
        { label: "Overcast / mendung, lembut dan merata", value: "overcast sky, soft diffused even light" },
      ],
      placeholder: "cth: blue hour, cahaya dingin dari jendela, rim light hangat dari lampu jalan",
    },
    camera: {
      id: "camera", label: "Kamera & shot", weight: 3,
      test: (p) => K.camera.test(p),
      question: "Jenis shot dan pergerakan kamera apa yang diinginkan?",
      why: "Tanpa instruksi kamera, model memilih sendiri—sering statis dan membosankan. Ini pembeda terbesar prompt amatir vs profesional.",
      options: [
        { label: "Close-up, kamera statis", value: "Close-up, static camera, shallow depth of field" },
        { label: "Wide / establishing shot, slow push-in", value: "Wide establishing shot, slow push-in" },
        { label: "Tracking shot mengikuti subjek", value: "Smooth tracking shot following the subject, 35mm lens" },
        { label: "Drone / aerial", value: "Aerial drone shot, slow forward glide" },
        { label: "Handheld, dokumenter", value: "Handheld documentary-style medium shot, subtle natural shake" },
        { label: "POV (sudut pandang orang pertama)", value: "First-person POV shot" },
      ],
      placeholder: "cth: medium shot, slow dolly-in, lensa 35mm, shallow depth of field",
    },
    style: {
      id: "style", label: "Gaya visual", weight: 2,
      test: (p) => K.style.test(p),
      question: "Gaya visual / estetika apa yang dituju?",
      why: "Kata gaya (cinematic, anime, 35mm film) mengikat seluruh look agar konsisten.",
      options: [
        { label: "Sinematik fotorealistis (film look)", value: "cinematic photorealistic film look, shallow depth of field, subtle film grain" },
        { label: "Iklan komersial bersih dan tajam", value: "polished commercial advertising look, clean, crisp, high production value" },
        { label: "Animasi 3D (Pixar-like)", value: "stylized 3D animation, soft subsurface lighting, expressive character design" },
        { label: "Anime 2D", value: "2D anime style, clean line art, cel shading, painterly backgrounds" },
        { label: "Film analog vintage (35mm, grain)", value: "vintage 35mm analog film look, visible grain, halation, faded colors" },
        { label: "Dokumenter natural", value: "naturalistic documentary look, available light, muted realistic colors" },
      ],
      placeholder: "cth: cinematic, shot on Arri Alexa, teal-orange grading, film grain halus",
    },
    audio: {
      id: "audio", label: "Audio (dialog, SFX, musik)", weight: 2,
      test: (p) => K.audio.test(p) || /["“”].+["“”]/.test(p),
      question: "Audio apa yang harus ada? (Veo 3 membuat audio native: dialog, efek suara, ambience, musik.)",
      why: "Kalau audio tidak dideskripsikan, Veo menebak—hasilnya sering tidak sinkron atau ada musik acak.",
      options: [
        { label: "Tanpa dialog, hanya ambience + SFX natural", value: "no dialogue; natural ambient sound and realistic sound effects matching the action, no music" },
        { label: "Ada dialog pendek (tulis kalimatnya)", value: "a short line of dialogue spoken by the subject (quoted)" },
        { label: "Musik latar (sebutkan genre/mood)", value: "subtle background music matching the mood, plus light ambient sound" },
        { label: "Hening / minimalis", value: "near-silence, only faint room tone" },
      ],
      placeholder: 'cth: suara hujan deras, langkah kaki di genangan; dia berkata: "Kita terlambat."',
    },
    mood: {
      id: "mood", label: "Mood / emosi", weight: 1,
      test: (p) => K.mood.test(p),
      question: "Mood atau emosi apa yang ingin dirasakan penonton?",
      why: "Mood membantu model memilih warna, tempo, dan ekspresi yang konsisten.",
      options: [
        { label: "Tenang & kontemplatif", value: "calm, contemplative" },
        { label: "Tegang / misterius", value: "tense, mysterious, suspenseful" },
        { label: "Ceria & energik", value: "cheerful, energetic, playful" },
        { label: "Epik & megah", value: "epic, grand, awe-inspiring" },
        { label: "Hangat & nostalgik", value: "warm, nostalgic, intimate" },
        { label: "Gelap & gritty", value: "dark, gritty, moody" },
      ],
      placeholder: "cth: melankolis tapi penuh harapan",
    },
    format_video: {
      id: "format_video", label: "Format (aspect ratio & durasi)", weight: 1,
      test: (p) => K.aspect.test(p) || K.duration.test(p),
      question: "Untuk platform apa hasilnya? (menentukan aspect ratio)",
      why: "Veo mendukung 16:9 dan 9:16; durasi klip Flow standar 8 detik, Vids juga 8 detik.",
      options: [
        { label: "YouTube / layar lebar — 16:9", value: "16:9" },
        { label: "Reels / TikTok / Shorts — 9:16 vertikal", value: "9:16" },
        { label: "Belum tahu, pakai 16:9", value: "16:9" },
      ],
      placeholder: "cth: 9:16, 8 detik",
    },
    negative_video: {
      id: "negative", label: "Hal yang harus dihindari", weight: 1,
      test: (p) => K.negative.test(p),
      question: "Ada hal yang TIDAK boleh muncul? (teks/subtitle, orang lain, warna tertentu, dsb.)",
      why: "Veo cenderung menambah subtitle atau teks acak; menyebutkan larangan di negative prompt mengurangi itu.",
      options: [
        { label: "Tanpa subtitle / teks / caption di layar", value: "subtitles, captions, on-screen text" },
        { label: "Tanpa orang lain di latar", value: "background people, crowds" },
        { label: "Tanpa logo / watermark", value: "logo, watermark, brand marks" },
        { label: "Tidak ada yang spesifik", value: "" },
      ],
      placeholder: "cth: tanpa teks di layar, tanpa distorsi wajah, tanpa kamera goyang berlebihan",
    },
    // ---- image
    composition: {
      id: "composition", label: "Komposisi & framing", weight: 2,
      test: (p) => K.composition.test(p) || K.camera.test(p),
      question: "Komposisi / framing seperti apa?",
      why: "Framing menentukan apakah fokus ke wajah, seluruh badan, atau lingkungan.",
      options: [
        { label: "Close-up / headshot", value: "Close-up headshot, face filling the frame" },
        { label: "Medium shot (setengah badan)", value: "Medium shot, waist-up" },
        { label: "Full body dengan lingkungan", value: "Full-body shot with environment visible" },
        { label: "Wide landscape, subjek kecil", value: "Wide landscape composition, subject small in frame" },
        { label: "Flat lay / top-down produk", value: "Top-down flat lay product composition" },
      ],
      placeholder: "cth: rule of thirds, subjek di kiri, ruang kosong di kanan untuk teks",
    },
    color: {
      id: "color", label: "Palet warna", weight: 1,
      test: (p) => K.color.test(p),
      question: "Palet warna atau grading yang diinginkan?",
      why: "Warna mengunci identitas visual dan konsistensi antar gambar.",
      options: [
        { label: "Hangat (oranye, cokelat, krem)", value: "warm palette of oranges, browns and cream" },
        { label: "Dingin (biru, teal, abu)", value: "cool palette of blues, teal and grey" },
        { label: "Pastel lembut", value: "soft pastel palette, low saturation" },
        { label: "Hitam putih / monokrom", value: "black and white, rich monochrome tones" },
        { label: "Neon kontras tinggi", value: "high-contrast neon palette, magenta and cyan accents" },
        { label: "Natural, tanpa grading khusus", value: "natural true-to-life colors" },
      ],
      placeholder: "cth: dominan hijau zamrud dengan aksen emas",
    },
    lens: {
      id: "lens", label: "Kamera / lensa (untuk foto)", weight: 1,
      test: (p) => /\d{2,3}\s?mm|lens|lensa|f\/\d|bokeh|depth of field|macro|telephoto|wide angle|fisheye/i.test(p),
      question: "Kalau gaya foto: lensa / setelan kamera apa?",
      why: "Istilah fotografi (85mm f/1.8, macro) memberi hasil jauh lebih realistis daripada kata 'realistis'.",
      options: [
        { label: "Portrait 85mm f/1.8, bokeh lembut", value: "85mm portrait lens, f/1.8, creamy bokeh" },
        { label: "Wide 24mm, semua tajam", value: "24mm wide-angle lens, f/8, everything in focus" },
        { label: "Macro, detail ekstrem", value: "macro lens, extreme detail, razor-thin focus" },
        { label: "Bukan gaya foto (ilustrasi / 3D)", value: "not photographic (illustration / 3D render)" },
      ],
      placeholder: "cth: 50mm f/2, ISO 200, sedikit film grain",
    },
    format_image: {
      id: "format_image", label: "Aspect ratio", weight: 1,
      test: (p) => K.aspect.test(p),
      question: "Aspect ratio gambar?",
      why: "Imagen/Nano Banana mendukung 1:1, 3:4, 4:3, 9:16, 16:9; komposisi berubah drastis mengikuti rasio.",
      options: [
        { label: "1:1 (feed Instagram, avatar)", value: "1:1" },
        { label: "9:16 (story, wallpaper HP)", value: "9:16" },
        { label: "16:9 (thumbnail, banner)", value: "16:9" },
        { label: "3:4 (poster, cetak potret)", value: "3:4" },
        { label: "4:3 (cetak lanskap)", value: "4:3" },
      ],
      placeholder: "cth: 16:9",
    },
    negative_image: {
      id: "negative", label: "Hal yang harus dihindari", weight: 1,
      test: (p) => K.negative.test(p),
      question: "Ada yang harus dihindari? (teks, watermark, objek, cacat anatomi)",
      why: "Negative prompt lebih efektif daripada menulis 'tanpa X' di prompt utama.",
      options: [
        { label: "Tanpa teks / watermark / logo", value: "text, watermark, logo" },
        { label: "Tanpa orang di latar", value: "background people" },
        { label: "Tanpa cacat tangan / anatomi", value: "deformed hands, extra fingers, distorted anatomy" },
        { label: "Tidak ada", value: "" },
      ],
      placeholder: "cth: blur, low quality, extra fingers, text",
    },
    purpose_image: {
      id: "purpose", label: "Tujuan penggunaan", weight: 1,
      test: (p) => K.goal.test(p) || /thumbnail|poster|banner|logo|wallpaper|iklan|ads?|packaging|cover|sampul|avatar|produk|product/i.test(p),
      question: "Gambar ini untuk apa?",
      why: "Tujuan menentukan ruang kosong untuk teks, tingkat detail, dan gaya yang pas.",
      options: [
        { label: "Thumbnail / sampul", value: "thumbnail / cover image, bold readable focal point" },
        { label: "Konten sosial media", value: "social media post, scroll-stopping and clean" },
        { label: "Foto produk / e-commerce", value: "e-commerce product photo, accurate colors, clean backdrop" },
        { label: "Ilustrasi / konsep art", value: "illustration / concept art" },
        { label: "Referensi 'ingredient' untuk Flow (karakter konsisten)", value: "character reference sheet for Flow ingredients: neutral pose, full body, plain background, consistent features" },
      ],
      placeholder: "cth: hero banner website, perlu ruang kosong di sisi kiri",
    },
    // ---- text (Gemini / AI Studio)
    goal: {
      id: "goal", label: "Tujuan & hasil akhir", weight: 3,
      test: (p) => K.goal.test(p) || wc(p) >= 12,
      question: "Apa hasil akhir yang kamu inginkan dan untuk apa dipakai?",
      why: "Model mengoptimalkan output untuk tujuan yang disebutkan; tujuan tersirat sering salah ditebak.",
      options: ["Dokumen / tulisan siap pakai", "Analisis / rekomendasi keputusan", "Kode / solusi teknis", "Ide / brainstorming", "Ringkasan / ekstraksi informasi"],
      placeholder: "cth: email ke klien yang menunda pembayaran, tujuannya agar bayar minggu ini tanpa merusak hubungan",
    },
    audience: {
      id: "audience", label: "Audiens", weight: 2,
      test: (p) => K.audience.test(p),
      question: "Siapa yang akan membaca / menggunakan hasilnya? Seberapa paham mereka topik ini?",
      why: "Audiens mengubah pilihan kata, kedalaman, dan asumsi yang boleh dibuat.",
      options: ["Umum / awam", "Pemula di bidang ini", "Profesional / ahli", "Anak-anak / remaja", "Pengambil keputusan (manajer, klien)"],
      placeholder: "cth: pemilik UMKM yang belum pernah pakai software akuntansi",
    },
    role: {
      id: "role", label: "Peran / persona model", weight: 1,
      test: (p) => K.role.test(p),
      question: "Model harus berperan sebagai siapa?",
      why: "Persona yang spesifik memberi sudut pandang, standar kualitas, dan kosakata yang konsisten.",
      options: ["Pakar bidang terkait (senior, 10+ tahun)", "Editor / penulis profesional", "Mentor yang sabar", "Konsultan yang kritis dan jujur", "Tidak perlu persona khusus"],
      placeholder: "cth: senior UX researcher yang skeptis terhadap asumsi tanpa data",
    },
    context: {
      id: "context", label: "Konteks & latar belakang", weight: 2,
      test: (p) => K.context.test(p) && wc(p) >= 15,
      question: "Konteks apa yang perlu diketahui model? (situasi, data, batasan nyata, apa yang sudah dicoba)",
      why: "Tanpa konteks model mengisi kekosongan dengan asumsi umum yang mungkin tidak cocok.",
      options: ["Saya akan tempelkan data / teks sumber", "Ini bagian dari proyek yang lebih besar (jelaskan)", "Sudah pernah coba, hasilnya kurang (jelaskan)", "Tidak ada konteks tambahan"],
      placeholder: "cth: startup 5 orang, budget terbatas, sudah coba iklan FB hasil nol",
    },
    format: {
      id: "format", label: "Format output", weight: 2,
      test: (p) => K.format.test(p),
      question: "Format output seperti apa yang diinginkan?",
      why: "Format eksplisit menghilangkan basa-basi dan membuat output langsung bisa dipakai / di-parse.",
      options: ["Markdown dengan heading & bullet", "Tabel perbandingan", "JSON terstruktur (sebutkan field)", "Paragraf naratif", "Langkah bernomor"],
      placeholder: "cth: tabel 3 kolom: opsi, kelebihan, risiko; lalu rekomendasi 1 paragraf",
    },
    length: {
      id: "length", label: "Panjang output", weight: 1,
      test: (p) => K.length.test(p),
      question: "Seberapa panjang hasilnya?",
      why: "Tanpa batas panjang model cenderung bertele-tele atau terlalu singkat.",
      options: ["Sangat singkat (1-3 kalimat)", "Pendek (1 paragraf / ≤150 kata)", "Sedang (300-600 kata)", "Panjang & mendalam (1000+ kata)"],
      placeholder: "cth: maksimal 200 kata",
    },
    tone: {
      id: "tone", label: "Nada & gaya bahasa", weight: 1,
      test: (p) => K.tone.test(p),
      question: "Nada bahasa seperti apa?",
      why: "Nada yang ditentukan mencegah hasil terasa generik atau salah register.",
      options: ["Profesional & lugas", "Santai & ramah", "Persuasif & meyakinkan", "Akademis & netral", "Lucu / witty"],
      placeholder: "cth: tegas tapi hangat, tanpa jargon",
    },
    constraints: {
      id: "constraints", label: "Batasan & aturan", weight: 2,
      test: (p) => K.constraints.test(p),
      question: "Ada aturan wajib / larangan? (hal yang harus ada, yang tidak boleh, sumber yang dipakai)",
      why: "Batasan eksplisit mencegah model 'berimprovisasi' di area yang sensitif.",
      options: ["Jangan mengarang fakta; tandai yang tidak pasti", "Hanya pakai informasi yang saya berikan", "Hindari jargon / istilah teknis", "Tidak ada batasan khusus"],
      placeholder: "cth: jangan sebut kompetitor, wajib sebut harga, maksimal 3 poin",
    },
    examples: {
      id: "examples", label: "Contoh / referensi", weight: 1,
      test: (p) => K.examples.test(p),
      question: "Ada contoh output yang kamu suka (atau tidak suka) sebagai referensi?",
      why: "Satu contoh bagus (few-shot) biasanya lebih efektif dari lima kalimat instruksi.",
      options: ["Ya, saya akan tempelkan contoh", "Tiru gaya tokoh / brand tertentu (sebutkan)", "Tidak ada contoh"],
      placeholder: "cth: gaya seperti newsletter Morning Brew",
    },
    success: {
      id: "success", label: "Kriteria sukses", weight: 1,
      test: (p) => /success|criteria|good (answer|result)|dianggap (bagus|berhasil)|kriteria|berhasil jika/i.test(p),
      question: "Bagaimana kamu tahu hasilnya bagus? Apa yang membedakan jawaban 'cukup' dan 'luar biasa'?",
      why: "Kriteria sukses membuat model bisa mengevaluasi dan merevisi outputnya sendiri.",
      options: ["Langsung bisa dipakai tanpa edit", "Memberi sudut pandang yang tidak saya pikirkan", "Akurat dan bisa diverifikasi", "Mudah dipahami pemula"],
      placeholder: "cth: klien membalas dan setuju jadwal bayar",
    },
    language: {
      id: "language", label: "Bahasa output", weight: 1,
      test: (p) => K.language.test(p),
      question: "Hasil akhir dalam bahasa apa?",
      why: "Prompt campur bahasa membuat model bisa salah pilih bahasa output.",
      options: ["Bahasa Indonesia", "English", "Bilingual (ID + EN)"],
      placeholder: "cth: Bahasa Indonesia baku",
    },
    // ---- vids
    topic: {
      id: "topic", label: "Topik & pesan inti", weight: 3,
      test: (p) => wc(p) >= 6,
      question: "Apa topik video dan satu pesan inti yang harus diingat penonton?",
      why: "Google Vids menyusun outline dari pesan inti; tanpa itu strukturnya acak.",
      options: ["Penjelasan produk / fitur", "Update / laporan internal", "Edukasi / tutorial", "Promosi / marketing", "Cerita / testimoni"],
      placeholder: "cth: onboarding karyawan baru; pesan inti: 'kamu tidak sendiri, ini 3 orang yang bisa dihubungi'",
    },
    vid_audience: {
      id: "audience", label: "Audiens", weight: 2,
      test: (p) => K.audience.test(p),
      question: "Siapa penontonnya dan di mana video ditonton?",
      why: "Menentukan bahasa, tempo, dan tingkat detail.",
      options: ["Tim internal / karyawan", "Pelanggan / calon pembeli", "Siswa / peserta pelatihan", "Publik di sosial media", "Investor / manajemen"],
      placeholder: "cth: tim sales 20 orang, ditonton di meeting mingguan",
    },
    vid_duration: {
      id: "duration", label: "Durasi & struktur", weight: 2,
      test: (p) => K.duration.test(p) || K.structure.test(p),
      question: "Berapa durasi total dan berapa bagian / adegan?",
      why: "Vids bekerja per adegan; klip AI-nya 8 detik. Durasi menentukan jumlah adegan.",
      options: ["30-60 detik, 3-5 adegan", "1-2 menit, 5-8 adegan", "3-5 menit, 8-12 adegan", "Satu klip 8 detik saja"],
      placeholder: "cth: 90 detik, 6 adegan: hook, masalah, solusi x3, CTA",
    },
    vid_tone: {
      id: "tone", label: "Nada & gaya", weight: 1,
      test: (p) => K.tone.test(p) || K.style.test(p),
      question: "Nada dan gaya visualnya?",
      why: "Menyelaraskan narasi, musik, dan pilihan klip/stok.",
      options: ["Profesional korporat, bersih", "Santai & hangat", "Energik & cepat (sosial media)", "Inspiratif / storytelling", "Edukatif & jelas"],
      placeholder: "cth: ramah tapi tetap profesional, palet warna brand biru-putih",
    },
    vid_voice: {
      id: "voice", label: "Narasi / voiceover", weight: 2,
      test: (p) => K.audio.test(p),
      question: "Apakah ada narasi/voiceover? Siapa yang bicara dan bahasanya?",
      why: "Vids bisa membuat voiceover AI; skrip narasi harus ditulis per adegan.",
      options: ["Voiceover AI, Bahasa Indonesia", "Voiceover AI, English", "Tanpa narasi, teks di layar + musik", "Presenter asli (saya rekam sendiri)"],
      placeholder: "cth: narator wanita, tenang, Bahasa Indonesia",
    },
    vid_points: {
      id: "points", label: "Poin-poin isi", weight: 2,
      test: (p) => K.structure.test(p) || /\d\.|•|-\s/.test(p),
      question: "Poin-poin isi apa saja yang WAJIB masuk? (urutkan kalau bisa)",
      why: "Ini bahan mentah tiap adegan; Vids tidak bisa menebak fakta spesifik kamu.",
      options: ["Saya akan tulis poin-poinnya", "Biarkan AI menyusun struktur standar (hook-masalah-solusi-CTA)"],
      placeholder: "cth: 1) fitur baru X 2) cara aktifkan 3) kontak support",
    },
    vid_cta: {
      id: "cta", label: "Ajakan / penutup (CTA)", weight: 1,
      test: (p) => K.cta.test(p),
      question: "Apa yang harus dilakukan penonton setelah menonton?",
      why: "Video tanpa CTA jelas kehilangan tujuannya.",
      options: ["Kunjungi link / daftar", "Hubungi tim / balas email", "Terapkan langkahnya", "Tidak perlu CTA"],
      placeholder: "cth: isi formulir di link bio sebelum Jumat",
    },
    vid_brand: {
      id: "brand", label: "Brand & aset", weight: 1,
      test: (p) => K.brand.test(p),
      question: "Ada brand, warna, logo, atau aset (foto/slide) yang harus dipakai?",
      why: "Vids mendukung aset Drive dan tema; menyebutkannya menjaga konsistensi.",
      options: ["Ya, pakai warna/logo brand (sebutkan)", "Pakai foto/slide dari Drive", "Bebas, tanpa brand khusus"],
      placeholder: "cth: warna #1A73E8, logo di pojok kanan bawah",
    },
    // ---- omni / multimodal
    modality: {
      id: "modality", label: "Jenis output (modalitas)", weight: 3,
      test: (p) => /video|image|gambar|foto|audio|suara|music|musik|text|teks|voice|3d|animation|animasi/i.test(p),
      question: "Output apa yang kamu inginkan dari model? (bisa lebih dari satu)",
      why: "Model omni/multimodal perlu tahu modalitas target agar tidak salah bentuk output.",
      options: [
        { label: "Video pendek", value: "a short video clip with sound" },
        { label: "Gambar", value: "a single image" },
        { label: "Teks + gambar", value: "an image plus accompanying text" },
        { label: "Audio / suara / musik", value: "audio (voice / music / sound design)" },
        { label: "Analisis dari gambar/video yang saya unggah", value: "a written analysis of the uploaded image/video" },
      ],
      placeholder: "cth: gambar + caption pendek untuk Instagram",
    },
    references: {
      id: "references", label: "Referensi / input yang diunggah", weight: 2,
      test: (p) => /attached|uploaded|reference|this image|this video|gambar ini|video ini|terlampir|unggah|referensi/i.test(p),
      question: "Apakah kamu akan mengunggah referensi (gambar, video, audio)? Apa yang harus dipertahankan dari referensi itu?",
      why: "Model multimodal sangat kuat kalau diberi tahu elemen mana dari referensi yang harus dijaga (wajah, warna, pose).",
      options: [
        { label: "Ya, jaga identitas karakter/wajah", value: "keep the character's identity, face and hair exactly as in the reference" },
        { label: "Ya, jaga gaya & palet warna", value: "keep the reference's style and color palette" },
        { label: "Ya, jaga komposisi/pose", value: "keep the reference's composition and pose" },
        { label: "Tidak ada referensi", value: "" },
      ],
      placeholder: "cth: pertahankan wajah dan rambut, ubah latar dan pakaian",
    },
  };

  // -----------------------------------------------------------
  // PLATFORM PROFILES
  // -----------------------------------------------------------
  const PLATFORMS = {
    veo: {
      id: "veo",
      name: "Veo / Google Flow",
      short: "Video (Veo 3)",
      icon: "🎬",
      desc: "Text-to-video & image-to-video di Google Flow (labs.google/flow), Gemini app, dan Vertex AI. Klip 8 detik dengan audio native.",
      outputLang: "en",
      dims: [D.subject, D.action, D.setting, D.camera, D.time_light, D.style, D.audio, D.mood, D.format_video, D.negative_video],
      settings: {
        aspect: ["16:9", "9:16"],
        duration: ["8s"],
        extra: ["Text-to-Video", "Image-to-Video (Frames)", "Ingredients-to-Video"],
      },
      guide: [
        "Satu klip = satu aksi utama yang jelas; jangan menumpuk 3 kejadian dalam 8 detik.",
        "Urutan yang terbukti: [shot & gerakan kamera] + [subjek sangat spesifik] + [aksi] + [latar & waktu] + [pencahayaan] + [gaya] + [audio].",
        "Tulis dialog dalam tanda kutip dan sebutkan siapa yang bicara: The old fisherman says: \"...\" — tanpa tanda kutip model sering menampilkannya sebagai teks di layar.",
        "Deskripsikan audio secara eksplisit: ambience, SFX, musik, atau 'no music'. Veo 3 membuat audio; jika tidak diarahkan hasilnya acak.",
        "Jangan menulis 'no X' di prompt utama (model justru fokus ke X). Taruh di negative prompt, dengan kata benda saja: 'subtitles, captions, text overlay, watermark'.",
        "Gunakan bahasa Inggris untuk prompt utama; dialog boleh berbahasa lain tapi beri tahu: speaking in Indonesian.",
        "Istilah sinematik nyata bekerja: 35mm lens, shallow depth of field, slow dolly-in, handheld, anamorphic flare, teal-and-orange grade.",
        "Untuk karakter konsisten antar klip, pakai 'character sheet' yang persis sama di setiap prompt (usia, wajah, rambut, pakaian, warna).",
        "Image-to-Video: prompt menjelaskan GERAKAN dan kamera, bukan mendeskripsikan ulang gambar.",
        "Hindari teks di layar sepenuhnya: tambahkan 'no subtitles, no captions, no on-screen text' di negative prompt.",
      ],
      examples: [
        "kucing oranye main di taman",
        "iklan parfum mewah, wanita elegan, Paris malam hari",
        "cinematic drone shot of a lone hiker on a volcanic ridge at sunrise",
        "robot kecil menemukan bunga di kota yang hancur",
      ],
    },

    vids: {
      id: "vids",
      name: "Google Vids",
      short: "Video kerja (Vids)",
      icon: "📽️",
      desc: "Google Vids (Workspace): 'Help me create' menyusun outline, skrip, voiceover, dan klip AI 8 detik berbasis Veo. Cocok untuk video bisnis, edukasi, update tim.",
      outputLang: "id",
      dims: [D.topic, D.vid_audience, D.vid_duration, D.vid_points, D.vid_voice, D.vid_tone, D.vid_cta, D.vid_brand, D.format_video],
      settings: {
        aspect: ["16:9", "9:16"],
        duration: ["30-60s", "1-2 menit", "3-5 menit"],
        extra: ["Help me create (outline penuh)", "Generate clip (Veo 8s)", "Voiceover AI"],
      },
      guide: [
        "Prompt 'Help me create' paling efektif berisi: topik, audiens, tujuan, durasi, nada, poin-poin wajib, dan CTA.",
        "Vids berpikir per ADEGAN. Berikan struktur adegan (hook → isi → CTA) agar outline langsung rapi.",
        "Tulis skrip voiceover per adegan dalam kalimat pendek (≤ 20 kata) — lebih natural dibaca suara AI.",
        "Untuk klip AI di Vids, pakai aturan Veo: satu aksi, kamera, pencahayaan, gaya; durasi 8 detik.",
        "Sebutkan aset yang ada (slide, foto Drive, logo) supaya Vids menggabungkannya, bukan mengganti dengan stok.",
        "Sebutkan bahasa narasi secara eksplisit (Bahasa Indonesia / English).",
        "Hindari jargon internal tanpa penjelasan—Vids akan menyalinnya mentah ke teks di layar.",
      ],
      examples: [
        "video onboarding karyawan baru",
        "video update produk kuartal ini untuk tim sales",
        "tutorial 1 menit cara pakai fitur baru aplikasi kami",
        "video promosi kursus online 60 detik untuk Instagram",
      ],
    },

    image: {
      id: "image",
      name: "Imagen / Nano Banana",
      short: "Gambar",
      icon: "🖼️",
      desc: "Imagen 4, Gemini image (Nano Banana) di AI Studio, Gemini app, dan Flow 'Ingredients'. Juga cocok untuk Whisk.",
      outputLang: "en",
      dims: [D.subject, D.setting, D.composition, D.time_light, D.style, D.color, D.lens, D.mood, D.format_image, D.purpose_image, D.negative_image],
      settings: {
        aspect: ["1:1", "3:4", "4:3", "9:16", "16:9"],
        duration: [],
        extra: ["Text-to-Image", "Image editing (Nano Banana)", "Flow Ingredient (karakter konsisten)"],
      },
      guide: [
        "Struktur: [subjek + detail] + [aksi/pose] + [latar] + [komposisi] + [pencahayaan] + [warna] + [gaya/medium] + [kamera/lensa] + [kualitas].",
        "Kata 'realistis' saja lemah; istilah fotografi nyata (85mm f/1.8, softbox, Kodak Portra 400) jauh lebih kuat.",
        "Untuk ilustrasi, sebutkan medium dan referensi gaya: 'gouache illustration, flat colors, thick outlines, editorial style'.",
        "Komposisi eksplisit: 'centered', 'rule of thirds', 'negative space on the left for text'.",
        "Nano Banana (Gemini image edit) menyukai instruksi percakapan: 'keep the face and hair exactly the same, change only the background to...'.",
        "Taruh larangan di negative prompt sebagai kata benda: 'text, watermark, blur, extra fingers'.",
        "Satu konsep per gambar. Kalau butuh beberapa variasi, buat beberapa prompt.",
      ],
      examples: [
        "logo kopi minimalis",
        "foto produk sepatu lari di studio",
        "ilustrasi anak membaca buku di bawah pohon",
        "karakter ingredient: detektif wanita cyberpunk untuk Flow",
      ],
    },

    gemini: {
      id: "gemini",
      name: "Gemini / AI Studio",
      short: "Teks & chat",
      icon: "💎",
      desc: "Prompt teks untuk Gemini 2.5/3 di aistudio.google.com, Gemini app, atau API. Termasuk system instruction.",
      outputLang: "id",
      dims: [D.goal, D.context, D.audience, D.format, D.constraints, D.role, D.tone, D.length, D.examples, D.success, D.language],
      settings: {
        aspect: [],
        duration: [],
        extra: ["Single prompt", "System instruction + user prompt", "Few-shot (dengan contoh)"],
      },
      guide: [
        "Struktur yang konsisten bekerja: ROLE → CONTEXT → TASK → CONSTRAINTS → OUTPUT FORMAT → EXAMPLES → QUALITY BAR.",
        "Katakan APA yang harus dilakukan, bukan hanya apa yang tidak boleh. Larangan tanpa alternatif membuat model ragu.",
        "Beri konteks nyata: siapa kamu, situasinya, apa yang sudah dicoba, apa yang dipertaruhkan.",
        "Format output eksplisit (heading, tabel, JSON schema) menghapus basa-basi dan membuat hasil langsung dipakai.",
        "Untuk tugas rumit, minta model bekerja bertahap: pahami → rencanakan → kerjakan → periksa sendiri terhadap kriteria.",
        "Satu contoh output ideal (few-shot) > lima kalimat instruksi gaya.",
        "Pisahkan instruksi dari data dengan delimiter: <data>...</data> atau ```...```.",
        "Minta model menandai ketidakpastian dan bertanya jika informasi kurang, daripada mengarang.",
        "Gunakan System Instruction di AI Studio untuk aturan yang berlaku sepanjang percakapan.",
      ],
      examples: [
        "buatkan caption instagram untuk produk skincare",
        "tolong review kode python saya",
        "bikin rencana belajar bahasa jepang",
        "tulis email ke klien yang telat bayar",
      ],
    },

    omni: {
      id: "omni",
      name: "Omni / Multimodal",
      short: "Multimodal",
      icon: "🌐",
      desc: "Prompt universal untuk model multimodal (input/output campuran: teks, gambar, video, audio) — Gemini multimodal, model omni, atau tool lain yang belum punya profil khusus.",
      outputLang: "en",
      dims: [D.modality, D.subject, D.references, D.style, D.setting, D.mood, D.format, D.constraints, D.negative_image, D.language],
      settings: {
        aspect: ["16:9", "9:16", "1:1"],
        duration: ["8s", "15s", "30s"],
        extra: ["Generate", "Edit / transform referensi", "Analisis input multimodal"],
      },
      guide: [
        "Nyatakan modalitas output di kalimat pertama: 'Generate a 10-second video with sound' / 'Produce one image and a 2-sentence caption'.",
        "Jika ada referensi yang diunggah, sebutkan eksplisit apa yang DIJAGA dan apa yang DIUBAH.",
        "Pakai blok berlabel (SUBJECT / STYLE / CONSTRAINTS / OUTPUT) agar model tidak mencampur instruksi.",
        "Tetap sertakan aturan sinematik/fotografi jika output visual, dan aturan format jika output teks.",
        "Sebutkan bahasa untuk setiap bagian teks (caption, dialog, narasi).",
      ],
      examples: [
        "buat video pendek dengan narasi dari gambar produk ini",
        "ubah foto ini jadi gaya anime dan beri caption",
        "generate 3 gambar + deskripsi untuk katalog",
      ],
    },
  };

  // Urutan tampil
  const ORDER = ["veo", "vids", "image", "gemini", "omni"];

  return { PLATFORMS, ORDER, K, D, wc };
})();
