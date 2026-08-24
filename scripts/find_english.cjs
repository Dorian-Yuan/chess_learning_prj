const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

const ALLOWED = new Set([
  'Stockfish',
  'stockfish',
  'PGN',
  'pgn',
  'FEN',
  'fen',
  'Elo',
  'elo',
  'SAN',
  'san',
  'UCI',
  'uci',
  'WASM',
  'wasm',
  'ECO',
  'eco',
]);

function checkText(text, source) {
  // Check for Chinese + English in parentheses e.g. 击双 (Fork)
  const parenMatches = text.match(/[\u4e00-\u9fa5]+[（\(][A-Za-z\s\/-]+[）\)]|[（\(][A-Za-z\s\/-]+[）\)][\u4e00-\u9fa5]+/g);
  if (parenMatches) {
    for (const m of parenMatches) {
      console.log(`[PAREN] ${source} -> ${m}`);
    }
  }

  // Check for English UI subtitles like "外观与棋盘主题 (APPEARANCE)", "VS STOCKFISH", "ABS 音效"
  if (/APPEARANCE|AUDIO|ANIMATION|ENGINE|WORKBENCH|FORK|PIN|KNIGHT|QUEEN|BISHOP|ROOK|KING|PAWN|CASTLING|PROMOTION|EN PASSANT|STALEMATE|CHECKMATE|ABS/i.test(text)) {
    if (/[\u4e00-\u9fa5]/.test(text) || /[A-Z]{2,}/.test(text)) {
      console.log(`[KEYWORD] ${source} -> ${text.trim()}`);
    }
  }
}

function processJson(filePath) {
  const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  function traverse(obj, curPath) {
    if (typeof obj === 'string') {
      checkText(obj, `${rel} [${curPath}]`);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, idx) => traverse(item, `${curPath}[${idx}]`));
    } else if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        traverse(v, `${curPath}.${k}`);
      }
    }
  }
  traverse(data, '');
}

function processTs(filePath) {
  const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('export interface') || trimmed.startsWith('export type')) {
      return;
    }
    // Extract template literals or strings
    const strMatches = trimmed.match(/(['"`])(?:(?=(\\?))\2[\s\S])*?\1/g);
    if (strMatches) {
      for (const s of strMatches) {
        checkText(s, `${rel}:${idx + 1}`);
      }
    }
  });
}

function scanDir(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDir(full);
    } else if (item.name.endsWith('.json')) {
      processJson(full);
    } else if (item.name.endsWith('.ts')) {
      processTs(full);
    }
  }
}

scanDir(srcDir);
