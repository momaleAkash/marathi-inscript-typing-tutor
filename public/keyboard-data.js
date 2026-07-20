// ============================================================
// INSCRIPT MARATHI KEYBOARD DATA
// ============================================================
// This maps physical English keys to Marathi characters.
// Normal press = 'mr' character, Shift+press = 'shift' character
// The tutor captures raw keydown events and translates them internally.
// NO external InScript keyboard driver needed!
// ============================================================

var KBD = {
  row1: [
    { en: "`", mr: "", shift: "", f: "LP" },
    { en: "1", mr: "१", shift: "ॲ", f: "LP" },
    { en: "2", mr: "२", shift: "ॅ", f: "LR" },
    { en: "3", mr: "३", shift: "्र", f: "LM" },
    { en: "4", mr: "४", shift: "र्", f: "LI" },
    { en: "5", mr: "५", shift: "ज्ञ", f: "LI" },
    { en: "6", mr: "६", shift: "त्र", f: "RI" },
    { en: "7", mr: "७", shift: "क्‍ष", f: "RI" },
    { en: "8", mr: "८", shift: "श्र", f: "RM" },
    { en: "9", mr: "९", shift: "(", f: "RR" },
    { en: "0", mr: "०", shift: ")", f: "RP" },
    { en: "-", mr: "-", shift: "ः", f: "RP" },
    { en: "=", mr: "ृ", shift: "ऋ", f: "RP" }
  ],
  row2: [
    { en: "Q", mr: "ौ", shift: "औ", f: "LP" },
    { en: "W", mr: "ै", shift: "ऐ", f: "LR" },
    { en: "E", mr: "ा", shift: "आ", f: "LM" },
    { en: "R", mr: "ी", shift: "ई", f: "LI" },
    { en: "T", mr: "ू", shift: "ऊ", f: "LI" },
    { en: "Y", mr: "ब", shift: "भ", f: "RI" },
    { en: "U", mr: "ह", shift: "ङ", f: "RI" },
    { en: "I", mr: "ग", shift: "घ", f: "RM" },
    { en: "O", mr: "द", shift: "ध", f: "RR" },
    { en: "P", mr: "ज", shift: "झ", f: "RP" },
    { en: "[", mr: "ड", shift: "ढ", f: "RP" },
    { en: "]", mr: "़", shift: "़", f: "RP" },
    { en: "\\", mr: "ॉ", shift: "ऑ", f: "RP" }
  ],
  row3: [
    { en: "A", mr: "ो", shift: "ओ", f: "LP" },
    { en: "S", mr: "े", shift: "ए", f: "LR" },
    { en: "D", mr: "्", shift: "अ", f: "LM" },
    { en: "F", mr: "ि", shift: "इ", f: "LI" },
    { en: "G", mr: "ु", shift: "उ", f: "LI" },
    { en: "H", mr: "प", shift: "फ", f: "RI" },
    { en: "J", mr: "र", shift: "ऱ", f: "RI" },
    { en: "K", mr: "क", shift: "ख", f: "RM" },
    { en: "L", mr: "त", shift: "थ", f: "RR" },
    { en: ";", mr: "च", shift: "छ", f: "RP" },
    { en: "'", mr: "ट", shift: "ठ", f: "RP" }
  ],
  row4: [
    { en: "Z", mr: "", shift: "", f: "LP" },
    { en: "X", mr: "ं", shift: "ँ", f: "LR" },
    { en: "C", mr: "म", shift: "ण", f: "LM" },
    { en: "V", mr: "न", shift: "", f: "LI" },
    { en: "B", mr: "व", shift: "ळ", f: "LI" },
    { en: "N", mr: "ल", shift: "ळ", f: "RI" },
    { en: "M", mr: "स", shift: "श", f: "RM" },
    { en: ",", mr: ",", shift: "ष", f: "RR" },
    { en: ".", mr: ".", shift: "।", f: "RR" },
    { en: "/", mr: "य", shift: "", f: "RP" }
  ]
};

// Build flat lookup maps for quick key-to-char translation
var KEY_MAP = {};
var SHIFT_KEY_MAP = {};
var ALL_KEYS = KBD.row1.concat(KBD.row2).concat(KBD.row3).concat(KBD.row4);

for (var i = 0; i < ALL_KEYS.length; i++) {
  var k = ALL_KEYS[i];
  var lowerEn = k.en.toLowerCase();
  if (k.mr) KEY_MAP[lowerEn] = k.mr;
  if (k.shift) SHIFT_KEY_MAP[lowerEn] = k.shift;
}

// Special: space maps to space
KEY_MAP[' '] = ' ';

// ============================================================
// SHIFTED CHARACTER TO BASE KEY MAPPING
// ============================================================
// When Shift is held, e.key returns the shifted symbol (e.g., '{' instead of '[').
// This map converts shifted symbols back to their base key for lookup.
// ============================================================
var SHIFT_TO_BASE = {
  // Numbers row
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  // Top letter row
  '{': '[',
  '}': ']',
  '|': '\\',
  // Home row
  ':': ';',
  '"': "'",
  // Bottom row
  '<': ',',
  '>': '.',
  '?': '/'
};
