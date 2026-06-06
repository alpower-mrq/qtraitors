/* Compress all shipped images to WebP. Run with: npm run compress:assets
   Source PNGs live in /assets; the served/compressed copies live in /public. */
import sharp from "sharp";
import { access, readdir, stat, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

let totalBefore = 0;
let totalAfter = 0;

async function toWebp(srcPng, { quality, alpha }) {
  try {
    await access(srcPng);
  } catch {
    return; // already converted (PNG gone) — idempotent
  }
  const out = srcPng.replace(/\.png$/i, ".webp");
  const before = (await stat(srcPng)).size;
  const opts = { quality, effort: 6 };
  if (alpha) opts.alphaQuality = 100;
  await sharp(srcPng).webp(opts).toFile(out);
  const after = (await stat(out)).size;
  await unlink(srcPng); // drop the heavy PNG; master stays in /assets
  totalBefore += before;
  totalAfter += after;
  console.log(`  ${srcPng.replace(pub, "")}  ${kb(before)} → ${kb(after)}`);
}

console.log("Backgrounds + logos:");
await toWebp(join(pub, "hp-bg.png"), { quality: 72, alpha: false });
await toWebp(join(pub, "game-bg.png"), { quality: 72, alpha: false });
await toWebp(join(pub, "qtraitors-logo.png"), { quality: 88, alpha: true });
await toWebp(join(pub, "coin-logo.png"), { quality: 90, alpha: true });

console.log("Avatars:");
const avDir = join(pub, "avatars");
const pngs = (await readdir(avDir)).filter((f) => f.toLowerCase().endsWith(".png"));
for (const f of pngs.sort((a, b) => parseInt(a) - parseInt(b))) {
  await toWebp(join(avDir, f), { quality: 80, alpha: true });
}

console.log(`\nTOTAL  ${kb(totalBefore)} → ${kb(totalAfter)}  (saved ${kb(totalBefore - totalAfter)})`);
