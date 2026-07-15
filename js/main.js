// =========================================================================
// AUDIO UNLOCK GUARD (PENGAMAN PEMBUKA SEKATAN AUDIO)
// =========================================================================
if (typeof window.bukaSekatanAudio !== 'function') {
    window.bukaSekatanAudio = function() {
        console.log("[Audio Guard]: Fungsi membuka sekatan audio dicetuskan.");
        
        // Cipta audio context dummy untuk melepaskan sekatan browser secara automatik
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const tempCtx = new AudioContext();
                if (tempCtx.state === 'suspended') {
                    tempCtx.resume();
                }
            }
            window.isSoundEnabled = true; // Benarkan bunyi dimainkan
            console.log("[Audio Guard]: Sekatan audio browser berjaya dibuka!");
        } catch (e) {
            console.warn("[Audio Guard Warning]: Gagal membuka sekatan audio.", e);
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi sistem log masuk terlebih dahulu
    if (typeof window.initLogin === "function") {
        window.initLogin();
    } else {
        console.error("Ralat: Kegagalan memuatkan modul LoginManager.");
    }
    
    // Lucide Icons Render jika ada
    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
    
    // Auto-unlock audio pada interaksi pertama murid di skrin
    const unlockAudio = () => {
        window.bukaSekatanAudio();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
});

/**
 * Fungsi universal menukar paparan skrin
 */
function showScreen(screenId) {
    const screens = ['login-screen', 'start-screen', 'quiz-screen', 'minigame-screen', 'boss-screen', 'fame-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
}

// Pastikan fungsi showScreen tersedia secara global
window.showScreen = showScreen;

// =========================================================================
// PENGURUS EVENT UTAMA & PENGENDALI ONCLICK GLOBAL
// =========================================================================

// Dipanggil apabila log masuk berjaya dari login.js
window.tukarKeMenuUtama = function() {
    console.log("[Auth Engine]: Log masuk sukses. Beralih ke skrin utama.");
    // Buka sekatan audio sekali lagi untuk memastikan keselamatan bunyi diaktifkan
    window.bukaSekatanAudio();
    showScreen('start-screen');
    
    // KEMAS KINI: Panggil fungsi pemaparan Hall of Fame pada Start Screen secara automatik
    window.paparLeaderboardDiStartScreen();
};

// Dipanggil apabila butang "Mula Bermain" diklik dari start-screen
window.startGame = function() {
    window.playSound('click'); // Memainkan bunyi klik
    console.log("[Game Engine]: Memulakan sesi permainan baharu.");
    
    // 1. SET DEFAULT LEVEL: Paksa sistem bermula dari Level 1 (Senang/Mudah)
    window.currentLevel = 1;
    if (window.QuizManager) {
        window.QuizManager.currentLevel = 1;
        window.QuizManager.isPlaying = true; // KEMAS KINI: Aktifkan bendera QuizManager bermula
    }

    // 2. RESET MARKAH: Kosongkan semua takungan markah kuiz & minigame menjadi 0
    if (typeof window.score !== "undefined") window.score = 0;
    if (typeof window.currentScore !== "undefined") window.currentScore = 0;
    
    if (window.GAME && window.GAME.session) {
        window.GAME.session.jumlahMarkahKuiz = 0;
        window.GAME.session.score = 0;
        window.GAME.session.jumlahJawapanBetul = 0;
        window.GAME.session.jumlahSoalanDijawab = 0;
        window.GAME.session.jumlahMarkah = 0;      // Reset markah minigame
        window.GAME.session.levelTertinggi = 1;    // Rekod tahap mula semula dari 1
        
        // KEMAS KINI: Simpan timestamp permulaan permainan (milisaat)
        window.GAME.session.waktuMula = Date.now(); 
    }
    
    console.log("[Game Engine]: Markah telah direset ke 0. Tahap ditetapkan ke Level 1.");

    // 3. NAVIGASI: Tukar paparan secara visual ke skrin kuiz
    showScreen('quiz-screen');

    // 4. JALANKAN KUIZ: Mulakan penjanaan soalan Level 1 daripada js/quiz.js
    if (window.QuizManager && typeof window.QuizManager.startQuiz === 'function') {
        window.QuizManager.startQuiz();
    } else if (typeof window.startQuiz === 'function') {
        window.startQuiz();
    }
};

// Dipanggil apabila butang "Hall of Fame" diklik dari menu utama
window.showHallOfFame = function() {
    console.log("[Fame Engine]: Membuka skrin Leaderboard secara automatik.");
    
    // 1. Tukar skrin visual terus ke fame-screen
    showScreen('fame-screen');
    
    // 2. Terus panggil fungsi jana data leaderboard dari Google Sheets
    if (typeof window.paparLeaderboardVisual === 'function') {
        window.paparLeaderboardVisual();
    }
};

// Dipanggil apabila butang "Log Keluar" di menu utama diklik
window.logoutKeLogin = function() {
    console.log("[Auth Engine]: Murid log keluar. Kembali ke skrin log masuk.");
    if (window.GAME) window.GAME.session = null;
    showScreen('login-screen');
};

// Dipanggil apabila butang "Keluar" diklik semasa kuiz/minigame berjalan
window.exitToStart = async function() {
    const fameScreenEl = document.getElementById('fame-screen');
    const isAtFameScreen = fameScreenEl && !fameScreenEl.classList.contains('hidden');

    if (isAtFameScreen) {
        console.log("[Exit Engine]: Meninggalkan Hall of Fame. Terus beralih ke skrin log masuk.");
        if (window.GAME) window.GAME.session = null; 
        showScreen('login-screen');
        return; 
    }

    console.log("[Exit Engine]: Menekan butang keluar kuiz/minigame.");

    // Hentikan sementara pemasa kuiz/minigame sewaktu dialog `confirm` dibuka
    if (window.QuizManager && typeof window.QuizManager.stopTimer === 'function') {
        window.QuizManager.stopTimer();
    }
    if (window.timer) {
        clearInterval(window.timer);
    }
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
    }

    const sahkanKeluar = confirm("Anda pasti mahu berhenti menjawab kuiz ini?");
    
    if (sahkanKeluar) {
        // KEMAS KINI MUTLAK: Matikan isPlaying dengan serta-merta sejurus disahkan keluar
        if (window.QuizManager) {
            window.QuizManager.isPlaying = false;
        }

        let markahTahapSemasa = 0;
        
        if (window.QuizManager) {
            if (typeof window.QuizManager.score !== "undefined") markahTahapSemasa = window.QuizManager.score;
            else if (typeof window.QuizManager.currentScore !== "undefined") markahTahapSemasa = window.QuizManager.currentScore;
        }
        
        if (markahTahapSemasa === 0) {
            if (typeof window.score !== "undefined") markahTahapSemasa = window.score;
            else if (typeof window.currentScore !== "undefined") markahTahapSemasa = window.currentScore;
        }
        
        const scoreEl = document.getElementById('score-display');
        if (scoreEl && scoreEl.innerText) {
            const match = scoreEl.innerText.match(/Markah:\s*(\d+)/i) || scoreEl.innerText.match(/\d+/);
            if (match) {
                markahTahapSemasa = parseInt(match[1] || match[0]);
            }
        }
        
        let tahapSemasa = 1;
        if (window.QuizManager && typeof window.QuizManager.currentLevel !== "undefined") {
            tahapSemasa = parseInt(window.QuizManager.currentLevel) || 1;
        } else if (typeof window.currentLevel !== "undefined") {
            tahapSemasa = parseInt(window.currentLevel) || 1;
        }

        let markahSebenar = markahTahapSemasa;
        if (tahapSemasa === 2) {
            markahSebenar = 10 + markahTahapSemasa; 
        } else if (tahapSemasa === 3) {
            markahSebenar = 20 + markahTahapSemasa; 
        }
        
        alert(`Terima kasih kerana menyertai kuiz ini. Markah anda ialah ${markahSebenar}. Jumpa lagi!`);
        
        if (window.GAME && window.GAME.session) {
            window.GAME.session.jumlahMarkahKuiz = markahSebenar;
            window.GAME.session.score = markahSebenar;
            window.GAME.session.levelTertinggi = tahapSemasa;
            
            // Sertakan parameter markah & tahap dinamik ke fungsi penghantaran data
            if (typeof window.hantarDataKeGoogleSheets === 'function') {
                await window.hantarDataKeGoogleSheets(markahSebenar, tahapSemasa);
            }
        }
        
        // Bersihkan sesi secara menyeluruh
        if (window.GAME) window.GAME.session = null;
        if (typeof window.cleanupGame === 'function') window.cleanupGame(); // Bersihkan sebarang pemasa tertinggal
        
        showScreen('login-screen');
    } else {
        console.log("[Exit Engine]: Murid membatalkan proses keluar. Menyambung kuiz...");
        if (window.QuizManager) {
            window.QuizManager.isPlaying = true; // Aktifkan semula status main jika batal keluar
            
            // Hidupkan semula paparan soalan semasa bagi mencetuskan pemasa baru dengan betul
            if (typeof window.showQuestion === 'function') {
                window.showQuestion();
            } else if (typeof window.QuizManager.startTimer === 'function') {
                window.QuizManager.startTimer();
            }
        }
    }
};

// =========================================================================
// ENJIN INTEGRASI GOOGLE SHEETS & VISUAL LEADERBOARD (DINAMIK & BEBAS RALAT)
// =========================================================================

window.hantarDataKeGoogleSheets = async function(skorDinamik = 0, levelDinamik = 1) {
    console.log("[Sheets Engine]: Mencuba menghantar data sesi ke Google Sheets...");
    
    const scriptUrl = window.API_URL || window.SCRIPT_URL || window.BASE_URL || (window.CONFIG && window.CONFIG.url);
    
    if (!scriptUrl || scriptUrl === "" || scriptUrl.includes("URL_ANDA_DI_SINI")) {
        console.warn("[Sheets Engine Warning]: URL Apps Script tidak dikonfigurasi.");
        return { success: false, message: "URL tidak diatur." }; 
    }

    try {
        const muridId = (window.GAME && window.GAME.student && window.GAME.student.id) || "TIADA_ID";
        const muridNama = (window.GAME && window.GAME.student && window.GAME.student.nama) || "Murid Sifir";
        
        let masaMengjawab = 0;
        if (window.GAME && window.GAME.session && window.GAME.session.waktuMula) {
            // Hitung beza masa tamat dengan waktu mula permainan dalam unit saat
            masaMengjawab = Math.floor((Date.now() - window.GAME.session.waktuMula) / 1000);
        }

        // KEMAS KINI MUTLAK: Menggunakan nilai dinamik sebenar hasil dari permainan
        const payload = {
            action: "saveScore",
            tarikh: new Date().toLocaleDateString('ms-MY'), 
            idMurid: muridId,                               
            nama: muridNama,                               
            skor: skorDinamik,                             
            level: levelDinamik,                           
            miniGame: masaMengjawab                        
        };

        await fetch(scriptUrl, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log(`[Sheets Engine]: Rekod kejayaan ${muridNama} dihantar ke cloud database.`);
        return { success: true };

    } catch (error) {
        console.error("[Sheets Engine Error]: Gagal menghantar rekod.", error);
        return { success: false, error: error.toString() };
    }
};

window.paparLeaderboardVisual = async function() {
    const fameListEl = document.getElementById('fame-list');
    if (!fameListEl) return;

    fameListEl.innerHTML = '<p class="text-cyan-300 text-xs text-center animate-pulse py-4">🛰️ Menghubungi satelit data Hall of Fame...</p>';

    try {
        const scriptUrl = window.API_URL || (window.API && window.API.url) || window.SCRIPT_URL;
        if (!scriptUrl) throw new Error("URL API tidak dikonfigurasi.");

        const response = await fetch(`${scriptUrl}?action=getLeaderboard`);
        const data = await response.json();

        if (!data || data.length === 0) {
            fameListEl.innerHTML = '<p class="text-white/60 text-xs text-center py-4">Belum ada rekod tamat misi. Jadi yang pertama! 🚀</p>';
            return;
        }

        let htmlContent = '';
        data.forEach((row, index) => {
            let pingat = `${index + 1}.`;
            if (index === 0) pingat = '🥇';
            if (index === 1) pingat = '🥈';
            if (index === 2) pingat = '🥉';

            let minit = Math.floor((row.jumlahMasa || row.miniGame || 0) / 60);
            let saat = Math.floor((row.jumlahMasa || row.miniGame || 0) % 60);
            let paparanMasa = `${minit}m ${saat}s`;

            htmlContent += `
                <div class="flex justify-between items-center border-b border-cyan-500/10 py-2 text-sm text-white hover:bg-cyan-950/20 px-2 rounded transition-all">
                    <div class="flex items-center gap-3">
                        <span class="text-lg w-6 text-center font-bold">${pingat}</span>
                        <div>
                            <div class="font-bold text-cyan-200 uppercase text-xs md:text-sm">${row.nama}</div>
                            <div class="text-[9px] text-white/40 font-mono">${row.tarikh}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-black text-cyan-400">⭐ ${row.skor} Pts</div>
                        <div class="text-[10px] text-emerald-400 font-mono font-bold">⏱️ ${paparanMasa}</div>
                    </div>
                </div>
            `;
        });

        fameListEl.innerHTML = htmlContent;

    } catch (err) {
        fameListEl.innerHTML = '<p class="text-red-400 text-xs text-center py-4">❌ Gagal memuatkan rekod Hall of Fame.</p>';
    }
};

// =========================================================================
// KEMAS KINI NEW: JANA LEADERBOARD PADA SKRIN START (TOP 5)
// =========================================================================
window.paparLeaderboardDiStartScreen = async function() {
    const startFameList = document.getElementById('start-fame-list');
    if (!startFameList) return;

    startFameList.innerHTML = '<div class="text-xs text-cyan-300 text-center animate-pulse py-4">🛰️ Menyelaras Kedudukan Top 5...</div>';

    try {
        const scriptUrl = window.API_URL || (window.API && window.API.url) || window.SCRIPT_URL;
        if (!scriptUrl) throw new Error("URL API tidak ditemui.");

        const response = await fetch(`${scriptUrl}?action=getLeaderboard`);
        const data = await response.json();

        if (!data || data.length === 0) {
            startFameList.innerHTML = '<div class="text-xs text-white/50 text-center py-4">Belum ada rekod. Jadi pencipta sejarah pertama! 🏆</div>';
            return;
        }

        const top5 = data.slice(0, 5);
        let htmlContent = '';

        top5.forEach((row, index) => {
            let pingat = '🛸';
            let temaWarna = 'border-slate-800/40 bg-slate-950/40';
            let warnaSkor = 'text-cyan-300';

            if (index === 0) {
                pingat = '🥇';
                temaWarna = 'border-amber-500/40 bg-amber-950/20';
                warnaSkor = 'text-amber-400 font-black';
            } else if (index === 1) {
                pingat = '🥈';
                temaWarna = 'border-slate-400/40 bg-slate-800/30';
                warnaSkor = 'text-slate-300 font-bold';
            } else if (index === 2) {
                pingat = '🥉';
                temaWarna = 'border-amber-700/40 bg-orange-950/20';
                warnaSkor = 'text-amber-600 font-bold';
            }

            let minit = Math.floor((row.jumlahMasa || row.miniGame || 0) / 60);
            let saat = Math.floor((row.jumlahMasa || row.miniGame || 0) % 60);
            let paparanMasa = `${minit}m ${saat}s`;

            htmlContent += `
                <div class="flex items-center justify-between p-2.5 rounded-xl border ${temaWarna} transition-all hover:scale-[1.01]">
                    <div class="flex items-center gap-3">
                        <span class="text-base">${pingat}</span>
                        <div>
                            <div class="text-xs md:text-sm font-bold text-white tracking-wide uppercase">${row.nama}</div>
                            <div class="text-[10px] text-white/40 font-mono">Masa: ${paparanMasa}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-mono ${warnaSkor}">${row.skor} Pts</span>
                    </div>
                </div>
            `;
        });

        startFameList.innerHTML = htmlContent;

    } catch (err) {
        console.warn("[Start Screen Leaderboard Error]: Gagal memuatkan.", err);
        startFameList.innerHTML = '<div class="text-xs text-red-400 text-center py-4">❌ Offline. Gagal menyinkronkan papan pendahulu.</div>';
    }
};

// =========================================================================
// FUNGSI NAVIGASI TAMBAHAN & UTILITI UI
// =========================================================================

/**
 * Fungsi untuk melihat / menyembunyikan kata laluan pada skrin log masuk
 */
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('login-password-input');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClose = document.getElementById('eye-icon-close');
    
    if (!passwordInput) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (eyeIconOpen) eyeIconOpen.classList.add('hidden');
        if (eyeIconClose) eyeIconClose.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        if (eyeIconOpen) eyeIconOpen.classList.remove('hidden');
        if (eyeIconClose) eyeIconClose.classList.add('hidden');
    }
};

// =========================================================================
// ENJIN PENGURUS AUDIO (REVOLUSI AUDIO SINTETIK - BEBAS RALAT & CODES)
// =========================================================================

window.isSoundEnabled = true;

window.playSound = function(soundName) {
    if (!window.isSoundEnabled) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        const t = ctx.currentTime;

        if (soundName === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } 
        else if (soundName === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, t); 
            osc.frequency.setValueAtTime(659.25, t + 0.1); 
            osc.frequency.setValueAtTime(783.99, t + 0.2); 
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
        } 
        else if (soundName === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(70, t + 0.3);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        } 
        else if (soundName === 'countdown') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t); 
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
            osc.start(t);
            osc.stop(t + 0.08);
        } 
        else if (soundName === 'gameover') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.setValueAtTime(220, t + 0.2);
            osc.frequency.setValueAtTime(150, t + 0.4);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.6);
            osc.start(t);
            osc.stop(t + 0.6);
        }
        else if (soundName === 'laser') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
        }
        else if (soundName === 'explosion') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.linearRampToValueAtTime(10, t + 0.4);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
        }
        else if (soundName === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, t);
            osc.frequency.setValueAtTime(440, t + 0.08);
            osc.frequency.setValueAtTime(660, t + 0.16);
            osc.frequency.setValueAtTime(880, t + 0.24);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
            osc.start(t);
            osc.stop(t + 0.35);
        }

    } catch (e) {
        console.warn("[Audio Engine Warning]: Gagal menjana bunyi sintetik.", e);
    }
};

/**
 * Fungsi On/Off Bunyi (Dipanggil oleh butang 🔊 di index.html)
 */
window.toggleSound = function() {
    const btn = document.getElementById('sound-toggle');
    window.isSoundEnabled = !window.isSoundEnabled;
    
    if (window.isSoundEnabled) {
        if (btn) btn.innerText = "🔊";
        console.log("[Audio Engine]: Bunyi diaktifkan.");
    } else {
        if (btn) btn.innerText = "🔇";
        console.log("[Audio Engine]: Bunyi disenyapkan.");
    }
};
