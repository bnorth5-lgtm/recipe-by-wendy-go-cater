/**
 * Regenerates src/branding/packet-01-12-gold-data-uri.ts from a source image.
 * Usage:
 *   npm run encode:packet
 *   npm run encode:packet -- path/to/01-12-GOLD.png
 *
 * Default input: public/brand-hero-gold.png (PACKET: 01-12-GOLD visionary asset).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const arg = process.argv[2];
const src = arg ? path.resolve(arg) : path.join(root, "public", "brand-hero-gold.png");

if (!fs.existsSync(src)) {
  console.error("");
  console.error("  PACKET 01-12-GOLD source image not found.");
  console.error(`  Expected: ${src}`);
  console.error("");
  console.error("  Add the high-fidelity PNG (navy circuitry, portrait, gold branding), then run:");
  console.error("    npm run encode:packet");
  console.error("  Or:");
  console.error("    npm run encode:packet -- \"C:\\\\path\\\\to\\\\01-12-GOLD.png\"");
  console.error("");
  process.exit(1);
}

const ext = path.extname(src).toLowerCase();
const mimeFromExt =
  ext === ".png" ? "image/png" :
  ext === ".webp" ? "image/webp" :
  ext === ".gif" ? "image/gif" :
  ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
  "application/octet-stream";

const buf = fs.readFileSync(src);

/** Prefer magic bytes so public/brand-hero-gold.png can still be JPEG data. */
function mimeFromBuffer(b) {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 6 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return "image/webp";
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  return mimeFromExt;
}

const resolvedMime = mimeFromBuffer(buf);
const dataUri = `data:${resolvedMime};base64,${buf.toString("base64")}`;
const outPath = path.join(root, "src", "branding", "packet-01-12-gold-data-uri.ts");

const header =
  "/**\n" +
  " * PACKET: 01-12-GOLD — visionary hero data URI.\n" +
  ` * Generated from: ${path.relative(root, src).replace(/\\/g, "/")}\n` +
  " * Regenerate: npm run encode:packet\n" +
  " */\n";

const body = `export const PACKET_01_12_GOLD_DATA_URI = ${JSON.stringify(dataUri)} as const;\n`;
const content = header + body;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");

console.log(`OK → ${path.relative(root, outPath)} (${(content.length / 1024).toFixed(1)} KB, source ${(buf.length / 1024).toFixed(1)} KB)`);
