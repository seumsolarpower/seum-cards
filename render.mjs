// 그날 콘텐츠(content/날짜.json)의 카드를 JPG로 찍음 → out/날짜/세트id-번호.jpg
// 실행: node render.mjs 2026-10-20   (HTML=1: 브라우저 없이 HTML만 저장해서 확인)
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { cardHtml } from "./lib/cards.mjs";

const date = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const dir = new URL(`out/${date}/`, import.meta.url);
mkdirSync(dir, { recursive: true });

const jobs = C.sets.flatMap(s => s.cards.map((c, i) => ({ file: `${s.id}-${i + 1}.jpg`, html: cardHtml(c, i + 1, s.cards.length, C.palette, C.brand) })));
if (process.env.HTML === "1") {
  for (const j of jobs) writeFileSync(new URL(j.file.replace(".jpg", ".html"), dir), j.html);
  console.log(`HTML ${jobs.length}개 저장: out/${date}/`);
  process.exit(0);
}

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
for (const j of jobs) {
  await page.setContent(j.html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // 인스타 게시는 JPG만 받음
  await page.screenshot({ path: new URL(j.file, dir).pathname, type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  console.log("찍음", j.file);
}
await browser.close();
writeFileSync(new URL("manifest.json", dir), JSON.stringify(C.sets.map(s => ({ id: s.id, files: s.cards.map((_, i) => `${s.id}-${i + 1}.jpg`) })), null, 2));
