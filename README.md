# ✦ Prompt Improver

**Ubah prompt biasa menjadi super prompt yang presisi, tajam, dan sesuai aturan platform** — untuk **Google Flow (Veo 3)**, **Google Vids**, **Imagen / Nano Banana**, **Gemini di AI Studio**, dan model **multimodal / omni**.

Web app statis, tanpa backend. Jalan di browser, bisa di-host gratis di GitHub Pages.

> 🌐 **Demo:** https://amajing-grace-2026.github.io/prompt-improver/

---

## Cara kerja

1. **Pilih target** (Veo/Flow, Vids, Imagen, Gemini, Omni), tempel prompt apa adanya — Bahasa Indonesia atau Inggris.
2. **Analisis** — tools menilai kelengkapan prompt (skor 0-100) berdasarkan dimensi yang penting untuk platform itu (subjek, aksi, kamera, cahaya, audio, format, dst.).
3. **3–10 pertanyaan** muncul, jumlahnya tergantung seberapa banyak yang kurang:

   | Kelengkapan | Pertanyaan |
   |---|---|
   | < 30 % | 9–10 |
   | 30–49 % | 7–8 |
   | 50–69 % | 5–6 |
   | 70–84 % | 4 |
   | ≥ 85 % | 3 (penajam) |

   Tiap pertanyaan punya pilihan cepat + isian bebas, dan bisa dilewati ("biarkan AI memutuskan").
4. **Super prompt** dihasilkan: prompt utama, negative prompt, setelan teknis (aspect ratio, durasi), 2–3 variasi, daftar perubahan, tips platform. Untuk Veo juga **JSON terstruktur** dan **shot list** multi-klip dengan character sheet konsisten; untuk Vids **storyboard** per adegan (narasi, teks layar, prompt visual); untuk Gemini **System Instruction** siap tempel di AI Studio.
5. **Perbaiki lagi** — tulis masukan ("lebih gelap", "ganti kamera handheld") dan prompt direvisi.

## Dua engine

| | Engine Lokal | Engine AI (Gemini) |
|---|---|---|
| Butuh API key | Tidak | Ya — key milikmu dari [AI Studio](https://aistudio.google.com/apikey) (gratis) |
| Cara kerja | Heuristik kata kunci + template | Gemini menganalisis konteks, menulis pertanyaan khusus untuk prompt-mu, menyusun ulang secara kreatif |
| Terjemahan ID → EN | Tidak | Ya |
| "Perbaiki lagi" dengan masukan bebas | Tidak | Ya |
| Privasi | Semuanya offline | Key disimpan di `localStorage`; request langsung ke `generativelanguage.googleapis.com`, tanpa server perantara |

Engine otomatis memilih AI jika key tersedia, dan jatuh ke Lokal jika gagal.

## Aturan platform yang ditanamkan

- **Veo / Flow**: satu aksi per klip 8 detik; urutan shot → subjek → aksi → latar → cahaya → gaya → audio; dialog dalam tanda kutip dengan penutur; audio dideskripsikan eksplisit; larangan dipindah ke negative prompt sebagai kata benda (`subtitles, captions, text overlay`); character sheet identik antar klip.
- **Google Vids**: brief "Help me create" berisi topik, audiens, durasi, nada, poin wajib, CTA; storyboard per adegan dengan narasi ≤ 20 kata dan teks layar ≤ 8 kata; klip AI mengikuti aturan Veo.
- **Imagen / Nano Banana**: subjek + pose + latar + komposisi + cahaya + palet + gaya/medium + lensa + kualitas + aspect ratio; istilah fotografi nyata; instruksi edit percakapan untuk Nano Banana.
- **Gemini / AI Studio**: ROLE → CONTEXT → TASK → RULES → OUTPUT FORMAT → EXAMPLES → QUALITY BAR, aturan anti-halusinasi, izin bertanya, system instruction terpisah.
- **Omni / Multimodal**: modalitas output di kalimat pertama; blok berlabel; aturan penanganan referensi (apa yang dijaga vs diubah).

## Fitur lain

- Skor **sebelum → sesudah**, daftar dimensi yang terdeteksi/kurang.
- Riwayat (40 terakhir) di browser, tema gelap/terang, ekspor `.txt` / `.json`.
- Tautan cepat ke Flow, Vids, AI Studio, Whisk, Gemini.
- Deep link: `index.html?p=veo&q=kucing%20oranye%20main%20di%20taman`.
- Panel panduan per platform (💡).

## Menjalankan lokal

Buka `index.html` langsung di browser, atau dengan server statis:

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 8765
```

```bash
npx serve .      # atau: python -m http.server 8765
```

## Deploy ke GitHub Pages

Repo → **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**. Tidak ada build step.

## Struktur

```
index.html          UI
css/styles.css      tema & layout
js/platforms.js     basis pengetahuan: dimensi, kata kunci, aturan, contoh per platform
js/local-engine.js  analisis heuristik + generator template (offline)
js/ai-engine.js     panggilan Gemini API (analisis + generate + refine)
js/app.js           state, rendering, riwayat, pengaturan
tools/serve.ps1     server statis untuk pratinjau di Windows
```

Menambah platform baru = tambah satu entri di `js/platforms.js` (dims, guide, examples, settings) dan satu generator di `js/local-engine.js`.

## Catatan

Bukan produk resmi Google. Nama Veo, Flow, Vids, Imagen, Gemini, AI Studio adalah milik Google. Lisensi MIT.
