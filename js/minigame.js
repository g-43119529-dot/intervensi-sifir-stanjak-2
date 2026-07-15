/**
 * Engine Utama Modul Penerbangan Mini-Game (Canvas Engine)
 */

// =========================================================================
// ANTI-CRASH AUDIO GUARD & PENYAMBUNG ENJIN UTAMA
// =========================================================================
function safeAudioCall(soundFunc, fallbackLog) {
    if (typeof window[soundFunc] === 'function') {
        window[soundFunc]();
    } else {
        if (typeof window.safeCall === 'function') {
            window.safeCall(soundFunc);
        } else {
            console.log(`[Audio Guard]: ${fallbackLog}`);
        }
    }
}

// Daftarkan fungsi audio minigame ke skop global agar tidak 'Not Defined'
// Kod di bawah dihubungkan terus ke enjin bunyi sintetik retro di main.js!
window.playShoot = function() { 
    if (typeof window.playSound === 'function') {
        window.playSound('laser'); // Mainkan bunyi laser peiuw!
    } else {
        safeAudioCall('audioShoot', 'Tembakan dilepaskan (tanpa bunyi).'); 
    }
};

window.playExplosion = function() { 
    if (typeof window.playSound === 'function') {
        window.playSound('explosion'); // Mainkan bunyi letupan meteor berderu!
    } else {
        safeAudioCall('audioExplosion', 'Musuh meletup (tanpa bunyi).'); 
    }
};

window.playHit = function() { 
    if (typeof window.playSound === 'function') {
        window.playSound('wrong'); // Mainkan bunyi kapal dilanggar (bengis retro)
    } else {
        safeAudioCall('audioHit', 'Kapal dilanggar (tanpa bunyi).'); 
    }
};

window.playCoin = function() { 
    if (typeof window.playSound === 'function') {
        window.playSound('correct'); // Mainkan bunyi syiling dipungut (ching!)
    } else {
        safeAudioCall('audioCoin', 'Syiling dipungut (tanpa bunyi).'); 
    }
};

window.playPowerUp = function() { 
    if (typeof window.playSound === 'function') {
        window.playSound('powerup'); // Mainkan bunyi power-up naik ke atas gembira!
    } else {
        safeAudioCall('audioPowerUp', 'Power-up diaktifkan (tanpa bunyi).'); 
    }
};

// =========================================================================
// DEKLARASI PEMBOLEHUBAH SKOP FAIL & KAWALAN ENGINE (DIBAIKI UNTUK WINDOW SCOPE)
// =========================================================================
if (typeof window.gameRunning === 'undefined') window.gameRunning = false;
if (typeof window.gamePaused === 'undefined') window.gamePaused = false;
if (typeof window.gameAbort === 'undefined') window.gameAbort = null;
if (typeof window.gameLoop === 'undefined') window.gameLoop = null;
let lastFrameTime = 0; // Kekal sebagai pembolehubah lokal pembilang bingkai masa

// Daftarkan fungsi pembersihan khusus minigame ke window
window.cleanupMiniGame = function() {
    window.gameRunning = false;
    if (window.gameLoop) {
        cancelAnimationFrame(window.gameLoop);
        window.gameLoop = null;
    }
    if (window.gameAbort) {
        window.gameAbort.abort();
        window.gameAbort = null;
    }
    console.log("[Minigame Engine]: Kitaran animasi & event listeners dibersihkan sepenuhnya.");
};

// =========================================================================
// FUNGSI UTAMA PERMULAAN MINIGAME 
// =========================================================================
window.executeMiniGameEngine = function(lvl) {
  console.log(`[Minigame Engine]: Memulakan Flight Mission untuk Tahap ${lvl}`);
  
  if (typeof window.cleanupGame === 'function') window.cleanupGame(); 
  if (typeof showScreen === 'function') showScreen('minigame-screen');
  
  window.gameRunning = true; 
  window.gamePaused = false; 
  window.gameAbort = new AbortController();
  
  const signal = window.gameAbort.signal;
  const canvas = document.getElementById('game-canvas');
  
  function resize() { 
    const w = Math.min(window.innerWidth - 32, 420);
    const h = Math.min(window.innerHeight - 80, 650); 
    canvas.width = w; 
    canvas.height = h; 
    canvas.style.width = w + 'px'; 
    canvas.style.height = h + 'px'; 
  }
  
  resize();
  window.addEventListener('resize', resize, { signal });

  // PENGAMAN KAWALAN PARAMETER
  let activeParams = { enemySpeed: 3, enemySpawn: 1.2, bulletLevel: 1, duration: 20, label: "Flight Mission" };
  if (typeof mgParams !== 'undefined' && mgParams[lvl]) {
      activeParams = mgParams[lvl];
  } else if (window.mgParams && window.mgParams[lvl]) {
      activeParams = window.mgParams[lvl];
  } else {
      console.warn(`[Minigame Warning]: Data mgParams[${lvl}] tidak ditemui. Menggunakan konfigurasi asas kecemasan.`);
  }
  
  runMiniGame(canvas, signal, activeParams, lvl);
};

// Daftarkan startMiniGame asal sebagai alias kepada pemacu selamat baharu
window.startMiniGame = window.executeMiniGameEngine;

function runMiniGame(canvas, signal, params, lvl) {
  const ctx = canvas.getContext('2d');
  const { enemySpeed, enemySpawn, bulletLevel, duration, label } = params;
  
  let elapsed = 0, gScore = 0, lives = 3;
  let player = { x: canvas.width / 2 - 18, y: canvas.height - 60, w: 36, h: 36 };
  let bullets = [], enemies = [], coins = [], powerups = [], explosions = [], bgStars = [];
  let keys = {}, lastShot = 0, spawnT = 0, puT = 0;
  let touchX = player.x, useTouch = false, dragging = false;
  
  let enemyDestroyedCount = 0, coinsCollectedCount = 0, powerupsCollectedCount = 0;

  let shield = false, shieldTime = 0;
  let rapidFire = false, rapidTime = 0;
  let slowMo = false, slowTime = 0;
  let magnetActive = false, magnetTime = 0;
  let invincible = false, invTime = 0;

  for (let i = 0; i < 40; i++) {
    bgStars.push({
      x: Math.random() * canvas.width, 
      y: Math.random() * canvas.height, 
      speed: 1 + Math.random() * 2, 
      size: 1 + Math.random() * 2
    });
  }

  document.addEventListener('keydown', e => {
    if (!window.gamePaused) keys[e.key] = true; 
    if (e.key === 'p' || e.key === 'P') {
        if (typeof togglePause === 'function') togglePause();
        else window.gamePaused = !window.gamePaused;
    }
  }, { signal });
  
  document.addEventListener('keyup', e => { keys[e.key] = false; }, { signal });
  
  canvas.addEventListener('touchstart', e => {
    e.preventDefault(); useTouch = true; dragging = true; 
    const r = canvas.getBoundingClientRect(); 
    touchX = e.touches[0].clientX - r.left - player.w / 2;
  }, { passive: false, signal });
  
  canvas.addEventListener('touchmove', e => {
    e.preventDefault(); 
    if (dragging) { 
      const r = canvas.getBoundingClientRect(); 
      touchX = e.touches[0].clientX - r.left - player.w / 2; 
    }
  }, { passive: false, signal });
  
  canvas.addEventListener('touchend', () => { dragging = false; }, { signal });
  
  canvas.addEventListener('mousedown', e => {
    if (!useTouch) { dragging = true; touchX = e.offsetX - player.w / 2; }
  }, { signal });
  
  canvas.addEventListener('mousemove', e => {
    if (!useTouch && dragging) { touchX = e.offsetX - player.w / 2; }
  }, { signal });
  
  canvas.addEventListener('mouseup', () => { dragging = false; }, { signal });

  function spawnEnemy() {
    const W = canvas.width;
    const types = ['straight', 'zigzag', 'diagonal-l', 'diagonal-r', 'fast'];
    const type = types[Math.floor(Math.random() * types.length)];
    const spd = enemySpeed * (type === 'fast' ? 1.8 : 1) * (slowMo ? 0.5 : 1);
    enemies.push({ x: Math.random() * (W - 24), y: -30, w: 24, h: 24, speed: spd, type, t: 0, startX: Math.random() * (W - 24) });
  }

  function update(dt) {
    if (!window.gameRunning) return;

    const W = canvas.width, H = canvas.height;
    elapsed += dt; spawnT += dt; puT += dt;
    
    // =========================================================================
    // BLOK TRANSIFI UTAMA: APABILA WAKTU TAMAT ATAU KAPAL MUSNAH (PILIHAN 2)
    // =========================================================================
    if (elapsed >= duration || lives <= 0) { 
      window.gameRunning = false;
      window.cleanupMiniGame();
      
      onFlightMissionEnd({
         enemyDestroyed: enemyDestroyedCount,
         coinsCollected: coinsCollectedCount,
         powerupsCollected: powerupsCollectedCount,
         score: gScore,
         currentLevel: lvl
      });

      console.log(`[Flight Mission Selesai]: Tahap Semasa ialah ${lvl}. Berpindah ke Tahap Seterusnya.`);

      // PENGURUSAN ALIRAN TAHAP PERMAINAN (DIPERBAIKI SECARA TERATUR)
      if (lvl === 1) {
        window.currentLevel = 2; // Naikkan ke Tahap Sederhana secara global
        const msg = lives > 0 ? 'Tahniah! Bersiap sedia untuk Kuiz Tahap Sederhana!' : 'Kapal anda musnah! Namun kelayakan kuiz membawa anda ke Tahap Sederhana.';
        const emoji = lives > 0 ? '🚀' : '💥';

        if (typeof window.showTransition === 'function') {
           window.showTransition(emoji, 'Akademi Sifir Sederhana', msg, 2500, () => {
              if (typeof window.startQuiz === 'function') window.startQuiz();
           });
        } else {
           if (typeof window.startQuiz === 'function') window.startQuiz();
        }
      } 
      else if (lvl === 2) {
        window.currentLevel = 3; // Naikkan ke Tahap Sukar secara global
        const msg = lives > 0 ? 'Hebat! Bersiap sedia untuk Kuiz Peringkat Sukar!' : 'Kapal terhempas! Sila bersedia untuk cabaran terakhir: Kuiz Peringkat Sukar.';
        const emoji = lives > 0 ? '🔥' : '💥';

        if (typeof window.showTransition === 'function') {
           window.showTransition(emoji, 'Akademi Sifir Master (Sukar)', msg, 2500, () => {
              if (typeof window.startQuiz === 'function') window.startQuiz();
           });
        } else {
           if (typeof window.startQuiz === 'function') window.startQuiz();
        }
      } 
      else if (lvl === 3) {
        // PERTAMA & PALING KRITIKAL: Matikan loop animasi serta-merta untuk elak crash!
        window.gameRunning = false;
        if (typeof window.cleanupMiniGame === 'function') {
             window.cleanupMiniGame();
        }

        console.log("[Minigame Engine]: Pengembaraan selesai. Mengira masa tindak balas keseluruhan...");
        
        // 1. PENGIRAAN MASA KESELURUHAN (SAAT)
        let jumlahMasaSaat = 0;
        if (window.GAME && window.GAME.session && window.GAME.session.waktuMula) {
            jumlahMasaSaat = Math.floor((Date.now() - window.GAME.session.waktuMula) / 1000);
        } else {
            jumlahMasaSaat = 120; 
        }

        // 2. SINTESIS DATA MUKTAMAD KE SESI (PASTIKAN 30 MATA)
        if (window.GAME && window.GAME.session) {
            window.GAME.session.jumlahMarkahKuiz = 30; 
            window.GAME.session.score = 30;            
            window.GAME.session.levelTertinggi = 3;
            window.GAME.session.duration = jumlahMasaSaat;
        }
        
        if (window.QuizManager) { window.QuizManager.score = 30; window.QuizManager.currentScore = 30; }
        window.score = 30; window.currentScore = 30;
        
        // 3. HANTAR DATA KE GOOGLE SHEETS (DENGAN PERTAHANAN REKORD)
        if (typeof window.hantarDataKeGoogleSheets === 'function') {
            // Jalankan secara asynchronous tanpa menyekat UI transisi
            window.hantarDataKeGoogleSheets().catch(err => console.error("[Sheets Async Error]:", err));
        }
        
        // 4. PAPARAN TRANSIFI MENANG & REDIRECT KE HALL OF FAME
        const min = Math.floor(jumlahMasaSaat / 60);
        const saat = Math.floor(jumlahMasaSaat % 60);
        const teksMasa = min > 0 ? `${min} minit ${saat} saat` : `${saat} saat`;

        if (typeof window.showTransition === 'function') {
            window.showTransition(
                '👑',
                'MISI TAMAT!',
                `Tahniah! Anda berjaya menamatkan seluruh pengembaraan dalam masa ${teksMasa}! Rekod anda telah dihantar ke Hall of Fame.`,
                4000,
                function() {
                    if (typeof showScreen === 'function') {
                        showScreen('fame-screen');
                        if (typeof window.paparLeaderboardVisual === 'function') window.paparLeaderboardVisual();
                    } else {
                        location.reload(); 
                    }
                }
            );
        } else {
            alert(`🏆 MISI TAMAT!\n\nTahniah! Anda menamatkan kuiz dalam masa ${teksMasa}. Membuka Hall of Fame...`);
            if (typeof showScreen === 'function') {
                showScreen('fame-screen');
                if (typeof window.paparLeaderboardVisual === 'function') window.paparLeaderboardVisual();
            } else location.reload();
        }
        return; // Keluar terus dari sub-fungsi update
      }
      return;
    }

    const moveSpd = 6;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= moveSpd;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += moveSpd;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= moveSpd;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += moveSpd;

    if (useTouch || dragging) player.x += (touchX - player.x) * 0.15;

    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    const shootInterval = rapidFire ? 0.08 : 0.15;
    lastShot += dt;
    if (lastShot >= shootInterval) {
      lastShot = 0; 
      window.playShoot(); // AKAN MEMBUNYIKAN LASER RETRO SINTETIK
      const cx = player.x + player.w / 2;
      if (bulletLevel === 1) bullets.push({ x: cx - 2, y: player.y, w: 4, h: 12 });
      else if (bulletLevel === 2) { 
        bullets.push({ x: cx - 6, y: player.y, w: 4, h: 12 }); 
        bullets.push({ x: cx + 2, y: player.y, w: 4, h: 12 }); 
      } else { 
        bullets.push({ x: cx - 2, y: player.y - 4, w: 4, h: 14 }); 
        bullets.push({ x: cx - 10, y: player.y + 4, w: 4, h: 10 }); 
        bullets.push({ x: cx + 6, y: player.y + 4, w: 4, h: 10 }); 
      }
    }

    if (spawnT >= enemySpawn) { spawnT = 0; spawnEnemy(); }

    if (puT >= 6) { 
      puT = 0; 
      const types = ['shield', 'rapid', 'bomb', 'magnet', 'slow']; 
      powerups.push({ x: Math.random() * (W - 20), y: -20, type: types[Math.floor(Math.random() * types.length)], speed: 1.5 }); 
    }

    bullets.forEach(b => b.y -= 10);
    bullets = bullets.filter(b => b.y > -20);

    const sm = slowMo ? 0.5 : 1;
    enemies.forEach(e => {
      e.t += dt;
      if (e.type === 'straight') e.y += e.speed * sm;
      else if (e.type === 'zigzag') { e.y += e.speed * sm; e.x = e.startX + Math.sin(e.t * 4) * 40; }
      else if (e.type === 'diagonal-l') { e.y += e.speed * sm; e.x -= 1.5 * sm; }
      else if (e.type === 'diagonal-r') { e.y += e.speed * sm; e.x += 1.5 * sm; }
      else if (e.type === 'fast') e.y += e.speed * sm;
    });

    bullets = bullets.filter(b => {
      let hit = false;
      enemies = enemies.filter(e => {
        if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          hit = true; gScore += 10; enemyDestroyedCount++;
          window.playExplosion(); // AKAN MEMBUNYIKAN LETUPAN RETRO SINTETIK
          explosions.push({ x: e.x, y: e.y, t: 0, maxT: 0.4 });
          if (Math.random() < 0.3) coins.push({ x: e.x + 6, y: e.y, speed: 2.5 * sm });
          return false;
        } return true;
      });
      return !hit;
    });

    if (!invincible) {
      enemies = enemies.filter(e => {
        if (e.x < player.x + player.w && e.x + e.w > player.x && e.y < player.y + player.h && e.y + e.h > player.y) {
          if (shield) { shield = false; shieldTime = 0; explosions.push({ x: e.x, y: e.y, t: 0, maxT: 0.3 }); return false; }
          lives--; 
          window.playHit(); // AKAN MEMBUNYIKAN BUNYI KELALAHAN/HAMPIR MATI RETRO SINTETIK
          invincible = true; invTime = 1.5;
          explosions.push({ x: e.x, y: e.y, t: 0, maxT: 0.3 }); return false;
        } return true;
      });
    }

    coins.forEach(c => c.y += c.speed * (slowMo ? 0.5 : 1));
    if (magnetActive) {
      coins.forEach(c => { 
        const dx = player.x + player.w / 2 - c.x, dy = player.y - c.y; 
        const d = Math.sqrt(dx * dx + dy * dy); 
        if (d < 150) { c.x += dx / d * 5; c.y += dy / d * 5; } 
      });
    }
    coins = coins.filter(c => {
      if (Math.abs(c.x - player.x) < 30 && Math.abs(c.y - player.y) < 30) { 
         gScore += 20; coinsCollectedCount++; 
         window.playCoin(); // AKAN MEMBUNYIKAN BUNYI SYILING CHING! SINTETIK
         return false; 
      }
      return c.y < H;
    });

    powerups.forEach(p => p.y += p.speed * (slowMo ? 0.5 : 1));
    powerups = powerups.filter(p => {
      if (Math.abs(p.x - player.x) < 30 && Math.abs(p.y - player.y) < 30) {
        window.playPowerUp(); // AKAN MEMBUNYIKAN BUNYI POWER-UP NAIK TAHAP SINTETIK
        powerupsCollectedCount++;
        if (p.type === 'shield') { shield = true; shieldTime = 8; }
        else if (p.type === 'rapid') { rapidFire = true; rapidTime = 6; }
        else if (p.type === 'slow') { slowMo = true; slowTime = 5; }
        else if (p.type === 'magnet') { magnetActive = true; magnetTime = 7; }
        else if (p.type === 'bomb') { 
          enemyDestroyedCount += enemies.length;
          enemies.forEach(e => explosions.push({ x: e.x, y: e.y, t: 0, maxT: 0.3 })); 
          gScore += enemies.length * 10; 
          enemies = []; 
        }
        return false;
      } return p.y < H;
    });

    if (shieldTime > 0) { shieldTime -= dt; if (shieldTime <= 0) shield = false; }
    if (rapidTime > 0) { rapidTime -= dt; if (rapidTime <= 0) rapidFire = false; }
    if (slowTime > 0) { slowTime -= dt; if (slowTime <= 0) slowMo = false; }
    if (magnetTime > 0) { magnetTime -= dt; if (magnetTime <= 0) magnetActive = false; }
    if (invTime > 0) { invTime -= dt; if (invTime <= 0) invincible = false; }

    explosions.forEach(ex => ex.t += dt);
    explosions = explosions.filter(ex => ex.t < ex.maxT);
    enemies = enemies.filter(e => e.y < H + 30 && e.x > -50 && e.x < W + 50);
    bgStars.forEach(s => { s.y += s.speed * (slowMo ? 0.5 : 1); if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });

    const timerEl = document.getElementById('game-timer');
    const scoreEl = document.getElementById('game-score-hud');
    const livesEl = document.getElementById('game-lives');
    const levelEl = document.getElementById('game-level-hud');
    
    if (timerEl) timerEl.textContent = '⏱' + Math.ceil(duration - elapsed) + 's';
    if (scoreEl) scoreEl.textContent = '⭐' + gScore;
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    if (levelEl) levelEl.textContent = label;
  }

  function draw() {
    if (!window.gameRunning) return;

    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#060d1a'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    bgStars.forEach(s => { ctx.globalAlpha = 0.4 + s.speed * 0.2; ctx.fillRect(s.x, s.y, s.size, s.size); });
    ctx.globalAlpha = 1;

    if (!invincible || Math.floor(elapsed * 10) % 2 === 0) {
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath(); ctx.moveTo(player.x + player.w / 2, player.y); ctx.lineTo(player.x, player.y + player.h); ctx.lineTo(player.x + player.w, player.y + player.h); ctx.fill();
      
      ctx.fillStyle = '#ffa500'; ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.beginPath(); ctx.moveTo(player.x + player.w / 2 - 5, player.y + player.h); ctx.lineTo(player.x + player.w / 2, player.y + player.h + 10 + Math.random() * 6); ctx.lineTo(player.x + player.w / 2 + 5, player.y + player.h); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (shield) { ctx.strokeStyle = '#00ff8888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 24, 0, Math.PI * 2); ctx.stroke(); }

    ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6;
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff4d4d';
    enemies.forEach(e => { ctx.fillRect(e.x, e.y, e.w, e.h); });

    ctx.fillStyle = '#ffcc00';
    coins.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill(); });

    powerups.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? '#00ff88' : p.type === 'rapid' ? '#ff33aa' : p.type === 'slow' ? '#0088ff' : p.type === 'magnet' ? '#aa33ff' : '#ff5500';
      ctx.fillRect(p.x, p.y, 16, 16);
    });

    explosions.forEach(ex => {
      ctx.fillStyle = '#ffa500'; ctx.globalAlpha = 1 - (ex.t / ex.maxT);
      ctx.beginPath(); ctx.arc(ex.x + 12, ex.y + 12, (ex.t / ex.maxT) * 20, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function loop(timestamp) {
    if (signal.aborted || !window.gameRunning) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    let dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    if (dt > 0.1) dt = 0.1;

    if (!window.gamePaused) {
      update(dt);
      draw();
    }
    
    if (window.gameRunning && !signal.aborted) {
      window.gameLoop = requestAnimationFrame(loop);
    }
  }
  
  lastFrameTime = performance.now();
  window.gameLoop = requestAnimationFrame(loop);
}

function onFlightMissionEnd(scoreData) {
  if (window.GAME && window.GAME.session) {
    window.GAME.session.bilanganMiniGame += 1;
    window.GAME.session.jumlahEnemy += (scoreData.enemyDestroyed || 0);
    window.GAME.session.jumlahCoin += (scoreData.coinsCollected || 0);
    window.GAME.session.jumlahPowerup += (scoreData.powerupsCollected || 0);
    window.GAME.session.jumlahMarkah += (scoreData.score || 0);
    
    if (scoreData.currentLevel > window.GAME.session.levelTertinggi) {
      window.GAME.session.levelTertinggi = scoreData.currentLevel;
    }
    console.log("Statistik Mini Game berjaya disintesis ke Sesi Utama.");
  }
}