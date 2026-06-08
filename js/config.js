/* ===========================================================================
   KONFIGURASI FIREBASE
   ---------------------------------------------------------------------------
   Ganti nilai di bawah dengan konfigurasi project Firebase milikmu.
   Panduan lengkap ada di file PANDUAN.md.

   Selama nilainya masih "PASTE_...", aplikasi otomatis berjalan dalam
   MODE LOKAL (data disimpan di browser ini saja) supaya bisa langsung dicoba.
   Begitu config asli dimasukkan, login Google + sinkron antar perangkat aktif.
   =========================================================================== */
window.JC = window.JC || {};

JC.config = {
  apiKey:            "AIzaSyB8TP8QYMrHm62UQ6G-SDRbZEtiHhIf5Mo",
  authDomain:        "jalan-cerita-2a110.firebaseapp.com",
  projectId:         "jalan-cerita-2a110",
  storageBucket:     "jalan-cerita-2a110.firebasestorage.app",
  messagingSenderId: "475479364450",
  appId:             "1:475479364450:web:dbdde53a71145174c6123b",
};

/* Deteksi otomatis — jangan diubah. */
JC.useFirebase = !!(JC.config.apiKey && JC.config.apiKey.indexOf("PASTE_") !== 0);
