# Sifir Airforce - Permainan Kuiz Interaktif Modular

Satu aplikasi permainan pengukuhan asas matematik (Sifir) bertemakan pertempuran jet pejuang angkasa. Aplikasi ini telah distrukturkan semula secara modular menggunakan ES6 bagi memudahkan penyelenggaraan serta integrasi hadapan bersama Google Apps Script.

## 📁 Struktur Projek

```text
SIFIR-AIRFORCE/
│
├── index.html          # Kerangka paparan DOM utama aplikasi
│
├── css/
│   └── style.css       # Mengandungi kesan visual reka bentuk & animasi neon
│
├── js/
│   ├── config.js       # Global state, konfigurasi level & pembolehubah pemalar
│   ├── api.js          # Lapisan perhubungan (API Layer) Google Apps Script (GAS)
│   ├── login.js        # Logik pengurusan murid, kemasukan data sesi, dan kelas
│   ├── quiz.js         # Mekanik sistem penjanaan soalan matematik kuiz sifir
│   ├── minigame.js     # Enjin pergerakan mekanik fizik simulasi penerbangan (Canvas)
│   ├── halloffame.js   # Pengurusan rekod markah tertinggi menerusi LocalStorage
│   └── main.js         # Pengendali aliran navigasi skrin utama dan sistem audio
│
├── assets/             # Ruang penyimpanan fail media luaran
└── README.md           # Dokumentasi teknikal projek permainan