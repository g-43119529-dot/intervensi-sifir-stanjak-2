/**
 * Konfigurasi Global & Tetapan Data Permainan
 */// Konfigurasi Global Permainan
window.GAME = window.GAME || {};
window.GAME.student = {
    id: null,
    nama: null,
    kelas: null
};

// Tetapan parameter asas
const CONFIG = {
    attempts: 3,
    timeLimit: 30,
    scorePerCorrect: 10
};

// ==========================================================
// INTEGRASI GOOGLE APPS SCRIPT API (MUKTAMAD)
// ==========================================================
// Sila masukkan URL Web App Google Apps Script anda yang sebenar di bawah ini!
window.API_URL = "https://script.google.com/macros/s/AKfycbxKgvFEyPNGSfFIu20D03odSXRxUrr-jC9-g2xJnieAYLbBqZUiz9WCU6PQO-PqAgR40w/exec";


// Sistem Peringkat Kuiz Sifir
const levels = {
  1: { name: 'Akademi Sifir Asas', emoji: '🏝️', tables: [0, 1, 2], showHelp: false },
  2: { name: 'Akademi Sifir Sederhana', emoji: '🏔️', tables: [3, 5, 9], showHelp: true },
  3: { name: 'Akademi Sifir Master', emoji: '🚀', tables: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], showHelp: false }
};

// Bank Soalan Mencabar untuk Level 3
const hardQuestions = [
  [3, 4], [3, 6], [3, 7], [3, 8],
  [4, 3], [4, 4], [4, 6], [4, 7], [4, 8],
  [6, 6], [6, 7], [6, 8],
  [7, 7], [7, 8],
  [8, 8]
];

// Parameter Enjin Pergerakan Mini Game mengikut Tahap
const mgParams = {
  1: { enemySpeed: 2, enemySpawn: 1.2, bulletLevel: 1, duration: 35, label: 'LEVEL 1' },
  2: { enemySpeed: 3, enemySpawn: 0.8, bulletLevel: 2, duration: 40, label: 'LEVEL 2' },
  3: { enemySpeed: 4, enemySpawn: 0.5, bulletLevel: 3, duration: 45, label: 'LEVEL 3' }
};

// Pengurusan Global State Penting Aplikasi
let currentLevel = 1;
let questions = [];
let currentQ = 0;
let score = 0;
let totalScore = 0;
let attempts = 0;
let timer = null;
let timeLeft = 30;
let soundOn = true;
let audioCtx = null;
let gameLoop = null;
let gamePaused = false;
let gameRunning = false;
let gameAbort = null;