// ============================================================
// INSCRIPT MARATHI TYPING TUTOR - MAIN APP
// ============================================================
// Simple direct mapping: each keystroke produces one output character.
// No IME buffering. Multi-codepoint characters (like conjuncts ज्ञ, त्र, क्‍ष, श्र)
// are mapped to single keys in keyboard-data.js.
// For sequences like क् (K+D), each codepoint is typed individually.
//
// NEW: Random Letter Recall Drill (see DRILL section near the bottom).
// Fixed lesson exercises are great for muscle memory of a sequence, but
// they can be "memorized as a pattern" without you actually learning which
// key produces which letter. The drill generates a fresh, shuffled set of
// single characters every time you run it, so there is nothing to
// memorize except the real key -> letter mapping. It also tracks your
// per-letter accuracy (saved in this browser) so it can build a
// "weak letters" set automatically.
// ============================================================

// State variables
var currentLesson = 0;
var currentExercise = 0;
var isActive = false;
var startTime = null;
var errors = 0;
var totalChars = 0;
var timerInterval = null;
var completedLessons = new Set();
var settings = { sound: false, fingers: true, highlight: true, strict: true };
var typedChars = [];  // {char: '', correct: bool, keyPressed: ''}
var isShiftPressed = false;

// ---- Drill mode state ----
var drillMode = false;
var drillLesson = null;
var lastDrillKind = 'all';

// DOM references
var targetDisplay = document.getElementById('target-display');
var typeDisplay = document.getElementById('type-display');
var lessonInfo = document.getElementById('lesson-info');
var resultsPanel = document.getElementById('results-panel');
var progressFill = document.getElementById('progress-fill');
var progressText = document.getElementById('progress-text');
var btnStart = document.getElementById('btn-start');
var modeIndicator = document.getElementById('mode-indicator');

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  renderLessonNav();
  renderKeyboard();
  renderCheatSheet();
  buildCharPool();
  loadDrillStats();
  selectLesson(0);
  setupKeyboardCapture();
}

function renderLessonNav() {
  var nav = document.getElementById('lesson-nav');
  nav.innerHTML = '';
  for (var i = 0; i < LESSONS.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'lesson-btn';
    btn.textContent = (i + 1) + '. ' + LESSONS[i].title.split(' - ')[0];
    btn.setAttribute('data-lesson', i);
    if (completedLessons.has(i)) btn.classList.add('completed');
    var maxComp = -1;
    completedLessons.forEach(function(v) { if (v > maxComp) maxComp = v; });
    if (i > maxComp + 1 && !completedLessons.has(i)) {
      //btn.classList.add('locked');
      //btn.disabled = true;
    }
    btn.onclick = (function(idx) {
      return function() { if (!this.classList.contains('locked')) selectLesson(idx); };
    })(i);
    nav.appendChild(btn);
  }
}

function renderKeyboard() {
  var kb = document.getElementById('keyboard');
  var html = '';
  html += '<div class="kb-row">';
  for (var i = 0; i < KBD.row1.length; i++) {
    var k = KBD.row1[i];
    html += '<div class="kb-key" data-key="' + k.en.toLowerCase() + '" data-shift="' + k.shift + '" data-finger="' + k.f + '">' +
      '<span class="key-shift">' + k.shift + '</span><span class="key-en">' + k.en + '</span><span class="key-mr">' + k.mr + '</span></div>';
  }
  html += '<div class="kb-key wide"><span class="key-en">Bksp</span></div></div>';
  html += '<div class="kb-row"><div class="kb-key wide"><span class="key-en">Tab</span></div>';
  for (var i = 0; i < KBD.row2.length; i++) {
    var k = KBD.row2[i];
    html += '<div class="kb-key" data-key="' + k.en.toLowerCase() + '" data-shift="' + k.shift + '" data-finger="' + k.f + '">' +
      '<span class="key-shift">' + k.shift + '</span><span class="key-en">' + k.en + '</span><span class="key-mr">' + k.mr + '</span></div>';
  }
  html += '</div>';
  html += '<div class="kb-row"><div class="kb-key extra-wide"><span class="key-en">Caps</span></div>';
  for (var i = 0; i < KBD.row3.length; i++) {
    var k = KBD.row3[i];
    html += '<div class="kb-key" data-key="' + k.en.toLowerCase() + '" data-shift="' + k.shift + '" data-finger="' + k.f + '">' +
      '<span class="key-shift">' + k.shift + '</span><span class="key-en">' + k.en + '</span><span class="key-mr">' + k.mr + '</span></div>';
  }
  html += '<div class="kb-key extra-wide"><span class="key-en">Enter</span></div></div>';
  html += '<div class="kb-row"><div class="kb-key wide"><span class="key-en">Shift</span></div>';
  for (var i = 0; i < KBD.row4.length; i++) {
    var k = KBD.row4[i];
    html += '<div class="kb-key" data-key="' + k.en.toLowerCase() + '" data-shift="' + k.shift + '" data-finger="' + k.f + '">' +
      '<span class="key-shift">' + k.shift + '</span><span class="key-en">' + k.en + '</span><span class="key-mr">' + k.mr + '</span></div>';
  }
  html += '<div class="kb-key wide"><span class="key-en">Shift</span></div></div>';
  html += '<div class="kb-row"><div class="kb-key"><span class="key-en">Ctrl</span></div><div class="kb-key"><span class="key-en">Win</span></div>' +
    '<div class="kb-key"><span class="key-en">Alt</span></div><div class="kb-key space"><span class="key-en">Space</span></div>' +
    '<div class="kb-key"><span class="key-en">Alt</span></div><div class="kb-key"><span class="key-en">Win</span></div><div class="kb-key"><span class="key-en">Ctrl</span></div></div>';
  kb.innerHTML = html;
}

function renderCheatSheet() {
  var grid = document.getElementById('cheat-grid');
  var allKeys = KBD.row1.concat(KBD.row2).concat(KBD.row3).concat(KBD.row4);
  var html = '';
  for (var i = 0; i < allKeys.length; i++) {
    var k = allKeys[i];
    if (!k.mr && !k.shift) continue;
    html += '<div class="cheat-item"><span class="cheat-key">' + k.en + '</span><div>';
    if (k.mr) html += '<span class="cheat-char">' + k.mr + '</span>';
    if (k.shift) html += '<span class="cheat-shift"> / ' + k.shift + '</span>';
    html += '</div></div>';
  }
  grid.innerHTML = html;
}

// ============================================================
// Helper: returns whichever "lesson-shaped" object is active right now
// (a real lesson from LESSONS, or the freshly generated drill lesson).
// Every place that used to read LESSONS[currentLesson] directly now
// goes through this so drill mode can reuse all the same rendering
// and grading code.
// ============================================================
function getActiveLesson() {
  return drillMode ? drillLesson : LESSONS[currentLesson];
}

function selectLesson(index) {
  drillMode = false;
  currentLesson = index;
  currentExercise = 0;
  errors = 0;
  totalChars = 0;
  typedChars = [];
  isShiftPressed = false;
  isActive = false;
  clearInterval(timerInterval);
  var btns = document.querySelectorAll('.lesson-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', i === index);
  }
  var lesson = LESSONS[index];
  lessonInfo.innerHTML = '<strong>Lesson ' + (index + 1) + ':</strong> ' + lesson.title + '<br>' + lesson.desc;
  typeDisplay.innerHTML = '<span style="color:#555;font-size:20px;">Click here or press Start to focus...</span>';
  targetDisplay.innerHTML = '<span style="color:#555;font-size:20px;">Click "Start Practice" to begin...</span>';
  resetStats();
  resultsPanel.classList.remove('show');
  var report = document.getElementById('drill-report');
  if (report) report.classList.remove('show');
  resetResultsButtons();
  btnStart.textContent = 'Start Practice';
  btnStart.onclick = startPractice;
  btnStart.disabled = false;
  highlightFocusKeys(lesson.focus);
}

function highlightFocusKeys(keys) {
  var kbs = document.querySelectorAll('.kb-key');
  for (var i = 0; i < kbs.length; i++) {
    kbs[i].style.border = '1px solid rgba(255,255,255,0.08)';
    kbs[i].style.background = 'rgba(255,255,255,0.06)';
  }
  if (!keys || keys.length === 0) return;
  for (var i = 0; i < keys.length; i++) {
    var el = document.querySelector('.kb-key[data-key="' + keys[i].toLowerCase() + '"]');
    if (el) { el.style.border = '2px solid #feca57'; el.style.background = 'rgba(254,202,87,0.15)'; }
  }
}

// ============================================================
// KEYBOARD CAPTURE - DIRECT MAPPING (NO IME)
// ============================================================
// Each keystroke maps directly to one output character.
// No buffering, no preview, no IME state.
// Backspace removes last committed character and adjusts error count.
// ============================================================

function setupKeyboardCapture() {
  typeDisplay.addEventListener('keydown', function(e) {
    if (!isActive) {
      if (e.key === 'Enter' && !resultsPanel.classList.contains('show')) {
        e.preventDefault();
        startPractice();
      }
      return;
    }

    e.preventDefault();

    var key = e.key;
    var code = e.code;

    if (key === 'Shift') {
      isShiftPressed = true;
      updateModeIndicator();
      return;
    }

    if (key === 'Backspace') {
      handleBackspace();
      return;
    }

    if (key === 'Escape') {
      if (isActive) pausePractice();
      else if (resultsPanel.classList.contains('show')) restartLesson();
      return;
    }

    if (key === 'Control' || key === 'Alt' || key === 'Meta' || key === 'CapsLock' ||
      key === 'Tab' || key === 'Enter' || key === 'ArrowLeft' || key === 'ArrowRight' ||
      key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End' ||
      key === 'PageUp' || key === 'PageDown' || key === 'Insert' || key === 'Delete') {
      return;
    }

    var char = mapKeyToMarathi(key, code, e.shiftKey);
    if (char === null) return;

    commitCharacter(char, key);
  });

  typeDisplay.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') {
      isShiftPressed = false;
      updateModeIndicator();
    }
    var keys = document.querySelectorAll('.kb-key');
    for (var i = 0; i < keys.length; i++) {
      keys[i].classList.remove('active');
    }
  });

  typeDisplay.addEventListener('blur', function() {
    if (isActive) {
      setTimeout(function() { typeDisplay.focus(); }, 100);
    }
  });

  typeDisplay.addEventListener('click', function() {
    if (!isActive && !resultsPanel.classList.contains('show')) {
      startPractice();
    }
  });
}

function commitCharacter(char, keyPressed) {
  var lesson = getActiveLesson();
  var ex = lesson.ex[currentExercise];
  var targetIndex = typedChars.length;

  if (targetIndex >= ex.length) return;

  var isCorrect = (char === ex[targetIndex]);
  if (!isCorrect) errors++;
  totalChars++;

  typedChars.push({
    char: char,
    correct: isCorrect,
    keyPressed: keyPressed
  });

  renderTypedDisplay();
  updateTargetHighlight();
  highlightKeyPress(keyPressed, isShiftPressed);
  highlightFinger(keyPressed, isShiftPressed);
  updateStats();

  if (typedChars.length >= ex.length) {
    if (drillMode) {
      // Drill exercises are one long shuffled string - always finish and
      // show the letter-by-letter report, errors and all.
      setTimeout(function() { finishLesson(); }, 400);
    } else if (settings.strict && errors > 0) {
      // FIX: this used to silently do nothing (the retry alert was
      // commented out), leaving the exercise stuck forever whenever
      // strict/100%-accuracy mode was on and you made a mistake.
      // Now it actually restarts the exercise after a brief pause.
      setTimeout(function() { restartExercise(); }, 700);
    } else {
      setTimeout(function() { nextExercise(); }, 400);
    }
  }
}

function handleBackspace() {
  if (typedChars.length > 0) {
    var removed = typedChars.pop();
    if (!removed.correct) {
      errors = Math.max(0, errors - 1);
    }
    totalChars = Math.max(0, totalChars - 1);
    renderTypedDisplay();
    updateTargetHighlight();
    updateStats();
  }
}

// ============================================================
// FIXED: mapKeyToMarathi - Now handles shifted symbols correctly
// ============================================================
// When Shift is pressed, e.key returns the SHIFTED symbol (e.g., '{' for '[').
// We use SHIFT_TO_BASE to convert shifted symbols back to their base key,
// then look up the Marathi character in SHIFT_KEY_MAP.
// ============================================================
function mapKeyToMarathi(key, code, shiftKey) {
  if (key === ' ' || code === 'Space') return ' ';

  var baseKey = key.toLowerCase();

  // If shift is active and the key is a shifted symbol, convert back to base
  if (shiftKey && SHIFT_TO_BASE[key]) {
    baseKey = SHIFT_TO_BASE[key];
  }
  // Also handle direct key checks for non-letter keys (unshifted state)
  else {
    if (key >= '0' && key <= '9') baseKey = key;
    if (key === '`') baseKey = '`';
    if (key === '-') baseKey = '-';
    if (key === '=') baseKey = '=';
    if (key === '[') baseKey = '[';
    if (key === ']') baseKey = ']';
    if (key === '\\') baseKey = '\\';
    if (key === ';') baseKey = ';';
    if (key === "'") baseKey = "'";
    if (key === ',') baseKey = ',';
    if (key === '.') baseKey = '.';
    if (key === '/') baseKey = '/';
  }

  if (shiftKey) {
    if (SHIFT_KEY_MAP[baseKey]) return SHIFT_KEY_MAP[baseKey];
    return null;
  } else {
    if (KEY_MAP[baseKey]) return KEY_MAP[baseKey];
    return null;
  }
}

function updateModeIndicator() {
  if (isShiftPressed) {
    modeIndicator.innerHTML = 'Current Mode: <span>SHIFT Active</span> | Shift+Key for uppercase/alt characters';
  } else {
    modeIndicator.innerHTML = 'Current Mode: <span>Normal Keys</span> | Press Shift for shifted characters';
  }
}

function renderTypedDisplay() {
  var lesson = getActiveLesson();
  var ex = lesson.ex[currentExercise];
  var html = '';

  for (var i = 0; i < typedChars.length; i++) {
    var tc = typedChars[i];
    var cls = tc.correct ? 'correct' : 'wrong';
    html += '<span class="typed-char ' + cls + '">' + tc.char + '</span>';
  }

  if (typedChars.length < ex.length) {
    html += '<span class="cursor"></span>';
  }

  for (var i = typedChars.length; i < ex.length; i++) {
    html += '<span class="typed-char pending">_</span>';
  }

  typeDisplay.innerHTML = html;
}

function updateTargetHighlight() {
  var lesson = getActiveLesson();
  var ex = lesson.ex[currentExercise];
  var chars = targetDisplay.querySelectorAll('.char');

  for (var i = 0; i < chars.length; i++) {
    chars[i].classList.remove('current', 'correct', 'wrong', 'pending');
    if (i < typedChars.length) {
      if (typedChars[i].correct) chars[i].classList.add('correct');
      else chars[i].classList.add('wrong');
    } else if (i === typedChars.length) {
      chars[i].classList.add('current');
      highlightNextKey(ex[i]);
    } else {
      chars[i].classList.add('pending');
    }
  }
}

function highlightNextKey(char) {
  var kbs = document.querySelectorAll('.kb-key');
  for (var i = 0; i < kbs.length; i++) { kbs[i].classList.remove('target'); }
  if (!settings.highlight || !char) return;

  var keyEn = null;

  for (var i = 0; i < ALL_KEYS.length; i++) {
    if (ALL_KEYS[i].mr === char) { keyEn = ALL_KEYS[i].en.toLowerCase(); break; }
    if (ALL_KEYS[i].shift === char) { keyEn = ALL_KEYS[i].en.toLowerCase(); break; }
  }

  if (char === ' ') { keyEn = 'space'; }

  if (keyEn) {
    var sel = '.kb-key[data-key="' + keyEn + '"]';
    if (keyEn === 'space') sel = '.kb-key.space';
    var el = document.querySelector(sel);
    if (el) el.classList.add('target');
  }
}

function highlightKeyPress(key, shiftKey) {
  var lower = key.toLowerCase();
  // When shift is pressed, key may be a shifted symbol - convert back to base
  if (shiftKey && SHIFT_TO_BASE[key]) {
    lower = SHIFT_TO_BASE[key];
  }
  var keys = document.querySelectorAll('.kb-key');
  for (var i = 0; i < keys.length; i++) {
    var dk = keys[i].getAttribute('data-key');
    if (dk === lower || (key === ' ' && keys[i].classList.contains('space'))) {
      keys[i].classList.add('active');
      setTimeout((function(k) { return function() { k.classList.remove('active'); }; })(keys[i]), 200);
    }
  }
}

function highlightFinger(key, shiftKey) {
  if (!settings.fingers) return;
  var fings = document.querySelectorAll('.finger');
  for (var i = 0; i < fings.length; i++) { fings[i].classList.remove('active'); }

  var lower = key.toLowerCase();
  // When shift is pressed, key may be a shifted symbol - convert back to base
  if (shiftKey && SHIFT_TO_BASE[key]) {
    lower = SHIFT_TO_BASE[key];
  }
  var keyData = null;
  for (var i = 0; i < ALL_KEYS.length; i++) {
    if (ALL_KEYS[i].en.toLowerCase() === lower) { keyData = ALL_KEYS[i]; break; }
  }

  if (keyData && keyData.f) {
    var finger = document.getElementById('f-' + keyData.f);
    if (finger) {
      finger.classList.add('active');
      setTimeout(function() { finger.classList.remove('active'); }, 300);
    }
  }
}

// ============================================================
// PRACTICE CONTROL FUNCTIONS
// ============================================================
function startPractice() {
  currentExercise = 0;
  errors = 0;
  totalChars = 0;
  typedChars = [];
  isShiftPressed = false;
  isActive = true;
  startTime = Date.now();
  resultsPanel.classList.remove('show');
  typeDisplay.innerHTML = '<span class="cursor"></span>';
  typeDisplay.focus();
  loadExercise();
  startTimer();
  btnStart.textContent = 'Pause';
  btnStart.onclick = pausePractice;
}

function pausePractice() {
  isActive = false;
  clearInterval(timerInterval);
  btnStart.textContent = 'Resume';
  btnStart.onclick = resumePractice;
}

function resumePractice() {
  isActive = true;
  var currentTime = parseTime(document.getElementById('stat-time').textContent);
  startTime = Date.now() - (currentTime * 1000);
  typeDisplay.focus();
  startTimer();
  btnStart.textContent = 'Pause';
  btnStart.onclick = pausePractice;
}

function parseTime(str) {
  var p = str.split(':');
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}

function loadExercise() {
  var lesson = getActiveLesson();
  var ex = lesson.ex[currentExercise];
  typedChars = [];
  progressText.textContent = 'Exercise ' + (currentExercise + 1) + ' of ' + lesson.ex.length;
  updateProgressBar();
  var html = '';
  for (var i = 0; i < ex.length; i++) {
    html += '<span class="char ' + (i === 0 ? 'current' : 'pending') + '" data-index="' + i + '">' + ex[i] + '</span>';
  }
  targetDisplay.innerHTML = html;
  renderTypedDisplay();
  highlightNextKey(ex[0]);
}

function nextExercise() {
  var lesson = getActiveLesson();
  if (currentExercise < lesson.ex.length - 1) {
    currentExercise++;
    typedChars = [];
    loadExercise();
  } else {
    finishLesson();
  }
}

function restartExercise() {
  typedChars = [];
  errors = 0;
  totalChars = 0;
  var lesson = getActiveLesson();
  var ex = lesson.ex[currentExercise];
  var html = '';
  for (var i = 0; i < ex.length; i++) {
    html += '<span class="char ' + (i === 0 ? 'current' : 'pending') + '" data-index="' + i + '">' + ex[i] + '</span>';
  }
  targetDisplay.innerHTML = html;
  renderTypedDisplay();
  highlightNextKey(ex[0]);
  updateStats();
}

function finishLesson() {
  isActive = false;
  clearInterval(timerInterval);

  var lesson = getActiveLesson();
  var finishedEx = lesson.ex[currentExercise];

  if (drillMode) {
    recordDrillStats(finishedEx, typedChars);
  } else {
    completedLessons.add(currentLesson);
  }

  var elapsed = (Date.now() - startTime) / 1000;
  var mins = elapsed / 60;
  var wpm = mins > 0 ? Math.round((totalChars / 5) / mins) : 0;
  var accuracy = totalChars > 0 ? Math.round(((totalChars - errors) / totalChars) * 100) : 100;
  document.getElementById('result-wpm').textContent = wpm;
  var accEl = document.getElementById('result-accuracy');
  accEl.textContent = accuracy + '%';
  accEl.className = 'result-value ' + (accuracy >= 95 ? 'excellent' : accuracy >= 80 ? 'good' : 'poor');
  document.getElementById('result-time').textContent = formatTime(Math.floor(elapsed));
  var msg = '';
  if (accuracy === 100) msg = 'Perfect! 100% accuracy achieved! You have mastered this lesson.';
  else if (accuracy >= 95) msg = 'Excellent! Nearly perfect. Try again for 100%!';
  else if (accuracy >= 80) msg = 'Good progress! Keep practicing for higher accuracy.';
  else msg = 'Keep practicing! Focus on accuracy over speed.';
  document.getElementById('result-message').textContent = msg;

  var report = document.getElementById('drill-report');
  if (drillMode) {
    renderDrillReport(finishedEx, typedChars);
    if (report) report.classList.add('show');
    setDrillResultsButtons();
  } else {
    if (report) report.classList.remove('show');
    resetResultsButtons();
  }

  resultsPanel.classList.add('show');
  document.getElementById('practice-section').classList.add('hidden');
  document.getElementById('finger-guide').classList.add('hidden');

  if (!drillMode) {
    var tab = document.querySelector('.lesson-btn[data-lesson="' + currentLesson + '"]');
    if (tab) tab.classList.add('completed');
    renderLessonNav();
  }

  btnStart.textContent = 'Start Practice';
  btnStart.onclick = startPractice;
}

function nextLesson() {
  document.getElementById('practice-section').classList.remove('hidden');
  document.getElementById('finger-guide').classList.remove('hidden');
  if (currentLesson < LESSONS.length - 1) { selectLesson(currentLesson + 1); startPractice(); }
}

function restartLesson() {
  document.getElementById('practice-section').classList.remove('hidden');
  document.getElementById('finger-guide').classList.remove('hidden');
  resultsPanel.classList.remove('show');
  startPractice();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('stat-time').textContent = formatTime(elapsed);
  }, 1000);
}

function formatTime(s) {
  var m = Math.floor(s / 60), sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function updateStats() {
  var elapsed = (Date.now() - startTime) / 1000;
  var mins = elapsed / 60;
  var wpm = mins > 0 ? Math.round((typedChars.length / 5) / mins) : 0;
  var cpm = mins > 0 ? Math.round(typedChars.length / mins) : 0;
  var accuracy = typedChars.length > 0 ? Math.round(((typedChars.length - errors) / typedChars.length) * 100) : 100;
  document.getElementById('stat-wpm').textContent = wpm;
  document.getElementById('stat-cpm').textContent = cpm;
  document.getElementById('stat-accuracy').textContent = accuracy + '%';
  document.getElementById('stat-errors').textContent = errors;
}

function updateProgressBar() {
  var lesson = getActiveLesson();
  var pct = ((currentExercise) / lesson.ex.length) * 100;
  progressFill.style.width = pct + '%';
}

function resetStats() {
  document.getElementById('stat-wpm').textContent = '0';
  document.getElementById('stat-cpm').textContent = '0';
  document.getElementById('stat-accuracy').textContent = '100%';
  document.getElementById('stat-errors').textContent = '0';
  document.getElementById('stat-time').textContent = '0:00';
  progressFill.style.width = '0%';
}

function toggleCheatSheet() {
  document.getElementById('cheat-sheet').classList.toggle('show');
}

function toggleSettings() {
  document.getElementById('settings-panel').classList.toggle('show');
}

function toggleSetting(key) {
  settings[key] = !settings[key];
  document.getElementById('toggle-' + key).classList.toggle('active');
}

function resetAll() {
  currentLesson = 0;
  completedLessons.clear();
  selectLesson(0);
  var btns = document.querySelectorAll('.lesson-btn');
  for (var i = 0; i < btns.length; i++) { btns[i].classList.remove('completed'); }
}

// Global key handler for shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (isActive) pausePractice();
    else if (resultsPanel.classList.contains('show')) restartLesson();
  }
  if (e.key === 'Enter' && !isActive && !resultsPanel.classList.contains('show') && document.activeElement !== typeDisplay) {
    startPractice();
  }
});

// ============================================================
// ============================================================
//   RANDOM LETTER RECALL DRILL
// ============================================================
// ============================================================
// The fixed lessons teach a sequence. This drill teaches the actual
// key -> letter mapping, because the order is re-shuffled every single
// time it's generated - there is nothing fixed to memorize.
//
// - CHAR_POOL: every real character on the keyboard (both plain and
//   Shift versions), built once from ALL_KEYS.
// - drillStats: {char: {attempts, errors}} persisted in localStorage,
//   used to weight which letters show up more often (spaced-repetition
//   style: the letters you get wrong keep coming back more).
// ============================================================

var CHAR_POOL = [];
var drillStats = {};
var DRILL_STATS_KEY = 'inscript_drill_stats_v1';

function buildCharPool() {
  CHAR_POOL = [];
  for (var i = 0; i < ALL_KEYS.length; i++) {
    var k = ALL_KEYS[i];
    if (k.mr) CHAR_POOL.push({ char: k.mr, key: k.en, shift: false });
    if (k.shift) CHAR_POOL.push({ char: k.shift, key: k.en, shift: true });
  }
}

function loadDrillStats() {
  try {
    var raw = localStorage.getItem(DRILL_STATS_KEY);
    drillStats = raw ? JSON.parse(raw) : {};
  } catch (e) {
    drillStats = {};
  }
}

function saveDrillStats() {
  try {
    localStorage.setItem(DRILL_STATS_KEY, JSON.stringify(drillStats));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - drill still works,
    // it just won't remember weak letters between sessions.
  }
}

function weightForChar(ch) {
  var s = drillStats[ch];
  if (!s || s.attempts === 0) return 3; // unseen letters shown at a moderate rate
  var errRate = s.errors / s.attempts;
  return 1 + errRate * 9; // ranges ~1 (mastered) to ~10 (frequently wrong)
}

function pickWeightedChar(pool) {
  var total = 0;
  var weights = [];
  for (var i = 0; i < pool.length; i++) {
    var w = weightForChar(pool[i].char);
    weights.push(w);
    total += w;
  }
  var r = Math.random() * total;
  for (var i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function generateDrillString(length, filterFn) {
  var pool = CHAR_POOL.filter(filterFn);
  if (pool.length === 0) pool = CHAR_POOL.slice();
  var out = [];
  var last = null;
  for (var i = 0; i < length; i++) {
    var pick, tries = 0;
    do {
      pick = pickWeightedChar(pool);
      tries++;
    } while (pick.char === last && pool.length > 1 && tries < 6);
    out.push(pick.char);
    last = pick.char;
  }
  return out.join(' ');
}

function recordDrillStats(ex, typed) {
  for (var i = 0; i < typed.length && i < ex.length; i++) {
    var target = ex[i];
    if (target === ' ') continue;
    if (!drillStats[target]) drillStats[target] = { attempts: 0, errors: 0 };
    drillStats[target].attempts++;
    if (!typed[i].correct) drillStats[target].errors++;
  }
  saveDrillStats();
}

function findKeyInfo(char) {
  for (var i = 0; i < ALL_KEYS.length; i++) {
    if (ALL_KEYS[i].mr === char) return { key: ALL_KEYS[i].en, shift: false };
    if (ALL_KEYS[i].shift === char) return { key: ALL_KEYS[i].en, shift: true };
  }
  return null;
}

function startDrillMode(kind) {
  var lenSelect = document.getElementById('drill-length');
  var length = lenSelect ? parseInt(lenSelect.value, 10) : 40;
  if (!length || length < 5) length = 40;

  var filterFn;
  if (kind === 'weak') {
    filterFn = function(p) {
      var s = drillStats[p.char];
      return s && s.attempts >= 3 && (s.errors / s.attempts) >= 0.15;
    };
    var weakCount = CHAR_POOL.filter(filterFn).length;
    if (weakCount < 5) {
      alert('Not enough drill history yet to build a "weak letters" set. Run a general Random Drill a couple of times first (so every key gets a few reps), then come back to this button.');
      return;
    }
  } else {
    filterFn = function() { return true; };
  }

  lastDrillKind = kind;
  drillMode = true;
  currentLesson = -1;
  currentExercise = 0;
  errors = 0;
  totalChars = 0;
  typedChars = [];
  isShiftPressed = false;
  isActive = false;
  clearInterval(timerInterval);

  var btns = document.querySelectorAll('.lesson-btn');
  for (var i = 0; i < btns.length; i++) { btns[i].classList.remove('active'); }

  var exString = generateDrillString(length, filterFn);
  drillLesson = {
    id: 'drill',
    title: kind === 'weak' ? 'Weak Letters Drill' : 'Random Letter Recall Drill',
    ex: [exString]
  };

  lessonInfo.innerHTML = kind === 'weak'
    ? '<strong>Weak Letters Drill:</strong> Only the letters you keep getting wrong, in a freshly shuffled order - every rep here is a real test, not a memorized pattern.'
    : '<strong>Random Letter Recall Drill:</strong> Every character on the full InScript layout, shuffled fresh right now. Nothing here can be memorized as a sequence - you have to actually know the key.';

  resetStats();
  resultsPanel.classList.remove('show');
  var report = document.getElementById('drill-report');
  if (report) report.classList.remove('show');
  highlightFocusKeys([]);
  document.getElementById('practice-section').classList.remove('hidden');
  document.getElementById('finger-guide').classList.remove('hidden');

  startPractice();
}

function renderDrillReport(ex, typed) {
  var report = document.getElementById('drill-report');
  if (!report) return;

  var byChar = {}; // char -> {attempts, errors}
  var order = [];
  for (var i = 0; i < typed.length && i < ex.length; i++) {
    var target = ex[i];
    if (target === ' ') continue;
    if (!byChar[target]) { byChar[target] = { attempts: 0, errors: 0 }; order.push(target); }
    byChar[target].attempts++;
    if (!typed[i].correct) byChar[target].errors++;
  }

  order.sort(function(a, b) {
    var ra = byChar[a].errors / byChar[a].attempts;
    var rb = byChar[b].errors / byChar[b].attempts;
    return rb - ra;
  });

  var missed = order.filter(function(c) { return byChar[c].errors > 0; });

  var html = '';
  if (missed.length === 0) {
    html = '<div class="drill-report-title">Every letter in this drill was correct. Excellent recall!</div>';
  } else {
    html += '<div class="drill-report-title">Letters to review from this session:</div>';
    html += '<div class="drill-report-grid">';
    for (var i = 0; i < missed.length; i++) {
      var c = missed[i];
      var info = findKeyInfo(c);
      var keyLabel = info ? (info.shift ? 'Shift+' + info.key.toUpperCase() : info.key.toUpperCase()) : '?';
      html += '<div class="drill-chip wrong">' +
        '<span class="drill-chip-char">' + c + '</span>' +
        '<span class="drill-chip-key">' + keyLabel + '</span>' +
        '<span class="drill-chip-rate">' + byChar[c].errors + '/' + byChar[c].attempts + ' wrong</span>' +
        '</div>';
    }
    html += '</div>';
  }
  report.innerHTML = html;
}

function resetResultsButtons() {
  var nextBtn = document.getElementById('btn-results-next');
  var againBtn = document.getElementById('btn-results-again');
  if (nextBtn) {
    nextBtn.textContent = 'Next Lesson';
    nextBtn.onclick = nextLesson;
  }
  if (againBtn) {
    againBtn.textContent = 'Practice Again';
    againBtn.onclick = restartLesson;
  }
}

function setDrillResultsButtons() {
  var nextBtn = document.getElementById('btn-results-next');
  var againBtn = document.getElementById('btn-results-again');
  if (nextBtn) {
    nextBtn.textContent = 'New Random Drill';
    nextBtn.onclick = function() { startDrillMode(lastDrillKind); };
  }
  if (againBtn) {
    againBtn.textContent = 'Retry This Same Set';
    againBtn.onclick = restartLesson;
  }
}

// Initialize on page load
init();
