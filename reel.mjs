// 세트 하나를 릴스 영상(1080×1920, 30fps)으로 만듦 → out/날짜/세트id-reel.mp4 (목소리 넣으면 세트id-reel-목소리.mp4)
// 카드 HTML을 그대로 세로 화면에 얹고, 장마다 등장 움직임을 넣어 프레임을 찍은 뒤 ffmpeg으로 합침.
// 실행: node reel.mjs 2026-10-20 [세트id]   (ffmpeg 필요. 세트를 안 주면 전부)
//   VOICES=ko-KR-SunHiNeural,ko-KR-InJoonNeural: 카드의 "voice" 대사를 edge-tts로 읽혀 넣음 (목소리마다 영상 하나)
// 목소리: 카드에 "voice": ["대사1", "대사2", …]. 대사 한 마디 = 한 박자. 박자가 시작할 때 다음 요소가 튀어나옴 (PLAN의 {b: 박자})
// 음악은 안 넣음: 유행 음원은 인스타 앱에서 직접 고름. 목소리가 없으면 무음 트랙 (오디오 없는 영상을 거부하는 경우 대비)
// 장 길이는 카드에 "reel": {"dur": 3} 로 바꿀 수 있음. 없으면 종류별 기본값, 마지막 등장 뒤 1.3초, 대사 끝 0.5초 중 가장 긴 것.
import { readFileSync, mkdirSync } from "fs";
import { spawn, execFileSync } from "child_process";
import { cardInner, cardCss } from "./lib/cards.mjs";

const date = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), only = process.argv[3];
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const dir = new URL(`out/${date}/`, import.meta.url);
mkdirSync(new URL("reel-stills/", dir), { recursive: true }); mkdirSync(new URL("voice/", dir), { recursive: true });
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

// 종류별 등장 순서: [선택자, 움직임, 시작, 여러 개면 간격]
// 시작: 초 | "after"(앞 요소 0.7초 뒤) | {b: n, each, d}: 대사 n번째 박자에 (each면 i번째 요소는 n+i 박자). 대사가 없으면 d
const INFO_PLAN = [[".phw img", "kb"], [".phw .bub", "pop", { b: 2, d: .5 }], [".kick,.kick2", "in", .1], [".big", "in", .25],
  [".hv", "in", { b: 1, d: .6 }], [".hl2", "in", { b: 1, d: .9 }], [".stats div", "in", { b: 1, d: .6 }, .12], [".bw i", "grow", { b: 1, d: .6 }, .06], [".bl", "fade", 1.1],
  [".def", "in", { b: 1, d: .6 }], [".cmp div", "in", { b: 1, each: 1, d: .6 }, .2], [".body", "in", { b: 2, d: 1.4 }], [".ft", "fade", 1.7]];
const PLAN = {
  cover: [[".card>img", "kb"], [".hd small", "in", .05], [".hd", "in", .1], [".say", "pop", { b: 0, d: .45 }], [".bub", "pop", { b: 0, d: .7 }], [".lb", "in", .9, .15]],
  jjal: [[".card>img", "fade", 0], [".jt", "in", .15], [".jb", "pop", { b: 1, d: 1.1 }]],
  meme: [[".kick", "in", .1], [".big", "in", .2], [".mf", "in", .3], [".ov", "pop", { b: 1, each: 1, d: .8 }, .7], [".body", "in", { b: 4, d: "after" }]],
  summary: [[".card>img", "kb"], [".kick", "in", .1], [".sum", "fade", .2], [".sum li", "in", { b: 1, each: 1, d: .35 }, .35], [".q", "pop", { b: 4, d: "after" }], [".cta", "in", { b: 5, d: "after2" }]],
};

// 페이지 안에서 도는 코드: 움직임 붙이기 + 특정 시각으로 맞추기(__seek)
function pageScript(plan, dur, idx, beats) {
  return `(() => {
const plan = ${JSON.stringify(plan)}, dur = ${dur}, beats = ${JSON.stringify(beats)};
let last = 0;
const anim = (el, k, at, d) => { el.style.animation = k + " " + d + "s cubic-bezier(.2,.8,.2,1) " + at + "s both"; el.dataset.at = at; last = Math.max(last, at) };
const rel = v => v === "after" ? last + .7 : v === "after2" ? last + .4 : v;
for (const [sel, k, at0 = 0, gap = 0] of plan) {
  const byBeat = typeof at0 === "object", from = rel(byBeat ? at0.d : at0);
  document.querySelectorAll(".stage " + sel).forEach((el, i) => {
    if (k === "kb") return el.style.animation = "kb " + dur + "s linear both";
    const b = byBeat ? beats[at0.b + (at0.each ? i : 0)] : null;
    anim(el, k, +(b != null ? b : from + i * gap).toFixed(2), k === "pop" ? .5 : .45);
  });
}
// 형광펜은 감싸는 글이 나온 뒤 쓱
document.querySelectorAll(".stage .mk").forEach(el => { const p = el.closest("[data-at]"); anim(el, "sweep", (p ? +p.dataset.at : 0) + .35, .5) });
document.querySelector(".stage").style.animation = "enter .25s ease-out both";
document.querySelectorAll(".prog b").forEach((b, i) => i === ${idx} ? (b.style.animation = "fill " + dur + "s linear both") : (b.style.scale = i < ${idx} ? "1 1" : "0 1"));
// 큰 숫자는 0부터 올라감
const hv = [...document.querySelectorAll(".stage .hv")].map(el => { const m = el.textContent.match(/^([^\\d]*)([\\d,]*\\.?\\d+)(.*)$/); return m && { el, m, at: +el.dataset.at || .6, to: +m[2].replace(/,/g, ""), dp: (m[2].split(".")[1] || "").length, comma: m[2].includes(",") } }).filter(Boolean);
const anims = document.getAnimations(); anims.forEach(a => a.pause());
window.__last = last;
window.__seek = t => {
  anims.forEach(a => a.currentTime = t * 1000);
  for (const h of hv) { const p = Math.min(1, Math.max(0, (t - h.at) / .9)), e = 1 - Math.pow(1 - p, 3), v = (h.to * e).toFixed(h.dp);
    h.el.textContent = h.m[1] + (h.comma ? Number(v).toLocaleString("en-US", { minimumFractionDigits: h.dp }) : v) + h.m[3] }
};
})()`;
}

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const css = cardCss(C.palette) + STAGE;

// 대사 한 마디를 읽혀서 wav + 길이(초). edge-tts mp3는 길이 정보가 부정확해서 wav로 바꾸고 앞뒤 무음도 잘라냄
const RATE = process.env.VOICE_RATE || "+20%";
const TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse";
function say(voice, text, file) {
  const mp3 = file.replace(/\.wav$/, ".mp3");
  execFileSync("edge-tts", ["--voice", voice, "--rate", RATE, "--text", text, "--write-media", mp3], { stdio: "ignore" });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-af", TRIM, "-ar", "44100", "-ac", "1", file]);
  return +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim();
}
const run = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

const voices = (process.env.VOICES || "").split(",").map(v => v.trim()).filter(Boolean);
for (const s of C.sets.filter(s => !only || s.id === only)) for (const voice of voices.length ? voices : [null]) {
  const tag = voice ? "-" + voice.split("-")[2].replace(/Neural$/, "").replace(/Multilingual$/, "") : "";
  const out = new URL(`${s.id}-reel${tag}.mp4`, dir).pathname, silent = new URL(`voice/${s.id}${tag}-video.mp4`, dir).pathname;
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "medium", "-crf", "19", "-r", String(FPS), "-an", silent], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, no) => ff.on("close", c => c ? no(new Error("ffmpeg 실패 " + c)) : ok()));
  let secs = 0; const clips = [];
  for (const [i, c] of s.cards.entries()) {
    const plan = PLAN[c.type] || INFO_PLAN;
    // 대사: 0.3초부터 한 마디씩, 사이 0.12초
    const beats = []; let cur = .3;
    if (voice) for (const [k, line] of (c.voice || []).entries()) {
      const file = new URL(`voice/${s.id}${tag}-${i + 1}-${k + 1}.wav`, dir).pathname, len = say(voice, line, file);
      beats.push(+cur.toFixed(2)); clips.push({ file, at: secs + cur }); cur += len + .12;
      console.log(`    ${len.toFixed(2)}s ${line}`);
    }
    const prog = `<div class="prog">${s.cards.map(() => "<i><b></b></i>").join("")}</div>`;
    const html = d => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${prog}<div class="stage">${cardInner(c, i + 1, s.cards.length, C.brand)}</div><script>${pageScript(plan, d, i, beats)}</script></body></html>`;
    // 길이: 마지막 등장을 보고 정함 → 그 길이로 다시 열어 사진 줌·진행 막대를 맞춤
    await page.setContent(html(10), { waitUntil: "load" });
    const dur = c.reel?.dur ?? +Math.max(BASE[c.type] ?? INFO, (await page.evaluate(() => window.__last)) + 1.3, beats.length ? cur + .5 : 0).toFixed(2);
    await page.setContent(html(dur), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const n = Math.round(dur * FPS);
    for (let f = 0; f < n; f++) {
      await page.evaluate(t => window.__seek(t), f / FPS);
      const buf = await page.screenshot({ type: "jpeg", quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      // 확인용 정지 화면: 각 장 0.5초 무렵과 마지막
      if (f === Math.round(.5 * FPS) || f === n - 1) await page.screenshot({ path: new URL(`reel-stills/${s.id}${tag}-${i + 1}-${f === n - 1 ? "end" : "0.5s"}.jpg`, dir).pathname, type: "jpeg", quality: 80 });
    }
    secs += dur;
    console.log(`  ${s.id} ${i + 1}장 ${c.type} ${dur}s`);
  }
  ff.stdin.end(); await done;
  // 소리 붙이기: 대사를 제 시각에 깔고(adelay) 합침. 대사가 없으면 무음
  const enc = ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out];
  if (clips.length) run(["-i", silent, ...clips.flatMap(c => ["-i", c.file]), "-filter_complex",
    clips.map((c, k) => `[${k + 1}]adelay=${Math.round(c.at * 1000)}:all=1[v${k}]`).join(";") + ";" + clips.map((_, k) => `[v${k}]`).join("") + `amix=inputs=${clips.length}:normalize=0:dropout_transition=0,loudnorm=I=-14:TP=-1.5,apad[a]`, ...enc]);
  else run(["-i", silent, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-filter_complex", "[1]anull[a]", ...enc]);
  console.log("릴스", `out/${date}/${s.id}-reel${tag}.mp4`, secs.toFixed(1) + "초", voice ? `대사 ${clips.length}마디` : "");
}
await browser.close();
