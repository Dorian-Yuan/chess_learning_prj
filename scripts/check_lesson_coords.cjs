const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const rootDir = path.resolve(__dirname, '..');
const pieceLessonsPath = path.join(rootDir, 'src/data/piece_lessons.json');
const specialRulesPath = path.join(rootDir, 'src/data/special_rules.json');
const tacticsPuzzlesPath = path.join(rootDir, 'src/data/tactics_puzzles.json');

const PIECE_NAMES = {
  p: '兵',
  n: '马',
  b: '象',
  r: '车',
  q: '后',
  k: '王'
};

function getFenPieces(fen) {
  const chess = new Chess(fen);
  const board = chess.board();
  const pieces = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = String.fromCharCode('a'.charCodeAt(0) + c) + (8 - r);
      const piece = board[r][c];
      if (piece) {
        pieces[square] = {
          square,
          type: piece.type,
          color: piece.color,
          nameZh: (piece.color === 'w' ? '白' : '黑') + PIECE_NAMES[piece.type]
        };
      }
    }
  }
  return { chess, pieces };
}

function parseExpectedMoves(fen, moves) {
  const endpoints = new Set();
  const movePairs = [];

  for (const moveStr of moves || []) {
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(moveStr)) {
      const from = moveStr.slice(0, 2).toLowerCase();
      const to = moveStr.slice(2, 4).toLowerCase();
      endpoints.add(from);
      endpoints.add(to);
      movePairs.push({ from, to, raw: moveStr });
    } else {
      try {
        const c = new Chess(fen);
        const res = c.move(moveStr);
        if (res) {
          endpoints.add(res.from);
          endpoints.add(res.to);
          movePairs.push({ from: res.from, to: res.to, raw: moveStr });
        }
      } catch (e) {}
    }
  }
  return { endpoints, movePairs };
}

function extractCoords(text) {
  if (!text) return [];
  const regex = /(?:^|[^a-zA-Z0-9])([a-h][1-8])(?:$|[^a-zA-Z0-9])/g;
  const coords = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    coords.push({
      coord: match[1].toLowerCase(),
      index: match.index,
      context: text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + 20))
    });
  }
  return coords;
}

console.log('=== FULL AUDIT OF PUZZLES (54 PUZZLES) ===\n');
const puzzles = JSON.parse(fs.readFileSync(tacticsPuzzlesPath, 'utf8'));

let puzzleIssues = 0;
for (const [idx, p] of puzzles.entries()) {
  const { chess, pieces } = getFenPieces(p.fen);
  const { endpoints } = parseExpectedMoves(p.fen, p.moves);

  const fields = [
    { name: 'hint', text: p.hint },
    { name: 'explanation', text: p.explanation },
    { name: 'title', text: p.title }
  ];

  for (const f of fields) {
    const coords = extractCoords(f.text);
    for (const c of coords) {
      const sq = c.coord;
      const piece = pieces[sq];
      const inMoves = endpoints.has(sq);

      // Check if text mentions piece at this square and whether it matches
      let note = '';
      if (piece && inMoves) {
        note = `[OK: FEN piece ${piece.nameZh} & move endpoint]`;
      } else if (piece) {
        note = `[OK: FEN piece ${piece.nameZh}]`;
      } else if (inMoves) {
        note = `[OK: Move endpoint]`;
      } else {
        note = `[NEITHER FEN NOR MOVE ENDPOINT]`;
        puzzleIssues++;
      }
      console.log(`Puzzle #${idx + 1} [${p.id}] "${p.title}" | ${f.name} -> ${sq.toUpperCase()} ${note}: "${c.context.trim()}"`);
    }
  }
}
console.log(`\nTotal flagged [NEITHER] in puzzles: ${puzzleIssues}`);
