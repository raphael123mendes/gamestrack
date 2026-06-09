#!/usr/bin/env node
/**
 * generate-games-json.js
 * Drop this in the root of your repo alongside your game HTML files.
 * Run:  node generate-games-json.js
 *
 * What it does:
 *   1. Scans every .html file in the current directory (skips index.html)
 *   2. Reads each file's <title> and <meta name="description"> for auto-fill
 *   3. Merges with any existing games.json — hand-written fields are preserved
 *   4. Writes games.json back to disk
 *
 * After running, just refresh index.html — no other changes needed.
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = process.cwd();
const OUT_FILE  = path.join(ROOT, 'games.json');
const SKIP      = new Set(['index.html']);

// ── parse helpers ────────────────────────────────────────────────────────────

function extractMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
  const desc  = (
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) || []
  )[1] || '';
  const h1    = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1] || '';
  return {
    title: title.trim(),
    description: desc.trim(),
    h1: h1.trim(),
  };
}

function slugToTitle(filename) {
  return filename
    .replace(/\.html$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function pickEmoji(name) {
  const n = name.toLowerCase();
  if (/snake/i.test(n))              return '🐍';
  if (/tetris|block/i.test(n))       return '🟦';
  if (/chess/i.test(n))              return '♟️';
  if (/memory|match/i.test(n))       return '🃏';
  if (/pong/i.test(n))               return '🏓';
  if (/pac.?man/i.test(n))           return '👻';
  if (/space|shoot|invader/i.test(n))return '🚀';
  if (/maze|dungeon/i.test(n))       return '🗺️';
  if (/quiz|trivia/i.test(n))        return '❓';
  if (/puzzle/i.test(n))             return '🧩';
  if (/minesweep/i.test(n))          return '💣';
  if (/sudoku/i.test(n))             return '🔢';
  if (/word|boggle|scrabble/i.test(n))return '📝';
  if (/card|solitaire/i.test(n))     return '🂡';
  if (/race|car/i.test(n))           return '🏎️';
  if (/jump|platform/i.test(n))      return '🦘';
  if (/flapp/i.test(n))              return '🐦';
  if (/2048/i.test(n))               return '🔢';
  if (/breakout|brick/i.test(n))     return '🧱';
  if (/typing/i.test(n))             return '⌨️';
  if (/click|clicker/i.test(n))      return '🖱️';
  return '🎮';
}

// ── main ─────────────────────────────────────────────────────────────────────

const existing = fs.existsSync(OUT_FILE)
  ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'))
  : { games: [] };

// index existing entries by file so we can merge
const byFile = {};
for (const g of existing.games || []) byFile[g.file] = g;

const files = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && !SKIP.has(f))
  .sort();

if (files.length === 0) {
  console.log('No game HTML files found in', ROOT);
  process.exit(0);
}

const games = files.map(file => {
  const html  = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const meta  = extractMeta(html);
  const prev  = byFile[file] || {};

  const name        = prev.name        || meta.title || meta.h1 || slugToTitle(file);
  const description = prev.description || meta.description || '';
  const emoji       = prev.emoji       || pickEmoji(name);
  const tags        = prev.tags        || [];

  return { file, name, description, emoji, tags };
});

const out = { ...existing, games };
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));

console.log(`\n✅  games.json written — ${games.length} game(s):\n`);
games.forEach(g => console.log(`   ${g.emoji}  ${g.name.padEnd(24)} →  ${g.file}`));
console.log('\n💡  Tip: add a <meta name="description" content="..."> to each game');
console.log('    for richer descriptions, or edit games.json directly.\n');
