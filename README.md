# BK SMK NEGERI 1 BUNYU - Standalone PWA

Sistem Informasi Bimbingan dan Konseling Terpadu SMK Negeri 1 Bunyu. Aplikasi Progressive Web App (PWA) Standalone & Offline-First untuk pengelolaan data siswa, rekap absensi, jurnal harian guru BK, konseling siswa, dan penilaian harian.

---

## 🌟 Identitas Resmi & Logo Konselor

Aplikasi ini menggunakan **Logo Konselor resmi** sebagai satu-satunya identitas visual pada:
- **Landing Page & Header**
- **Splash Screen (Layar Pembuka)**
- **Dashboard & Seluruh Modul**
- **PWA Manifest & Browser Icons**
- **Home Screen Android (Adaptive & Maskable Icons)**
- **Desktop Windows, Start Menu & Taskbar**

---

## 🚀 Fitur Utama

1. **Standalone & Offline Total**
   - 100% Data tersimpan secara lokal di perangkat pengguna menggunakan **IndexedDB** & **LocalStorage** sebagai cadangan.
   - Tanpa ketergantungan pada cloud server atau database eksternal (Tanpa Firebase/Supabase/Cloud DB).
   - Berjalan penuh tanpa jaringan internet setelah diinstal.

2. **PWA Native Multi-Platform**
   - Dapat diinstal langsung dari browser melalui tombol **INSTALL APP**.
   - Berjalan mandiri pada Android, Windows, Mac, Linux, Laptop, dan Browser Modern.

3. **6 Modul Utama**:
   - **Dashboard**: Statistik total siswa, absensi, konseling, jurnal, dan penilaian harian.
   - **Data Siswa**: Tambah, edit, hapus, cari, filter kelas/jurusan, import/export Excel multi-sheet.
   - **Absen Siswa**: Rekap harian & bulanan, pilihan status (Hadir, Sakit, Izin, Alpha), export Excel.
   - **Bimbingan Konseling**: Pengelolaan kasus siswa, solusi/tindak lanjut, status penyelesaian, serta fitur **Cetak Kartu Layanan Konseling PDF**.
   - **Jurnal Harian**: Catatan aktivitas harian guru BK & fitur **Cetak Jurnal Harian PDF**.
   - **Penilaian Harian**: Penilaian indikator sikap & kepribadian dengan **Kalkulasi Rata-Rata Otomatis** & export Excel.

4. **Backup & Restore Database JSON**:
   - Ekspor seluruh database lokal ke dalam file JSON secara mandiri.
   - Impor file backup JSON untuk pemulihan data secara instan.

---

## 📖 Panduan Deploy & Instalasi

- 📄 [Panduan Deploy GitHub Pages](./GITHUB_PAGES_GUIDE.md)
- ⚡ [Panduan Deploy Cloudflare Pages](./CLOUDFLARE_PAGES_GUIDE.md)
- 📱 [Panduan Instalasi Android](./ANDROID_INSTALL_GUIDE.md)
- 💻 [Panduan Instalasi Windows](./WINDOWS_INSTALL_GUIDE.md)

---

## 💻 Teknologi

- **React 19**
- **Vite**
- **Tailwind CSS v4**
- **IndexedDB (`idb`) & LocalStorage**
- **SheetJS (`xlsx`)**
- **jsPDF & jsPDF-AutoTable**
- **Lucide React Icons**
- **Service Worker PWA & Web App Manifest**
