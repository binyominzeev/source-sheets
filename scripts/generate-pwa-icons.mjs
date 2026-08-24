// Generates PWA/app icons from the Tabler Icons "folders" (filled) glyph.
// Run with: node scripts/generate-pwa-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Tabler Icons "folders" (filled), MIT licensed, viewBox 0 0 24 24.
const FOLDERS_PATH =
  "M12 2a1 1 0 0 1 .707 .293l1.708 1.707h4.585a3 3 0 0 1 2.995 2.824l.005 .176v7a3 3 0 0 1 -3 3h-1v1a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-9a3 3 0 0 1 3 -3h1v-1a3 3 0 0 1 3 -3zm-6 6h-1a1 1 0 0 0 -1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1 -1v-1h-7a3 3 0 0 1 -3 -3z";

const BACKGROUND = "#ffffff";
const FOREGROUND = "#000000";

// glyphScale controls how much of the square the icon occupies (padding = 1 - scale).
function buildSvg(size, glyphScale) {
  const glyphSize = size * glyphScale;
  const offset = (size - glyphSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <g transform="translate(${offset} ${offset}) scale(${glyphSize / 24})">
    <path d="${FOLDERS_PATH}" fill="${FOREGROUND}"/>
  </g>
</svg>`;
}

async function renderPng(svg, outPath) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`wrote ${path.relative(rootDir, outPath)}`);
}

async function renderPngBuffer(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  // Standard icons: glyph fills most of the square.
  await renderPng(
    buildSvg(192, 0.72),
    path.join(rootDir, "public/icons/icon-192.png")
  );
  await renderPng(
    buildSvg(512, 0.72),
    path.join(rootDir, "public/icons/icon-512.png")
  );

  // Maskable icon: Android may crop up to ~20%, so keep the glyph within the safe zone.
  await renderPng(
    buildSvg(512, 0.5),
    path.join(rootDir, "public/icons/icon-maskable-512.png")
  );

  // iOS ignores transparency, so this must be a fully opaque background.
  await renderPng(
    buildSvg(180, 0.72),
    path.join(rootDir, "public/icons/apple-touch-icon.png")
  );

  // Next.js metadata file conventions (browser tab favicon / iOS Safari bookmark icon).
  await renderPng(buildSvg(32, 0.72), path.join(rootDir, "src/app/icon.png"));
  await renderPng(
    buildSvg(180, 0.72),
    path.join(rootDir, "src/app/apple-icon.png")
  );

  // favicon.ico for browsers/tabs that request it directly (bypassing the metadata link tags).
  const icoBuffer = await pngToIco([
    await renderPngBuffer(buildSvg(16, 0.72)),
    await renderPngBuffer(buildSvg(32, 0.72)),
    await renderPngBuffer(buildSvg(48, 0.72)),
  ]);
  const icoPath = path.join(rootDir, "src/app/favicon.ico");
  await writeFile(icoPath, icoBuffer);
  console.log(`wrote ${path.relative(rootDir, icoPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
