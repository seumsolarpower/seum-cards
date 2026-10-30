// HTML 파일을 그 크기 그대로 PNG로 찍음 (DM으로 보낼 정리 이미지 등)
// 실행: node shot.mjs content/2026-10-30-dm out/2026-10-30/dm   (폴더 안 *.html 전부, 크기는 html,body의 width·height)
import { readdirSync, mkdirSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "url";
const [src, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { chromium } = await import("playwright");
const browser = await chromium.launch(), page = await browser.newPage({ deviceScaleFactor: 1 });
for (const f of readdirSync(src).filter(f => f.endsWith(".html"))) {
  await page.goto(pathToFileURL(resolve(src, f)).href); await page.evaluate(() => document.fonts.ready);
  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: resolve(out, f.replace(/\.html$/, ".png")) }); console.log("찍음", f, w + "×" + h);
}
await browser.close();
