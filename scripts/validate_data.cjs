const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const rootDir = path.resolve(__dirname, '..');
const pieceLessonsPath = path.join(rootDir, 'src/data/piece_lessons.json');
const specialRulesPath = path.join(rootDir, 'src/data/special_rules.json');
const tacticsPuzzlesPath = path.join(rootDir, 'src/data/tactics_puzzles.json');

let hasErrors = false;

function canExecuteMove(fen, moveStr) {
  // 1. Try standard SAN first (e.g. e4, exd5, Nf6, O-O, e8=Q, etc.)
  try {
    const c = new Chess(fen);
    const res = c.move(moveStr);
    if (res) return true;
  } catch (e) {}

  // 2. Try UCI format (e.g. e2e4, e7e8q)
  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(moveStr)) {
    try {
      const c = new Chess(fen);
      const from = moveStr.substring(0, 2);
      const to = moveStr.substring(2, 4);
      const promotion = moveStr.length === 5 ? moveStr[4].toLowerCase() : undefined;
      const res = c.move({ from, to, promotion });
      if (res) return true;
    } catch (e) {}
  }

  return false;
}

function validatePieceLessons() {
  console.log('\n========================================');
  console.log('1. Validating piece_lessons.json');
  console.log('========================================');
  if (!fs.existsSync(pieceLessonsPath)) {
    console.error('File not found: ' + pieceLessonsPath);
    hasErrors = true;
    return;
  }
  const data = JSON.parse(fs.readFileSync(pieceLessonsPath, 'utf8'));
  let totalLevels = 0;
  let errorCount = 0;

  for (const lesson of data) {
    console.log(`\nLesson [${lesson.id}] - ${lesson.nameZh || lesson.name}:`);
    for (const [idx, level] of (lesson.levels || []).entries()) {
      totalLevels++;
      try {
        const chess = new Chess(level.fen);
        if (level.goalType === 'make_move' && level.expectedMoves && level.expectedMoves.length > 0) {
          for (const expMove of level.expectedMoves) {
            if (!canExecuteMove(level.fen, expMove)) {
              throw new Error(`Expected move '${expMove}' cannot be executed in FEN "${level.fen}"`);
            }
          }
        }
        console.log(`  [OK] Level ${level.id} (${idx + 1}): Valid FEN & all moves [${level.fen}]`);
      } catch (err) {
        errorCount++;
        hasErrors = true;
        console.error(`  [ERROR] Level ${level.id} (${idx + 1}): Error -> ${err.message}`);
      }
    }
  }
  console.log(`\npiece_lessons.json result: ${totalLevels - errorCount}/${totalLevels} valid (${errorCount} errors)`);
}

function validateSpecialRules() {
  console.log('\n========================================');
  console.log('2. Validating special_rules.json');
  console.log('========================================');
  if (!fs.existsSync(specialRulesPath)) {
    console.error('File not found: ' + specialRulesPath);
    hasErrors = true;
    return;
  }
  const data = JSON.parse(fs.readFileSync(specialRulesPath, 'utf8'));
  let totalLevels = 0;
  let errorCount = 0;

  for (const rule of data) {
    console.log(`\nRule [${rule.id}] - ${rule.title}:`);
    for (const [idx, level] of (rule.levels || []).entries()) {
      totalLevels++;
      try {
        const chess = new Chess(level.fen);
        if (level.goalType === 'make_move' && level.expectedMoves && level.expectedMoves.length > 0) {
          for (const expMove of level.expectedMoves) {
            if (!canExecuteMove(level.fen, expMove)) {
              throw new Error(`Expected move '${expMove}' cannot be executed in FEN "${level.fen}"`);
            }
          }
        }
        console.log(`  [OK] Level ${level.id} (${idx + 1}): Valid FEN & all moves [${level.fen}]`);
      } catch (err) {
        errorCount++;
        hasErrors = true;
        console.error(`  [ERROR] Level ${level.id} (${idx + 1}): Error -> ${err.message}`);
      }
    }
  }
  console.log(`\nspecial_rules.json result: ${totalLevels - errorCount}/${totalLevels} valid (${errorCount} errors)`);
}

function validateTacticsPuzzles() {
  console.log('\n========================================');
  console.log('3. Validating tactics_puzzles.json');
  console.log('========================================');
  if (!fs.existsSync(tacticsPuzzlesPath)) {
    console.error('File not found: ' + tacticsPuzzlesPath);
    hasErrors = true;
    return;
  }
  const puzzles = JSON.parse(fs.readFileSync(tacticsPuzzlesPath, 'utf8'));
  let totalPuzzles = puzzles.length;
  let errorCount = 0;

  for (const [idx, puzzle] of puzzles.entries()) {
    try {
      const chess = new Chess(puzzle.fen);
      const expectedTurn = puzzle.turn === 'white' ? 'w' : 'b';
      if (chess.turn() !== expectedTurn) {
        throw new Error(`Turn mismatch: FEN says '${chess.turn()}', puzzle says '${puzzle.turn}' (${expectedTurn})`);
      }
      for (const [mIdx, moveStr] of puzzle.moves.entries()) {
        try {
          const res = chess.move(moveStr);
          if (!res) {
            throw new Error(`Move #${mIdx + 1} '${moveStr}' is illegal in position: ${chess.fen()}`);
          }
        } catch (mErr) {
          throw new Error(`Move #${mIdx + 1} '${moveStr}' failed: ${mErr.message} (position: ${chess.fen()})`);
        }
      }
    } catch (err) {
      errorCount++;
      hasErrors = true;
      console.error(`  [ERROR] Puzzle ${puzzle.id} (${idx + 1}/${totalPuzzles}) [${puzzle.title}]: ${err.message}`);
    }
  }
  console.log(`\ntactics_puzzles.json result: ${totalPuzzles - errorCount}/${totalPuzzles} valid (${errorCount} errors)`);
}

console.log('Starting full data validation...');
validatePieceLessons();
validateSpecialRules();
validateTacticsPuzzles();

if (hasErrors) {
  console.error('\n[ERROR] DATA VALIDATION FAILED!');
  process.exit(1);
} else {
  console.log('\n[SUCCESS] ALL DATA VALIDATED SUCCESSFULLY! (Exit code: 0)');
  process.exit(0);
}
