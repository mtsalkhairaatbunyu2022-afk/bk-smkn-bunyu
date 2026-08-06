# Panduan Deploy BK SMK Negeri 1 Bunyu ke GitHub Pages

Aplikasi **BK SMK NEGERI 1 BUNYU** dirancang sebagai **Standalone Progressive Web App (PWA)** tanpa ketergantungan backend server, sehingga sangat ideal dan 100% kompatibel untuk di-hosting di **GitHub Pages** secara gratis!

---

## Langkah 1: Persiapan Repositori GitHub

1. Buat repositori baru di GitHub (contoh: `bk-smkn1-bunyu`).
2. Jalankan perintah git pada komputer Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - BK SMKN 1 Bunyu PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/bk-smkn1-bunyu.git
   git push -u origin main
   ```

---

## Langkah 2: Konfigurasi `vite.config.ts` untuk Subpath

Jika repositori GitHub Pages Anda menggunakan nama repositori sebagai URL subpath (contoh: `https://USERNAME.github.io/bk-smkn1-bunyu/`), pastikan opsi `base` pada `vite.config.ts` diatur ke `'./'` atau `'/bk-smkn1-bunyu/'`:

```typescript
export default defineConfig({
  base: './', // Menggunakan path relatif agar PWA berjalan sempurna di subfolder
  plugins: [react(), tailwindcss()],
  // ...
});
```

---

## Langkah 3: Build & Deploy Manual atau via GitHub Actions

### Opsi A: Menggunakan Package `gh-pages` (Mudah)

1. Instal package `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
2. Tambahkan script berikut di `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Jalankan deploy:
   ```bash
   npm run deploy
   ```

### Opsi B: Menggunakan GitHub Actions (Otomatis)

Buat file `.github/workflows/deploy.yml`:

```yaml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Langkah 4: Pengaturan GitHub Pages di Dashboard

1. Buka Repositori GitHub Anda → Klik **Settings** → **Pages**.
2. Pada bagian **Build and deployment**:
   - Source: **GitHub Actions** (jika pakai Opsi B) atau **Deploy from a branch** (`gh-pages` / `/root` jika pakai Opsi A).
3. Setelah proses selesai, akses aplikasi PWA Anda di URL `https://USERNAME.github.io/bk-smkn1-bunyu/`.
4. Buka URL tersebut di Android atau Windows dan klik **INSTALL APP** di halaman utama!
