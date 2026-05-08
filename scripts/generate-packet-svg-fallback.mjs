/**
 * Writes src/branding/packet-01-12-gold-data-uri.ts from the inline SVG master
 * when no raster 01-12-GOLD file is available. Run: node scripts/generate-packet-svg-fallback.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 200" width="960" height="200">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#fde68a"/><stop offset=".45" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/>
</linearGradient>
<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0f2844"/><stop offset="1" stop-color="#050d16"/>
</linearGradient>
<radialGradient id="glow" cx="78%" cy="45%" r="55%">
<stop offset="0" stop-color="#fbbf24" stop-opacity=".18"/><stop offset="1" stop-color="#0a1628" stop-opacity="0"/>
</radialGradient>
<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs>
<rect width="960" height="200" fill="#0a1628"/>
<rect width="960" height="200" fill="url(#glow)"/>
<g opacity=".55" stroke="#1e40af" stroke-width="1.1" fill="none">
<path d="M0 42h140l20 18h120M0 158h220M40 0v72M320 0v88h160M520 190h440M620 0v130h200M860 20v160"/>
<path d="M200 120h140l24-28h80M780 8h140M920 8v184"/>
<circle cx="140" cy="42" r="2.5" fill="#38bdf8" stroke="none"/><circle cx="780" cy="130" r="2" fill="#fbbf24" stroke="none"/>
</g>
<g opacity=".32" stroke="url(#g)" stroke-width=".9" fill="none">
<path d="M48 178l32-16 28 8 44-28"/><path d="M24 24l36 12 8 32"/><path d="M420 64h88l12 20h64"/>
</g>
<rect x="560" y="24" width="360" height="152" rx="10" fill="url(#panel)" stroke="url(#g)" stroke-width="1.2" stroke-opacity=".45"/>
<ellipse cx="778" cy="98" rx="68" ry="84" fill="#030912" stroke="url(#g)" stroke-width="2.2"/>
<path fill="url(#g)" opacity=".28" filter="url(#blur)" d="M778 36c-32 0-52 26-52 54 0 20 11 36 27 44 7 14 22 20 22 36h6c0-16 15-22 22-36 16-8 27-24 27-44 0-28-20-54-52-54z"/>
<path fill="none" stroke="url(#g)" stroke-width="1.4" opacity=".5" d="M738 78c16-24 44-34 72-28 14 18 22 40 22 62"/>
<rect x="48" y="26" width="124" height="26" rx="5" fill="#050d16" stroke="url(#g)" stroke-width="1" opacity=".85"/>
<text x="62" y="44" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" letter-spacing=".4em" fill="#fde68a">VISIONARY</text>
<text x="48" y="112" font-family="Georgia,Times New Roman,serif" font-size="50" font-weight="700" fill="url(#g)">Delicious</text>
<text x="48" y="148" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" letter-spacing=".32em" fill="#94a3b8">CATERING &amp; EVENTS</text>
<text x="48" y="172" font-family="Georgia,serif" font-size="14" fill="#fcd34d" opacity=".95">by Wendy</text>
</svg>`;

const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
const outPath = path.join(root, "src", "branding", "packet-01-12-gold-data-uri.ts");
const header =
  "/**\n" +
  " * PACKET: 01-12-GOLD — visionary hero (SVG vector master).\n" +
  " * Navy #0a1628 field, circuitry, gold Delicious lockup, portrait medallion.\n" +
  " * Raster: npm run encode:packet -- path/to/01-12-GOLD.png\n" +
  " */\n";
const body = `export const PACKET_01_12_GOLD_DATA_URI = ${JSON.stringify(dataUri)} as const;\n`;
fs.writeFileSync(outPath, header + body, "utf8");
console.log(`OK → ${path.relative(root, outPath)} (${((header + body).length / 1024).toFixed(1)} KB)`);
