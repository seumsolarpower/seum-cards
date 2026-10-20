// 그날 카드 전부를 한 장의 HTML로 모아 봄 (폰·브라우저에서 확인용) → out/날짜/preview.html
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { cardInner, cardCss } from "./lib/cards.mjs";

const date = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const sets = C.sets.map(s => `<h2>${s.id}</h2><div class="row">${s.cards.map((c, i) => cardInner(c, i + 1, s.cards.length, C.brand)).join("")}</div>`).join("");
const out = new URL(`out/${date}/`, import.meta.url); mkdirSync(out, { recursive: true });
writeFileSync(new URL("preview.html", out), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${date} 카드</title><style>${cardCss(C.palette)}
html,body{background:#f2f2f0}body{font-family:var(--f);padding:16px;max-width:1200px;margin:0 auto}h2{font:800 18px/1.3 var(--f);margin:24px 0 10px}
.row{display:grid;gap:14px;max-width:560px;margin:0 auto}
.row .card{width:100%;height:auto;aspect-ratio:4/5;box-shadow:0 2px 10px rgb(0 0 0/.15)}
h2{max-width:560px;margin-left:auto!important;margin-right:auto!important}</style></head><body><h1 style="font:800 24px var(--f)">${date}</h1>${sets}</body></html>`);
console.log(`out/${date}/preview.html`);
