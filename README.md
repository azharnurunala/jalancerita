# Jalan Cerita 🪶

Aplikasi web untuk memantau progres novel-novel yang sedang kamu tulis: **judul, kover (rasio 13×19), premis, sinopsis panjang, karakter, 15 beat sheet (Save the Cat!), plot points, target & progres jumlah kata, deadline,** dan **catatan/riset** per project.

Login dengan akun Google (Firebase), sehingga datamu **tersinkron otomatis** saat dibuka di HP maupun laptop.

---

## 🚀 Coba dulu tanpa setup apa pun

Buka `index.html`. Tanpa konfigurasi Firebase, aplikasi berjalan dalam **Mode Lokal** — kamu bisa login (demo), membuat novel, dan mengisi semua data. Datanya tersimpan di browser itu saja (belum tersinkron). Ini berguna untuk mencoba tampilan & alur sebelum menghubungkan Firebase.

Begitu konfigurasi Firebase diisi (langkah di bawah), aplikasi otomatis beralih ke **login Google + sinkron penuh**.

---

## 1) Membuat project Firebase (sekali saja, gratis)

1. Buka <https://console.firebase.google.com> → **Add project** → beri nama (mis. `jalan-cerita`) → ikuti sampai selesai. (Google Analytics boleh dimatikan.)
2. Di menu kiri, buka **Build → Authentication** → **Get started** → tab **Sign-in method** → aktifkan **Google** → Save.
3. Di menu kiri, buka **Build → Firestore Database** → **Create database** → pilih lokasi (mis. `asia-southeast2` / Jakarta) → mulai dengan mode **production**.
4. Buka tab **Rules** di Firestore, ganti seluruh isinya dengan isi file [`firestore.rules`](firestore.rules) di project ini, lalu **Publish**. (Aturan ini memastikan tiap pengguna hanya bisa mengakses datanya sendiri.)

## 2) Ambil konfigurasi & tempel ke aplikasi

1. Di Firebase Console: ikon ⚙️ (Project settings) → scroll ke **Your apps** → klik ikon **Web** `</>` → daftarkan app (cukup beri nama, tidak perlu Hosting).
2. Firebase menampilkan objek `firebaseConfig` berisi `apiKey`, `authDomain`, dst. **Salin nilai-nilainya.**
3. Buka file **`js/config.js`** di project ini dan ganti nilai `PASTE_...` dengan milikmu:

   ```js
   JC.config = {
     apiKey:            "AIza................",
     authDomain:        "jalan-cerita.firebaseapp.com",
     projectId:         "jalan-cerita",
     storageBucket:     "jalan-cerita.appspot.com",
     messagingSenderId: "1234567890",
     appId:             "1:1234567890:web:abcdef......",
   };
   ```

4. Simpan. Buka kembali aplikasi — badge "Mode Lokal" hilang dan tombol berubah menjadi login Google asli. 🎉

> **Penting saat sudah online:** di **Authentication → Settings → Authorized domains**, tambahkan domain Vercel-mu (mis. `jalan-cerita.vercel.app` dan domain custom bila ada). `localhost` sudah otomatis diizinkan untuk pengetesan.

---

## 3) Naik ke GitHub & deploy ke Vercel

Aplikasi ini **situs statis murni** (HTML + CSS + JS, tanpa build step), jadi sangat mudah di-deploy.

### A. Push ke GitHub
1. Buat repository baru di GitHub (mis. `jalan-cerita`).
2. Unggah seluruh isi project ini ke repo tersebut (lewat web GitHub: *Add file → Upload files*, atau via Git):
   ```bash
   git init
   git add .
   git commit -m "Jalan Cerita"
   git branch -M main
   git remote add origin https://github.com/USERNAME/jalan-cerita.git
   git push -u origin main
   ```

### B. Deploy di Vercel
1. Buka <https://vercel.com> → **Add New… → Project** → **Import** repo `jalan-cerita`.
2. Framework Preset: **Other** (biarkan default). Tidak perlu Build Command atau Output Directory — ini situs statis.
3. Klik **Deploy**. Beberapa detik kemudian situsmu live di `https://jalan-cerita.vercel.app`.
4. Kembali ke **Firebase → Authentication → Settings → Authorized domains** dan tambahkan domain Vercel tadi (lihat catatan di langkah 2).

Setiap kali kamu `git push`, Vercel otomatis men-deploy versi terbaru.

---

## 📁 Struktur file

```
index.html            ← halaman utama, memuat semua skrip
vercel.json           ← konfigurasi kecil untuk Vercel (URL rapi)
firestore.rules       ← aturan keamanan untuk ditempel ke Firestore
css/styles.css        ← seluruh gaya visual
js/config.js          ← ⬅️  ISI KONFIGURASI FIREBASE DI SINI
js/beats.js           ← definisi 15 beat Save the Cat!
js/ui.js              ← ikon, util, modal, toast, resize gambar
js/store.js           ← lapisan data (Firebase + fallback lokal)
js/app.js             ← beranda & dashboard
js/project.js         ← editor detail novel (semua tab)
```

## 🧱 Model data (Firestore)

```
users/{uid}/projects/{projectId}
  title, premise, synopsis, coverImage(base64),
  targetWords, currentWords, deadline, status, genre,
  characters[ {name, role, description, motivation, conflict, arc} ],
  beats{ opening_image, theme_stated, … final_image },   // 15 beat
  plotPoints[ {text} ],
  notes[ {tag, title, body, createdAt} ],
  createdAt, updatedAt
```

Kover disimpan langsung sebagai gambar terkompresi (di-resize otomatis ke lebar maks. 760px) agar hemat dan tetap di bawah batas dokumen Firestore.

---

## ❓ Troubleshooting singkat

- **Login Google muncul "unauthorized domain"** → tambahkan domain (Vercel/custom) di Authentication → Settings → Authorized domains.
- **Data tidak tersimpan / "Missing permissions"** → pastikan `firestore.rules` sudah di-Publish dan kamu sudah login.
- **Pop-up login terblokir** → izinkan pop-up untuk situs, atau coba lagi.
- **Masih "Mode Lokal"** → nilai di `js/config.js` masih `PASTE_...`; pastikan sudah diganti dan file tersimpan.

Selamat menulis — semoga setiap novel menemukan jalan ceritanya. 🪶
