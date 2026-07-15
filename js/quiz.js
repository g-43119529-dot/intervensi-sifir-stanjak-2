/**
 * Modul Pengurusan Mekanik dan Logik Kuiz Sifir
 */

// =========================================================================
// PENGGUNAAN PEMBOLEHUBAH GLOBAL & KAWALAN ANTI-CRASH
// =========================================================================
if (typeof score === 'undefined') window.score = 0;
if (typeof totalScore === 'undefined') window.totalScore = 0;
if (typeof currentQ === 'undefined') window.currentQ = 0;
if (typeof timeLeft === 'undefined') window.timeLeft = 30;
if (typeof timer === 'undefined') window.timer = null;
if (typeof questions === 'undefined') window.questions = [];

// KEMAS KINI: Sediakan objek QuizManager global untuk mengawal status bermain/keluar
if (typeof QuizManager === 'undefined') {
    window.QuizManager = {
        isPlaying: false,
        currentLevel: 1,
        score: 0,
        stopTimer: function() {
            if (window.timer) {
                clearInterval(window.timer);
                window.timer = null;
                console.log("[QuizManager]: Pemasa berjaya dihentikan.");
            }
        }
    };
}

if (typeof currentLevel === 'undefined') window.currentLevel = 1;
if (typeof levels === 'undefined') {
    window.levels = {
        1: { name: "Tahap Mudah", emoji: "🛩️", tables: [2, 3, 4, 5], showHelp: true },
        2: { name: "Tahap Sederhana", emoji: "🚀", tables: [6, 7, 8, 9], showHelp: false },
        3: { name: "Tahap Sukar", emoji: "🛸", tables: [], showHelp: false }
    };
}
if (typeof hardQuestions === 'undefined') {
    window.hardQuestions = [[6,7], [7,8], [8,9], [9,9], [7,7], [6,8], [8,8], [9,6], [7,9], [6,9]];
}

// Fungsi pengaman: Membenarkan panggilan fungsi tanpa menyekat logik kritikal
function safeCall(funcName, ...args) {
    const blocked = []; 
    if (blocked.includes(funcName)) {
        console.log(`[Picu Sistem]: ${funcName}`, args);
        return null;
    }
    if (typeof window[funcName] === 'function') {
        return window[funcName](...args);
    }
    console.log(`[Picu Pengaman]: ${funcName}`, args);
    return null;
}

// Pendaftaran fungsi ke skop window tanpa konflik recursion
window.cleanupGame = function() {
    if (typeof timer !== 'undefined' && timer) { clearInterval(timer); timer = null; }
    if (window.QuizManager) window.QuizManager.stopTimer();
    if (typeof window.cleanupMiniGame === 'function') window.cleanupMiniGame();
};

window.playWarning = function() { 
    if (!window.QuizManager || !window.QuizManager.isPlaying) return; // Sekatan keluar
    if (typeof window.audioWarning === 'function') window.audioWarning();
    else safeCall('audioWarning'); 
};

window.playCorrect = function() { 
    if (!window.QuizManager || !window.QuizManager.isPlaying) return; // Sekatan keluar
    window.playSound('correct');
    if (typeof window.audioCorrect === 'function') window.audioCorrect();
    else if (typeof window.soundCorrect === 'function') window.soundCorrect();
    else safeCall('audioCorrect'); 
};

window.playWrong = function() { 
    if (!window.QuizManager || !window.QuizManager.isPlaying) return; // Sekatan keluar
    window.playSound('wrong');
    if (typeof window.audioWrong === 'function') window.audioWrong();
    else if (typeof window.soundWrong === 'function') window.soundWrong();
    else safeCall('audioWrong'); 
};

window.showTransition = function(emoji, title, subtitle, duration, callback) {
    if (!window.QuizManager || !window.QuizManager.isPlaying) return; // Sekatan keluar
    if (typeof window.displayTransition === 'function') {
        window.displayTransition(emoji, title, subtitle, duration, callback);
    } else {
        console.log(`[Transition Fallback]: ${emoji} ${title} - ${subtitle}`);
        alert(`${emoji} ${title}\n\n${subtitle}`);
        if (typeof callback === 'function') {
            callback();
        } 
        else if (title.includes("MISI TAMAT") || title.includes("TAMAT") || window.currentLevel >= 3) {
            console.log("[Quiz Engine]: Menamatkan permainan sepenuhnya. Kembali ke Menu Utama.");
            if (typeof showScreen === 'function') {
                showScreen('start-screen'); 
            } else {
                location.reload();
            }
        }
    }
};

window.startMiniGame = function(lvl) {
    if (!window.QuizManager || !window.QuizManager.isPlaying) return; // Sekatan keluar
    console.log(`[Quiz Engine]: Mengarahkan peralihan ke Flight Mission Tahap ${lvl}...`);
    
    if (typeof window.executeMiniGameEngine === 'function') {
        window.executeMiniGameEngine(lvl);
        return;
    }
    if (typeof window.initMiniGame === 'function') {
        window.initMiniGame(lvl);
        return;
    } 
    if (typeof window.startGameplay === 'function') {
        window.startGameplay(lvl);
        return;
    }
    
    console.warn("[Quiz Engine Warning]: Enjin minigame.js belum dimuatkan sepenuhnya.");
};

// =========================================================================
// LOGIK UTAMA PERMAINAN
// =========================================================================

function generateQuestions(level) {
  const qs = [];
  let questionPairs = [];

  if (level === 3) {
    questionPairs = [...hardQuestions];
  } else {
    const tables = levels[level].tables;
    for (let a of tables) {
      for (let b = 0; b < 10; b++) {
        questionPairs.push([a, b]);
      }
    }
  }

  while (qs.length < 10 && questionPairs.length > 0) {
    const idx = Math.floor(Math.random() * questionPairs.length);
    const [a, b] = questionPairs[idx];
    questionPairs.splice(idx, 1);
    
    const answer = a * b;
    const opts = new Set([answer]);
    
    while (opts.size < 4) {
      const v = answer + Math.floor(Math.random() * 10) - 4;
      if (v >= 0 && v !== answer) opts.add(v);
      else opts.add(answer + Math.floor(Math.random() * 5) + 1);
    }
    
    qs.push({
      a, b,
      q: `${a} × ${b} = ?`,
      answer,
      options: [...opts].sort(() => Math.random() - 0.5)
    });
  }
  return qs;
}

async function startQuiz() {
  window.cleanupGame(); 
  
  // KEMAS KINI: Aktifkan bendera isPlaying semula sebaik kuiz bermula
  if (window.QuizManager) {
      window.QuizManager.isPlaying = true;
      window.QuizManager.score = 0;
  }
  
  if (typeof showScreen === 'function') showScreen('quiz-screen'); 
  
  score = 0; 
  currentQ = 0;
  if (!window.currentLevel) window.currentLevel = 1;

  document.getElementById('question-text').textContent = "Memuatkan soalan dari pengkalan data Google Sheet...";
  const optsContainer = document.getElementById('options');
  if (optsContainer) optsContainer.innerHTML = '';

  let stringTahap = "MUDAH";
  if (window.currentLevel === 2) stringTahap = "SEDERHANA";
  if (window.currentLevel === 3) stringTahap = "SUKAR";

  console.log(`Menarik soalan untuk Tahap ${window.currentLevel} (${stringTahap}) dari Google Sheet...`);
  
  try {
      if (window.API && typeof window.API.getQuestionsFromSheet === 'function') {
          const res = await window.API.getQuestionsFromSheet(window.currentLevel);
          
          // KEMAS KINI PENGAMAN (ANTI HANTU API): Jika murid menekan butang keluar sewaktu fetching data, potong skrip!
          if (window.QuizManager && !window.QuizManager.isPlaying) {
              console.log("[Quiz Engine Guard]: Data Sheet tiba tetapi ditapis keluar kerana isPlaying = false.");
              return;
          }
          
          if (res && res.success && res.questions && res.questions.length > 0) {
              questions = res.questions;
              console.log(`[Google Sheet Sukses]: 10 Soalan Tahap ${stringTahap} berjaya dimuatkan!`, questions);
          } else {
              throw new Error("Respon data kosong atau tidak sah dari web app GAS");
          }
      } else {
          throw new Error("Pautan API (window.API.getQuestionsFromSheet) tidak ditemui");
      }
  } catch (err) {
      // Sekat pelan kecemasan jika murid sebenarnya sudah keluar
      if (window.QuizManager && !window.QuizManager.isPlaying) return;
      
      console.warn(`Gagal memproses data Sheet untuk Tahap ${stringTahap} (${err.message}). Mengaktifkan pelan kecemasan lokal.`);
      questions = generateQuestions(window.currentLevel);
  }
  
  const badgeEl = document.getElementById('level-badge');
  if (badgeEl && levels[window.currentLevel]) {
      badgeEl.textContent = `${levels[window.currentLevel].emoji} ${levels[window.currentLevel].name}`;
  }
  
  showQuestion();
}

function showQuestion() {
  // KEMAS KINI PENGAMAN: Halang pembukaan soalan dan pembakaran pemasa baru jika murid telah keluar
  if (window.QuizManager && !window.QuizManager.isPlaying) {
      window.cleanupGame();
      return;
  }

  if (!questions || questions.length === 0 || !questions[currentQ]) {
      console.error("Soalan tidak dijumpai.");
      return;
  }

  const q = questions[currentQ];
  document.getElementById('question-num').textContent = `Soalan ${currentQ + 1}/10`;
  document.getElementById('question-text').textContent = q.q;
  document.getElementById('score-display').textContent = `Markah: ${score}/${currentQ}`;
  document.getElementById('progress-display').textContent = `Tahap ${window.currentLevel}/3`;
  
  const helpCard = document.getElementById('help-card');
  if (levels[window.currentLevel] && levels[window.currentLevel].showHelp) { 
    helpCard.classList.remove('hidden'); 
    const lines = []; 
    for (let i = 0; i <= 9; i++) lines.push(`${q.a}×${i}=${q.a * i}`); 
    document.getElementById('help-card-content').textContent = `Sifir ${q.a}: ${lines.join(' | ')}`; 
  } else { 
    helpCard.classList.add('hidden'); 
  }
  
  const opts = document.getElementById('options'); 
  if (opts) {
      opts.innerHTML = '';
      q.options.forEach(opt => { 
        const btn = document.createElement('button'); 
        btn.className = 'btn-neon bg-white/10 text-white font-bold text-xl py-4 rounded-xl hover:bg-cyan-500/30 transition'; 
        btn.textContent = opt; 
        btn.onclick = () => selectAnswer(opt, btn); 
        opts.appendChild(btn); 
      });
  }
  
  timeLeft = 30; 
  updateTimerBar(); 
  if (timer) clearInterval(timer);
  
  timer = setInterval(() => { 
    // KEMAS KINI PENGAMAN: Jika dikesan murid telah keluar di tengah jalan, bunuh interval serta merta
    if (window.QuizManager && !window.QuizManager.isPlaying) {
        clearInterval(timer);
        timer = null;
        return;
    }

    timeLeft--; 
    updateTimerBar(); 
    
    if (timeLeft <= 5 && timeLeft > 0) { 
        if (typeof window.playSound === 'function') {
            window.playSound('countdown'); 
        } else {
            window.playWarning(); 
        }
    } 
    
    if (timeLeft <= 0) { 
      clearInterval(timer); 
      timer = null; 
      
      if (typeof window.playSound === 'function') {
          window.playSound('gameover'); 
      }
      
      selectAnswer(null, null); 
    } 
  }, 1000);
}

function updateTimerBar() {
  const pct = (timeLeft / 30) * 100;
  const bar = document.getElementById('timer-bar');
  if (bar) {
      bar.style.width = pct + '%'; 
      bar.className = 'timer-bar h-full rounded-full ' + (pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400');
  }
  
  const txt = document.getElementById('timer-text'); 
  if (txt) {
      txt.textContent = timeLeft + 's'; 
      txt.className = 'text-right text-sm mb-3 ' + (timeLeft <= 5 ? 'text-red-400 pulse-glow' : 'text-cyan-300');
  }
}

function selectAnswer(ans, btn) {
  if (window.QuizManager && !window.QuizManager.isPlaying) return; // Sekatan keluar
  if (timer) { clearInterval(timer); timer = null; }
  
  const correct = ans === questions[currentQ].answer;
  if (correct) {
    score++; 
    totalScore++; 
    if (window.QuizManager) window.QuizManager.score = score;
    window.playCorrect();
  } else {
    window.playWrong();
  }
  
  document.querySelectorAll('#options button').forEach(b => {
    b.disabled = true;
    b.classList.add('opacity-50');
  });
  if (btn) btn.classList.remove('opacity-50');
  showFeedback(correct);
}

function showFeedback(correct) {
  if (window.QuizManager && !window.QuizManager.isPlaying) return; // Sekatan keluar
  const fb = document.getElementById('feedback');
  const box = document.getElementById('feedback-box');
  const text = document.getElementById('feedback-text');
  
  if (fb && box && text) {
      fb.classList.remove('hidden'); 
      text.textContent = correct ? '✓ Betul!' : '✗ Salah!';
      box.className = 'pop-in text-center p-8 rounded-2xl ' + (correct ? 'bg-green-500/90' : 'bg-red-500/90');
      
      if (!correct) box.classList.add('shake');
  }
  
  setTimeout(() => { 
    if (window.QuizManager && !window.QuizManager.isPlaying) return; // Sekatan keluar
    if (fb) fb.classList.add('hidden'); 
    currentQ++; 
    if (currentQ < questions.length && currentQ < 10) showQuestion(); 
    else endQuiz(); 
  }, 1000);
}

function endQuiz() {
  if (window.QuizManager && !window.QuizManager.isPlaying) return; // Sekatan keluar
  const totalQ = questions.length > 0 ? questions.length : 10;
  const pct = (score / totalQ) * 100;
  
  console.log(`[Tamat Kuiz] Skor Akhir: ${score}/${totalQ} (${pct.toFixed(0)}%) untuk Tahap ${window.currentLevel}`);

  if (window.GAME && window.GAME.session) {
      window.GAME.session.jumlahJawapanBetul += score;
      window.GAME.session.jumlahSoalanDijawab += totalQ;
  }

  if (pct < 80) { 
    if (typeof window.playSound === 'function') {
        window.playSound('gameover'); 
    }

    window.showTransition(
      '😢', 
      `${score}/${totalQ} (${pct.toFixed(0)}%)`, 
      'Anda memerlukan sekurang-kurangnya 80% markah betul untuk membuka Flight Mission. Cuba lagi!', 
      3500, 
      () => {
          if (window.QuizManager && window.QuizManager.isPlaying) window.startQuiz();
      }
    ); 
  } else {
    if (typeof window.playSound === 'function') {
        window.playSound('correct');
        setTimeout(() => { if (window.QuizManager && window.QuizManager.isPlaying) window.playSound('correct'); }, 150);
        setTimeout(() => { if (window.QuizManager && window.QuizManager.isPlaying) window.playSound('correct'); }, 300);
    }

    window.showTransition(
      '🎉', 
      'Tahniah!', 
      `Markah anda cemerlang (${pct.toFixed(0)}%). Bersiap sedia untuk Flight Mission Tahap ${window.currentLevel}!`, 
      2500, 
      () => {
          if (window.QuizManager && window.QuizManager.isPlaying && typeof window.startMiniGame === 'function') {
              window.startMiniGame(window.currentLevel);
          }
      }
    );
  }
}

window.startQuiz = startQuiz;
