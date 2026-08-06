# Panduan Deploy BK SMK Negeri 1 Bunyu ke Cloudflare Pages

**Cloudflare Pages** memberikan kecepatan akses sangat tinggi secara global melalui Global CDN Cloudflare, SSL otomatis gratis, dan dukungan PWA offline penuh tanpa batas.

---

## Cara Deploy via Cloudflare Pages Dashboard

### 1. Hubungkan ke GitHub
1. Masuk ke dashboard [Cloudflare Pages](https://dash.cloudflare.com/).
2. Pilih menu **Workers & Pages** → Klik **Create Application** → **Pages** → **Connect to Git**.
3. Pilih repositori GitHub `bk-smkn1-bunyu` yang telah Anda buat.

### 2. Pengaturan Build (Build Settings)
Isi formulir konfigurasi build dengan parameter berikut:

- **Framework preset**: `Vite` (atau `None`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js Version**: `20` (Tambahkan Environment Variable `NODE_VERSION` = `20` di Settings jika diperlukan).

### 3. Simpan & Deploy
1. Klik **Save and Deploy**.
2. Cloudflare akan mengompilasi aplikasi PWA Anda dalam beberapa detik.
3. Setelah selesai, aplikasi PWA resmi Anda akan aktif di subdomain gratis Cloudflare (contoh: `https://bk-smkn1-bunyu.pages.dev`).

---

## Opsi Deploy via Command Line (Wrangler CLI)

Jika Anda ingin mendeploy langsung dari terminal komputer tanpa menyambungkan GitHub:

1. Instal Wrangler secara global atau dev dependency:
   ```bash
   npm install -g wrangler
   ```
2. Kompilasi aplikasi:
   ```bash
   npm run build
   ```
3. Lakukan deploy folder `dist`:
   ```bash
   npx wrangler pages deploy dist --project-name=bk-smkn1-bunyu
   ```

---

## Verifikasi PWA pada Cloudflare Pages

Setelah URL `.pages.dev` aktif:
1. Buka URL tersebut di Google Chrome, Microsoft Edge, atau browser Android.
2. Tombol **INSTALL APP** pada halaman utama akan otomatis aktif.
3. Setelah diinstal, aplikasi dapat dibuka tanpa koneksi internet sama sekali!
