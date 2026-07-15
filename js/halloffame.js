/**
 * Modul Pengurusan Mekanik dan Logik Kuiz Sifir
 */

function generateQuestions(level) {
  const qs = [];
  let questionPairs = [];

  if (level === 3) {
    // Tahap sukar: Ambil terus daripada bank hardQuestions
    questionPairs = [...hardQuestions];
  } else {
    // Tahap mudah & sederhana: Gunakan sifir spesifik mengikut tahap
    const tables = levels[level].tables;
    for (let a of tables) {
      for (let b = 0; b < 10; b++) {
        questionPairs.push([a, b]);
      }
    }
  }

  // Pilih 10 pasangan soalan secara rawak tanpa ulangan
  while (qs.length < 10 && questionPairs.length > 0) {
    const idx = Math.floor(Math.random() * questionPairs.length);
    const [a, b] = questionPairs[idx];
    questionPairs.splice(idx, 1);
    
    const answer = a * b;
    const opts = new Set([answer]);
    
    // Jana 3 pilihan jawapan pengganggu rawak yang munasabah
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

function startQuiz() {
  cleanupGame(); 
  showScreen('quiz-screen'); 
  score = 0; 
  currentQ = 0;
  
  questions = generateQuestions(currentLevel);
  document.getElementById('level-badge').textContent = `${levels[currentLevel].emoji} ${levels[currentLevel].name}`;
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQ];
  document.getElementById('question-num').textContent = `Soalan ${currentQ + 1}/10`;
  document.getElementById('question-text').textContent = q.q;
  document.getElementById('score-display').textContent = `Markah: ${score}/${currentQ}`;
  document.getElementById('progress-display').textContent = `Tahap ${currentLevel}/3`;
  
  const helpCard = document.getElementById('help-card');
  if (levels[currentLevel].showHelp) { 
    helpCard.classList.remove('hidden'); 
    const lines = []; 
    for (let i = 0; i <= 9; i++) lines.push(`${q.a}×${i}=${q.a * i}`); 
    document.getElementById('help-card-content').textContent = `Sifir ${q.a}: ${lines.join(' | ')}`; 
  } else { 
    helpCard.classList.add('hidden'); 
  }
  
  const opts = document.getElementById('options'); 
  opts.innerHTML = '';
  
  q.options.forEach(opt => { 
    const btn = document.createElement('button'); 
    btn.className = 'btn-neon bg-white/10 text-white font-bold text-xl py-4 rounded-xl hover:bg-cyan-500/30 transition'; 
    btn.textContent = opt; 
    btn.onclick = () => selectAnswer(opt, btn); 
    opts.appendChild(btn); 
  });
  
  timeLeft = 30; 
  updateTimerBar(); 
  clearInterval(timer);
  
  timer = setInterval(() => { 
    timeLeft--; 
    updateTimerBar(); 
    if (timeLeft === 5) playWarning(); 
    if (timeLeft <= 0) { 
      clearInterval(timer); 
      timer = null; 
      selectAnswer(null, null); 
    } 
  }, 1000);
}

function updateTimerBar() {
  const pct = (timeLeft / 30) * 100;
  const bar = document.getElementById('timer-bar');
  bar.style.width = pct + '%'; 
  bar.className = 'timer-bar h-full rounded-full ' + (pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400');
  
  const txt = document.getElementById('timer-text'); 
  txt.textContent = timeLeft + 's'; 
  txt.className = 'text-right text-sm mb-3 ' + (timeLeft <= 5 ? 'text-red-400 pulse-glow' : 'text-cyan-300');
}

function selectAnswer(ans, btn) {
  clearInterval(timer); 
  timer = null;
  
  const correct = ans === questions[currentQ].answer;
  if (correct) {
    score++; 
    totalScore++; 
    playCorrect();
  } else {
    playWrong();
  }
  
  document.querySelectorAll('#options button').forEach(b => {
    b.disabled = true;
    b.classList.add('opacity-50');
  });
  if (btn) btn.classList.remove('opacity-50');
  showFeedback(correct);
}

function showFeedback(correct) {
  const fb = document.getElementById('feedback');
  const box = document.getElementById('feedback-box');
  const text = document.getElementById('feedback-text');
  
  fb.classList.remove('hidden'); 
  text.textContent = correct ? '✓ Betul!' : '✗ Salah!';
  box.className = 'pop-in text-center p-8 rounded-2xl ' + (correct ? 'bg-green-500/90' : 'bg-red-500/90');
  
  if (!correct) box.classList.add('shake');
  
  setTimeout(() => { 
    fb.classList.add('hidden'); 
    currentQ++; 
    if (currentQ < 10) showQuestion(); 
    else endQuiz(); 
  }, 1000);
}

function endQuiz() {
  const pct = (score / 10) * 100;
  if (pct < 80) { 
    showTransition('😢', `${score}/10 (${pct}%)`, 'Anda perlu 80% untuk mara. Cuba lagi!', 2500, () => startQuiz()); 
    return; 
  }
  if (currentLevel <= 3) {
    showTransition('🎉', 'Tahniah!', 'Bersiap untuk Flight Mission!', 2000, () => startMiniGame(currentLevel));
  }
}