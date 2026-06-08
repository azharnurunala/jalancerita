/* Save the Cat! — 15 beat sheet (Blake Snyder)
   Penamaan + deskripsi singkat dalam Bahasa Indonesia.
   "pos" = perkiraan posisi di naskah (persentase), membantu menakar pacing. */
window.JC = window.JC || {};
JC.BEATS = [
  { act: 1, key: "opening_image",   no: 1,  name: "Opening Image",        id: "Citra Pembuka",        pos: "0–1%",   desc: "Gambaran awal yang menetapkan nada, mood, dan dunia cerita. Cermin dari Final Image." },
  { act: 1, key: "theme_stated",    no: 2,  name: "Theme Stated",         id: "Tema Dinyatakan",      pos: "~5%",    desc: "Seseorang menyebut tema/pesan cerita — sering belum disadari sang tokoh." },
  { act: 1, key: "setup",           no: 3,  name: "Set-Up",               id: "Penyiapan",            pos: "1–10%",  desc: "Perkenalkan tokoh, dunia, kekurangan, dan apa yang perlu diperbaiki dalam hidupnya." },
  { act: 1, key: "catalyst",        no: 4,  name: "Catalyst",             id: "Pemantik",             pos: "~10%",   desc: "Kejadian yang mengguncang dunia tokoh — titik tak bisa kembali." },
  { act: 1, key: "debate",          no: 5,  name: "Debate",               id: "Keraguan",             pos: "10–20%", desc: "Tokoh ragu: haruskah ia melangkah? Pertanyaan yang menggantung." },
  { act: 2, key: "break_two",       no: 6,  name: "Break into Two",       id: "Masuk Babak Dua",      pos: "~20%",   desc: "Tokoh memilih bertindak dan memasuki dunia baru / cara baru." },
  { act: 2, key: "b_story",         no: 7,  name: "B Story",              id: "Kisah B",              pos: "~22%",   desc: "Subplot — sering relasi/cinta — yang membawa tema cerita." },
  { act: 2, key: "fun_games",       no: 8,  name: "Fun and Games",        id: "Janji Premis",         pos: "20–50%", desc: "Inti hiburan: 'janji dari premis' ditunaikan. Bagian paling seru di sampul/trailer." },
  { act: 2, key: "midpoint",        no: 9,  name: "Midpoint",             id: "Titik Tengah",         pos: "~50%",   desc: "Kemenangan semu atau kekalahan semu; taruhan naik, waktu mulai menekan." },
  { act: 2, key: "bad_guys",        no: 10, name: "Bad Guys Close In",    id: "Tekanan Mengepung",    pos: "50–75%", desc: "Tekanan dari luar & dalam menguat; tim retak, rencana goyah." },
  { act: 2, key: "all_lost",        no: 11, name: "All Is Lost",          id: "Segalanya Hilang",     pos: "~75%",   desc: "Titik terendah. Sering ada 'bau kematian' — sesuatu/seseorang berakhir." },
  { act: 2, key: "dark_night",      no: 12, name: "Dark Night of the Soul",id: "Malam Tergelap",      pos: "75–80%", desc: "Tokoh terpuruk dalam keputusasaan sebelum menemukan jawaban." },
  { act: 3, key: "break_three",     no: 13, name: "Break into Three",     id: "Masuk Babak Tiga",     pos: "~80%",   desc: "Berkat Kisah B + perjuangan, tokoh menemukan solusi dan bangkit." },
  { act: 3, key: "finale",          no: 14, name: "Finale",               id: "Klimaks",              pos: "80–99%", desc: "Tokoh menerapkan pelajaran, mengalahkan antagonis, dunia baru tercipta." },
  { act: 3, key: "final_image",     no: 15, name: "Final Image",          id: "Citra Penutup",        pos: "99–100%",desc: "Kebalikan dari Opening Image — bukti perubahan telah terjadi." },
];
JC.ACTS = {
  1: "Babak Satu · Tesis",
  2: "Babak Dua · Antitesis",
  3: "Babak Tiga · Sintesis",
};
