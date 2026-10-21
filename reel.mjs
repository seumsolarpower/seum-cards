// 세트 하나를 릴스 영상(1080×1920, 30fps, 무음 오디오 트랙)으로 만듦 → out/날짜/세트id-reel.mp4
// 카드 HTML을 그대로 세로 화면에 얹고, 장마다 등장 움직임을 넣어 프레임을 찍은 뒤 ffmpeg으로 합침.
// 실행: node reel.mjs 2026-10-20 [세트id]   (ffmpeg 필요. 세트를 안 주면 전부)
// 음악은 안 넣음: 유행 음원은 인스타 앱에서 직접 고르고, 무음 트랙은 API 게시용 (오디오 없는 영상을 거부하는 경우 대비)
// 장 길이는 카드에 "reel": {"dur": 3} 로 바꿀 수 있음. 없으면 종류별 기본값 + 마지막 등장 뒤 1.3초.
import { readFileSync, mkdirSync } from "fs";
import { spawn } from "child_process";
import { cardInner, cardCss } from "./lib/cards.mjs";

const date = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), only = process.argv[3];
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const dir = new URL(`out/${date}/`, import.meta.url);
mkdirSync(new URL("reel-stills/", dir), { recursive: true });
const FPS = 30, W = 1080, H = 1920;
const BASE = { cover: 2.4, jjal: 2.8, meme: 3.6, summary: 3.4 }, INFO = 3.2;

// 화면: 카드를 90%(972×1215, 정수 픽셀이라 가장자리 틈 없음)로 가운데보다 조금 위에. 아래 약 400px는 인스타 캡션·버튼 자리라 비움
const STAGE = `
html,body{background:#0e0e10;overflow:hidden}
.stage{position:absolute;left:54px;top:300px;width:1080px;height:1350px;transform:scale(.9);transform-origin:0 0;border-radius:30px;overflow:hidden}
.prog{position:absolute;left:54px;right:54px;top:258px;display:flex;gap:10px}
.prog i{flex:1;height:6px;border-radius:3px;background:rgb(255 255 255/.22);overflow:hidden}
.prog i b{display:block;height:100%;background:#fff;transform-origin:0 0}
.top>span:last-child,.top2>span:last-child{visibility:hidden}
.mk{background:linear-gradient(var(--mk),var(--mk)) 0 0/0% 100% no-repeat}
.bw i{transform-origin:50% 100%}
@keyframes in{from{opacity:0;translate:0 3cqw}to{opacity:1;translate:0 0}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{opacity:0;scale:.6}60%{opacity:1;scale:1.06}100%{opacity:1;scale:1}}
@keyframes kb{from{scale:1}to{scale:1.08}}
@keyframes sweep{from{background-size:0% 100%}to{background-size:100% 100%}}
@keyframes grow{from{scale:1 0}to{scale:1 1}}
@keyframes fill{from{scale:0 1}to{scale:1 1}}
@keyframes enter{from{opacity:.4;scale:.985}to{opacity:1;scale:1}}`;

// 종류별 등장 순서: [선택자, 움직임, 시작(초), 여러 개면 간격]
const INFO_PLAN = [[".phw img", "kb"], [".phw .bub", "pop", .5], [".kick,.kick2", "in", .1], [".big", "in", .25],
  [".hv", "in", .6], [".hl2", "in", .9], [".stats div", "in", .6, .12], [".bw i", "grow", .6, .06], [".bl", "fade", 1.1],
  [".def", "in", .6], [".cmp div", "in", .6, .2], [".body", "in", 1.4], [".ft", "fade", 1.7]];
const PLAN = {
  cover: [[".card>img", "kb"], [".hd small", "in", .05], [".hd", "in", .1], [".say", "pop", .45], [".bub", "pop", .7], [".lb", "in", .9, .15]],
  jjal: [[".card>img", "fade", 0], [".jt", "in", .15], [".jb", "pop", 1.1]],
  meme: [[".kick", "in", .1], [".big", "in", .2], [".mf", "in", .3], [".ov", "pop", .8, .7], [".body", "in", "after"]],
  summary: [[".card>img", "kb"], [".kick", "in", .1], [".sum", "fade", .2], [".sum li", "in", .35, .35], [".q", "pop", "after"], [".cta", "in", "after2"]],
};

// 페이지 안에서 도는 코드: 움직임 붙이기 + 특정 시각으로 맞추기(__seek)
function pageScript(plan, dur, idx) {
  return `(() => {
const plan = ${JSON.stringify(plan)}, dur = ${dur};
let last = 0;
const anim = (el, k, at, d) => { el.style.animation = k + " " + d + "s cubic-bezier(.2,.8,.2,1) " + at + "s both"; el.dataset.at = at; last = Math.max(last, at) };
for (const [sel, k, at0 = 0, gap = 0] of plan) {
  const at = at0 === "after" ? last + .7 : at0 === "after2" ? last + .4 : at0;
  document.querySelectorAll(".stage " + sel).forEach((el, i) => k === "kb" ? (el.style.animation = "kb " + dur + "s linear both") : anim(el, k, +(at + i * gap).toFixed(2), k === "pop" ? .5 : .45));
}
// 형광펜은 감싸는 글이 나온 뒤 쓱
document.querySelectorAll(".stage .mk").forEach(el => { const p = el.closest("[data-at]"); anim(el, "sweep", (p ? +p.dataset.at : 0) + .35, .5) });
document.querySelector(".stage").style.animation = "enter .25s ease-out both";
document.querySelectorAll(".prog b").forEach((b, i) => i === ${idx} ? (b.style.animation = "fill " + dur + "s linear both") : (b.style.scale = i < ${idx} ? "1 1" : "0 1"));
// 큰 숫자는 0부터 올라감
const hv = [...document.querySelectorAll(".stage .hv")].map(el => { const m = el.textContent.match(/^([^\\d]*)([\\d,]*\\.?\\d+)(.*)$/); return m && { el, m, to: +m[2].replace(/,/g, ""), dp: (m[2].split(".")[1] || "").length, comma: m[2].includes(",") } }).filter(Boolean);
const anims = document.getAnimations(); anims.forEach(a => a.pause());
window.__last = last;
window.__seek = t => {
  anims.forEach(a => a.currentTime = t * 1000);
  for (const h of hv) { const p = Math.min(1, Math.max(0, (t - .6) / .9)), e = 1 - Math.pow(1 - p, 3), v = (h.to * e).toFixed(h.dp);
    h.el.textContent = h.m[1] + (h.comma ? Number(v).toLocaleString("en-US", { minimumFractionDigits: h.dp }) : v) + h.m[3] }
};
})()`;
}

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const css = cardCss(C.palette) + STAGE;

for (const s of C.sets.filter(s => !only || s.id === only)) {
  const out = new URL(`${s.id}-reel.mp4`, dir).pathname;
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "medium", "-crf", "19", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, no) => ff.on("close", c => c ? no(new Error("ffmpeg 실패 " + c)) : ok()));
  let secs = 0;
  for (const [i, c] of s.cards.entries()) {
    const plan = PLAN[c.type] || INFO_PLAN;
    const prog = `<div class="prog">${s.cards.map(() => "<i><b></b></i>").join("")}</div>`;
    const html = d => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${prog}<div class="stage">${cardInner(c, i + 1, s.cards.length, C.brand)}</div><script>${pageScript(plan, d, i)}</script></body></html>`;
    // 길이: 마지막 등장을 보고 정함 → 그 길이로 다시 열어 사진 줌·진행 막대를 맞춤
    await page.setContent(html(10), { waitUntil: "load" });
    const dur = c.reel?.dur ?? Math.max(BASE[c.type] ?? INFO, +(await page.evaluate(() => window.__last)).toFixed(2) + 1.3);
    await page.setContent(html(dur), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const n = Math.round(dur * FPS);
    for (let f = 0; f < n; f++) {
      await page.evaluate(t => window.__seek(t), f / FPS);
      const buf = await page.screenshot({ type: "jpeg", quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      // 확인용 정지 화면: 각 장 0.5초 무렵과 마지막
      if (f === Math.round(.5 * FPS) || f === n - 1) await page.screenshot({ path: new URL(`reel-stills/${s.id}-${i + 1}-${f === n - 1 ? "end" : "0.5s"}.jpg`, dir).pathname, type: "jpeg", quality: 80 });
    }
    secs += dur;
    console.log(`  ${s.id} ${i + 1}장 ${c.type} ${dur}s`);
  }
  ff.stdin.end(); await done;
  console.log("릴스", `out/${date}/${s.id}-reel.mp4`, secs.toFixed(1) + "초");
}
await browser.close();
