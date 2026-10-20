// 인스타 프로필 사진(1080×1080) → out/profile.png. 원형으로 잘리니 가운데에 로고만
import { readFileSync, mkdirSync } from "fs";
const font = readFileSync(new URL("fonts/PretendardVariable.woff2", import.meta.url)).toString("base64");
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:P;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:45 920}
html,body{margin:0}body{width:1080px;height:1080px;background:#0e0e10;display:grid;place-items:center}
b{font:800 300px/1 P;color:#fff;letter-spacing:-.06em}i{font-style:normal;color:#19e0a8}</style><b>seum<i>.</i></b>`;
mkdirSync(new URL("out/", import.meta.url), { recursive: true });
const { chromium } = await import("playwright");
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1080 } });
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: new URL("out/profile.png", import.meta.url).pathname });
await br.close(); console.log("out/profile.png");
