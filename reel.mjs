// 세트 하나를 릴스 영상(1080×1920, 30fps)으로 만듦 → out/날짜/세트id-reel.mp4 (목소리 넣으면 세트id-reel-목소리.mp4)
// 카드 HTML을 그대로 세로 화면에 얹고, 장마다 등장 움직임을 넣어 프레임을 찍은 뒤 ffmpeg으로 합침.
// 실행: node reel.mjs 2026-10-20 [세트id]   (ffmpeg 필요. 세트를 안 주면 전부)
//   VOICES=gemini:Leda,gemini:Aoede → Gemini TTS (GEMINI_KEY). 장면(jreel)에는 "voice": "대사 한 줄"
//   VOICES=ko-KR-SunHiNeural,ko-KR-InJoonNeural: 카드의 "voice" 대사를 edge-tts로 읽혀 넣음 (목소리마다 영상 하나)
// 목소리: 카드에 "voice": ["대사1", "대사2", …]. 대사 한 마디 = 한 박자. 박자가 시작할 때 다음 요소가 튀어나옴 (PLAN의 {b: 박자})
// 음악: 세트에 "music": "파일.mp3"(assets/music, CC0)이면 깔아 줌. 없으면 유행 음원은 인스타 앱에서 직접 고름. 목소리가 없으면 무음 트랙 (오디오 없는 영상을 거부하는 경우 대비)
// 짤 릴스: 세트에 "jreel": [장면…] 이 있으면 카드 대신 장면을 이어 붙임 (전체 화면, 진행 막대 없음). 장면 종류:
//   {type:"hook", text}  검정 바탕 큰 한 줄 | {type:"jjal", jjal:id, top}  위 자막 + 짤 | {type:"card", n}  세트 n번째 카드 | {type:"end", text}
//   짤은 assets/jjal/cut/<id>.png(누끼, jjal/cutout.py)가 있으면 화면 대신 인물+자막만 얹음. 바탕: 장면 "cutbg" 또는 CUTBG= → panel(민트 판 위로 튀어나옴, 기본) | none
//   {type:"board", kick, count:[from,to], unit, char|jjal, bub}  흰 정보 보드 + 리액션 (char 없이 bub만 주면 보드 아래 흰 글씨 한마디) (notes/reel-design.md). 숫자는 카운트업
//   {type:"board", kick, chart:{bars:[[이름, 값, 표시]…], delta, src}, jjal}  막대 비교 (0부터, 차이는 괄호) | end에 char·bub를 주면 보드형 끝 장면
//   {type:"duo", kick, people:[{name, title, dept, photo?, credit?}×2], bub}  흰 보드 + 명함 두 장 (photo 없으면 성 한 글자)
//   {type:"cal", kick, year, month, span:[첫날, 끝날], leave:[연차 날…], hol:[공휴일…], photo?, bub|jjal}  흰 보드 + 한 달 달력. 쉬는 구간은 민트 띠로 칠해지고 연차 날은 검정 칸으로 튀어나옴
//   count 끝값에 소수점이 있으면 그 자리수까지 올라감 (예: 106.5, -0.8)
//   char: 세움이 표정(lib/char.mjs) shock | happy
//   길이는 "dur"(초), 기본 2초씩(카드 4초) — 2초 = 120BPM 한 마디라 어떤 음원을 붙여도 컷이 박자에 대충 맞음
// 장 길이는 카드에 "reel": {"dur": 3} 로 바꿀 수 있음. 없으면 종류별 기본값, 마지막 등장 뒤 1.3초, 대사 끝 0.5초 중 가장 긴 것.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { spawn, execFileSync } from "child_process";
import { cardInner, cardCss } from "./lib/cards.mjs";
import { CHAR } from "./lib/char.mjs";

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
// VOICES에 "gemini:Leda"처럼 쓰면 Gemini TTS(GEMINI_KEY, 모델 GEMINI_TTS)로 읽음. 지시문을 붙이면 지시문까지 읽어서 대사만 보냄 → 빠르기는 GEMINI_TEMPO(atempo)로
async function say(voice, text, file) {
  const mp3 = file.replace(/\.wav$/, voice.startsWith("gemini:") ? ".raw.wav" : ".mp3");
  if (voice.startsWith("gemini:")) {
    // 무료 등급은 분당 호출 수 한도가 있음 → 429면 알려 준 시간(없으면 30초)만큼 쉬고 다시 (최대 6번)
    let d;
    for (let t = 0; t < 6; t++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_TTS || "gemini-3.8-flash-tts"}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.slice(7) } } } } }) });
      d = await r.json();
      if (d.error?.code !== 429) break;
      const wait = parseFloat(d.error.details?.find(x => x.retryDelay)?.retryDelay) || 30;
      if (wait > 120) throw new Error(`Gemini TTS 하루 한도 소진 (약 ${Math.round(wait / 3600)}시간 뒤 풀림)`);
      console.log(`    Gemini 한도, ${wait}초 쉬고 다시`); await new Promise(ok => setTimeout(ok, (wait + 2) * 1000));
    }
    const p = d.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!p) throw new Error("Gemini TTS 실패: " + JSON.stringify(d).slice(0, 300));
    writeFileSync(mp3, Buffer.from(p.data, "base64"));
  } else execFileSync("edge-tts", ["--voice", voice, "--rate", RATE, "--text", text, "--write-media", mp3], { stdio: "ignore" });
  const af = voice.startsWith("gemini:") ? TRIM + ",atempo=" + (process.env.GEMINI_TEMPO || "1.15") : TRIM;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", "44100", "-ac", "1", file]);
  return +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim();
}
const run = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

// 짤 릴스 장면 (1080×1920 전체). 위 220px·아래 420px는 인스타 화면 요소 자리라 글을 두지 않음
const CAT = JSON.parse(readFileSync(new URL("jjal/catalog.json", import.meta.url), "utf8")).items;
const b64 = f => `data:image/${f.endsWith(".png") ? "png" : f.endsWith(".webp") ? "webp" : "jpeg"};base64,${readFileSync(new URL("assets/" + f, import.meta.url)).toString("base64")}`;
const SCSS = `
html,body{margin:0;background:#0e0f10;overflow:hidden;font-family:Pretendard,sans-serif;color:#fff}
.sc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center}
.lg{position:absolute;left:64px;top:236px;font:800 40px/1 Pretendard;letter-spacing:-.03em}.lg i{color:#1fd8a4;font-style:normal}
.hk{margin:auto 72px;font:800 88px/1.32 Pretendard;letter-spacing:-.04em;text-align:center;word-break:keep-all}
.cap{margin:330px 64px 0;min-height:250px;display:flex;align-items:flex-end;justify-content:center;font:800 66px/1.35 Pretendard;letter-spacing:-.035em;text-align:center;word-break:keep-all}
.ph{margin-top:48px;width:1080px;max-height:1000px;overflow:hidden;display:flex;justify-content:center}
.ph img{width:1080px;height:auto;max-height:1000px;object-fit:cover;display:block}
.cut{position:absolute;left:0;right:0;top:640px;height:860px}
.cut .pn{position:absolute;left:54px;right:54px;bottom:0;height:560px;border-radius:44px;background:#1fd8a4}
.cut img{position:absolute;left:54px;bottom:0;width:972px;height:860px;object-fit:contain;object-position:50% 100%;display:block}
.en{margin:auto 72px;text-align:center;font:800 76px/1.35 Pretendard;letter-spacing:-.035em;word-break:keep-all}
.en small{display:block;margin-top:40px;font:800 56px/1 Pretendard}.en small i{color:#1fd8a4;font-style:normal}
mk{background:#1fd8a4;color:#0e0f10;padding:0 .12em;border-radius:.08em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
em{color:#1fd8a4;font-style:normal}
@keyframes in{from{opacity:0;translate:0 40px}to{opacity:1;translate:0 0}}
@keyframes pop{0%{opacity:0;scale:.7}60%{opacity:1;scale:1.05}100%{opacity:1;scale:1}}
@keyframes kb{from{scale:1}to{scale:1.07}}
.bd{position:absolute;left:54px;right:54px;top:300px;height:740px;border-radius:44px;background:#fff;color:#0e0f10}
.bd .kk{position:absolute;left:64px;right:64px;top:70px;font:800 66px/1.3 Pretendard;letter-spacing:-.035em;word-break:keep-all}
.bd .nm{position:absolute;left:56px;right:40px;top:290px;font:900 220px/1.1 Pretendard;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.bd .nm small{font-size:.42em;letter-spacing:-.03em;margin-left:.06em}
.bd mk{background:none;color:inherit;padding:0;border-radius:0;box-shadow:inset 0 -.3em 0 #1fd8a4}
.bend .kk{top:200px;font-size:84px;text-align:center}.bend .kk span{display:block;margin-top:40px;font:800 52px/1 Pretendard}.bend .kk span i{color:#1fd8a4;font-style:normal}
.ch{position:absolute;left:64px;bottom:440px;width:380px;height:auto;transform-origin:50% 100%}
.rb{position:absolute;left:480px;top:1170px;max-width:420px;background:#fff;color:#0e0f10;font:800 54px/1.25 Pretendard;letter-spacing:-.03em;padding:30px 38px;border-radius:40px;word-break:keep-all;transform-origin:0 50%}
.rb::before{content:"";position:absolute;left:-22px;top:50px;border:18px solid transparent;border-right:26px solid #fff;border-left:0}
.rt{position:absolute;left:64px;right:180px;top:1110px;font:800 64px/1.3 Pretendard;letter-spacing:-.035em;color:#fff;word-break:keep-all}
.rj{position:absolute;left:30px;bottom:440px;width:640px;height:420px;object-fit:contain;object-position:0 100%;transform-origin:50% 100%}
.cht{position:absolute;left:64px;top:250px;width:844px;height:420px}
.cht .cb{position:absolute;bottom:70px;width:220px;border-radius:16px 16px 0 0;transform-origin:50% 100%;background:#d3d6d9}.cht .cb.now{background:#1fd8a4}
.cht .cv{position:absolute;width:220px;text-align:center;font:800 54px/1 Pretendard;letter-spacing:-.03em}
.cht .cx{position:absolute;bottom:14px;width:220px;text-align:center;font:700 36px/1 Pretendard;color:#6b7077}
.cht .clv{position:absolute;left:70px;width:560px;border-top:4px dashed #9aa0a6}
.cht .cbr{position:absolute;left:650px;width:22px;border:6px solid #0e0f10;border-left:0;border-radius:0 8px 8px 0}
.cht .cbl{position:absolute;left:690px;font:900 56px/1 Pretendard;letter-spacing:-.03em;white-space:nowrap}
.cht .csrc{position:absolute;left:0;bottom:-40px;font:500 26px/1 Pretendard;color:#6b7077}
.duo{position:absolute;left:48px;right:48px;top:290px;display:flex;gap:28px}
.nc{flex:1;height:400px;border-radius:32px;background:#f2f4f3;padding:36px 34px;box-sizing:border-box;position:relative;transform-origin:50% 100%}
.nc .av{width:128px;height:128px;border-radius:50%;object-fit:cover;object-position:50% 20%;display:block;box-shadow:0 0 0 6px #1fd8a4}
.nc .mono{background:#0e0f10;color:#fff;font:800 64px/128px Pretendard;text-align:center}
.nc .nn{margin-top:30px;font:900 64px/1 Pretendard;letter-spacing:-.04em}
.nc .nt{margin-top:14px;font:700 32px/1.2 Pretendard;color:#6b7077;letter-spacing:-.02em}
.nc .nd{position:absolute;left:34px;bottom:34px;font:800 40px/1 Pretendard;letter-spacing:-.03em;box-shadow:inset 0 -.32em 0 #1fd8a4}
.nc .ncr{position:absolute;right:20px;top:18px;font:500 20px/1 Pretendard;color:#9aa0a6}
.cph{position:absolute;right:36px;top:36px;width:300px;height:200px;border-radius:28px;overflow:hidden;transform-origin:100% 0}
.cph img{width:100%;height:100%;object-fit:cover;display:block}
.cal .kk{right:360px;font-size:60px}
.cg{position:absolute;left:40px;right:40px;top:272px;display:grid;grid-template-columns:repeat(7,1fr);row-gap:6px}
.cg b{font:700 28px/40px Pretendard;color:#9aa0a6;text-align:center}
.cg i{position:relative;height:60px;font:800 40px/60px Pretendard;font-style:normal;text-align:center;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#0e0f10}
.cg i.lv{z-index:2}.cg i.we{color:#8a9096}.cg i.ho{color:#08795a}
.cg i span{position:relative;z-index:1}
.cg .bar{position:absolute;height:54px;border-radius:27px;background:#1fd8a4;transform-origin:0 50%;z-index:0}
.cg i.lv span{display:inline-block;width:54px;height:54px;margin-top:3px;line-height:54px;border-radius:50%;background:#0e0f10;color:#fff}
@keyframes fill{from{scale:0 1}to{scale:1 1}}
@keyframes boing{0%{opacity:0;scale:.3}55%{opacity:1;scale:1.12}75%{scale:.94}100%{opacity:1;scale:1}}
@keyframes grow{from{scale:1 0}to{scale:1 1}}
@keyframes fade{from{opacity:0}to{opacity:1}}`;
const LOGO = `<div class="lg">seum<i>.</i></div>`;
// 보드형 장면: 막대 비교. 0부터 값에 비례, 앞 막대 높이를 점선으로 긋고 차이를 괄호로 가리킴
function chartHtml(c) {
  const [[k0, v0, l0], [k1, v1, l1]] = c.bars, H = 250, h0 = Math.round(H * v0 / Math.max(v0, v1)), h1 = Math.round(H * v1 / Math.max(v0, v1));
  return `<div class="cht"><div class="clv" style="bottom:${70 + h0}px" data-a="fade .3s 1s"></div>
<div class="cb" style="left:70px;height:${h0}px" data-a="grow .6s .3s"></div><div class="cb now" style="left:410px;height:${h1}px" data-a="grow .7s .45s"></div>
<div class="cv" style="left:70px;bottom:${70 + h0 + 16}px" data-a="fade .3s 1s">${l0}</div><div class="cv" style="left:410px;bottom:${70 + h1 + 16}px" data-a="fade .3s 1s">${l1}</div>
<div class="cx" style="left:70px">${k0}</div><div class="cx" style="left:410px">${k1}</div>
<div class="cbr" style="bottom:${70 + h0 - 3}px;height:${h1 - h0}px" data-a="fade .3s 1.3s"></div><div class="cbl" style="bottom:${70 + h0 - 12}px" data-a="fade .3s 1.3s">${c.delta}</div>
${c.src ? `<div class="csrc">${c.src}</div>` : ""}</div>`;
}
// 달력 장면: 한 달 칸을 그리고, 쉬는 구간(span)은 주마다 민트 띠, 연차 날은 검정 동그라미
function calHtml(sc) {
  const first = new Date(sc.year, sc.month - 1, 1).getDay(), days = new Date(sc.year, sc.month, 0).getDate(), [a, b] = sc.span, colW = 892 / 7, rowH = 66;
  const pos = d => ({ c: (first + d - 1) % 7, r: Math.floor((first + d - 1) / 7) });
  let cells = "", bars = "";
  for (let d = 1; d <= days; d++) {
    const { c } = pos(d), cls = sc.leave?.includes(d) ? "lv" : d >= a && d <= b ? "" : sc.hol?.includes(d) ? "ho" : c === 0 || c === 6 ? "we" : "";
    cells += `<i class="${cls}" style="grid-column:${c + 1}"${cls === "lv" ? ` data-a="boing .5s ${(1.3 + sc.leave.indexOf(d) * .15).toFixed(2)}s"` : ""}><span>${d}</span></i>`;
  }
  // 쉬는 구간을 주(줄)마다 끊어서 띠 하나씩, 위 줄부터 차례로 칠함
  for (let d = a, n = 0; d <= Math.min(b, days); n++) {
    const { c, r } = pos(d), e = Math.min(b, days, d + 6 - c);
    bars += `<div class="bar" style="left:${c * colW + 6}px;width:${(e - d + 1) * colW - 12}px;top:${46 + r * rowH + 3}px" data-a="fill .45s ${(.6 + n * .2).toFixed(2)}s"></div>`;
    d = e + 1;
  }
  return `<div class="cg" data-a="fade .4s .2s">${"일월화수목금토".split("").map(x => `<b>${x}</b>`).join("")}${cells}${bars}</div>`;
}
function react(sc) {
  if (sc.jjal) { const m = CAT.find(x => x.id === sc.jjal); if (!m) throw new Error("짤 없음: " + sc.jjal);
    const cut = `jjal/cut/${m.id}.png`; return `<img class="rj" src="${b64(existsSync(new URL("assets/" + cut, import.meta.url)) ? cut : m.image)}" data-a="boing .6s .35s">` }
  // 캐릭터 없이 bub만 있으면 보드 아래 흰 글씨 한마디 (말풍선 대신)
  if (!sc.char) return sc.bub ? `<div class="rt" data-a="in .4s .6s">${sc.bub}</div>` : "";
  return CHAR(sc.char).replace('class="ch"', 'class="ch" data-a="boing .6s .35s"') + (sc.bub ? `<div class="rb" data-a="boing .5s .7s">${sc.bub}</div>` : "");
}
function sceneHtml(sc, dur) {
  let body;
  if (sc.type === "board") body = `<div class="sc">${LOGO}<div class="bd" data-a="in .45s 0s"><div class="kk">${sc.kick}</div>${sc.chart ? chartHtml(sc.chart)
    : `<div class="nm" data-count="${sc.count.join(",")}" data-unit="${sc.unit || ""}">${sc.count[1].toLocaleString("ko-KR")}<small>${sc.unit || ""}</small></div>`}</div>${react(sc)}</div>`;
  else if (sc.type === "cal") body = `<div class="sc">${LOGO}<div class="bd cal" data-a="in .45s 0s"><div class="kk">${sc.kick}</div>${sc.photo ? `<div class="cph" data-a="pop .5s .3s"><img src="${b64(sc.photo)}" data-a="kb ${dur}s 0s linear"></div>` : ""}${calHtml(sc)}</div>${react(sc)}</div>`;
  else if (sc.type === "duo") body = `<div class="sc">${LOGO}<div class="bd" data-a="in .45s 0s"><div class="kk">${sc.kick}</div><div class="duo">${sc.people.map((p, i) =>
    `<div class="nc" data-a="boing .6s ${.35 + i * .3}s">${p.photo ? `<img class="av" src="${b64(p.photo)}">` : `<div class="av mono">${p.name[0]}</div>`}<div class="nn">${p.name}</div><div class="nt">${p.title}</div><div class="nd">${p.dept}</div>${p.credit ? `<div class="ncr">${p.credit}</div>` : ""}</div>`).join("")}</div></div>${react(sc)}</div>`;
  else if (sc.type === "end" && (sc.char || sc.bub)) body = `<div class="sc">${LOGO}<div class="bd bend" data-a="in .45s 0s"><div class="kk">${sc.text}<span>seum<i>.</i></span></div></div>${react(sc)}</div>`;
  else if (sc.type === "hook") body = `<div class="sc">${LOGO}<div class="hk" data-a="pop .45s .05s">${sc.text}</div></div>`;
  else if (sc.type === "end") body = `<div class="sc"><div class="en" data-a="in .45s .05s">${sc.text}<small>seum<i>.</i></small></div></div>`;
  else if (sc.type === "jjal") {
    const m = CAT.find(x => x.id === sc.jjal); if (!m?.image) throw new Error("짤 없음: " + sc.jjal);
    const cut = `jjal/cut/${m.id}.png`, bg = sc.cutbg || process.env.CUTBG || "panel";
    const pic = sc.cut !== false && existsSync(new URL("assets/" + cut, import.meta.url))
      ? `<div class="cut ${bg}">${bg === "panel" ? '<div class="pn" data-a="pop .4s .1s"></div>' : ""}<img src="${b64(cut)}" data-a="in .45s .22s"></div>`
      : `<div class="ph" data-a="pop .45s .2s"><img src="${b64(m.image)}" data-a="kb ${dur}s 0s linear"></div>`;
    body = `<div class="sc">${LOGO}<div class="cap" data-a="in .4s .05s"><span>${sc.top || ""}</span></div>${pic}</div>`;
  } else throw new Error("모르는 장면: " + sc.type);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${cardCss(C.palette)}${SCSS}</style></head><body>${body}<script>(() => {
document.querySelectorAll("[data-a]").forEach(el => { const [k, d, at, ease] = el.dataset.a.split(" "); el.style.animation = k + " " + d + " " + (ease || "cubic-bezier(.2,.8,.2,1)") + " " + at + " both" });
const anims = document.getAnimations(); anims.forEach(a => a.pause());
const cnt = [...document.querySelectorAll("[data-count]")].map(el => { const [a, b] = el.dataset.count.split(",").map(Number); return { el, a, b } });
window.__seek = t => { anims.forEach(a => a.currentTime = t * 1000);
  for (const c of cnt) { const p = Math.min(1, Math.max(0, (t - .3) / 1)), e = 1 - Math.pow(1 - p, 3), d = (String(c.b).split(".")[1] || "").length;
    c.el.innerHTML = (+(c.a + (c.b - c.a) * e).toFixed(d)).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "<small>" + c.el.dataset.unit + "</small>" } };
})()</script></body></html>`;
}

const voices = (process.env.VOICES || "").split(",").map(v => v.trim()).filter(Boolean);
for (const s of C.sets.filter(s => !only || s.id === only)) for (const voice of voices.length ? voices : [null]) {
  const tag = !voice ? "" : voice.startsWith("gemini:") ? "-" + voice.slice(7) : "-" + voice.split("-")[2].replace(/Neural$/, "").replace(/Multilingual$/, "");
  const out = new URL(`${s.id}-reel${tag}.mp4`, dir).pathname, silent = new URL(`voice/${s.id}${tag}-video.mp4`, dir).pathname;
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "medium", "-crf", "19", "-r", String(FPS), "-an", silent], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, no) => ff.on("close", c => c ? no(new Error("ffmpeg 실패 " + c)) : ok()));
  let secs = 0; const clips = [];
  const list = s.jreel ? s.jreel.map(sc => sc.type === "card" ? { c: { ...s.cards[sc.n - 1], reel: { dur: sc.dur ?? 4 } }, i: sc.n - 1 } : { sc }) : s.cards.map((c, i) => ({ c, i }));
  for (const [k, it] of list.entries()) {
    if (it.sc) {
      let dur = it.sc.dur ?? 2;
      // 장면 대사("voice": 한 줄): 0.25초부터 읽고, 길면 장면을 늘림
      if (voice && it.sc.voice) {
        const file = new URL(`voice/${s.id}${tag}-j${k + 1}.wav`, dir).pathname, len = await say(voice, it.sc.voice, file);
        clips.push({ file, at: secs + .25 }); dur = +Math.max(dur, .25 + len + .35).toFixed(2);
        console.log(`    ${len.toFixed(2)}s ${it.sc.voice}`);
      }
      await page.setContent(sceneHtml(it.sc, dur), { waitUntil: "load" }); await page.evaluate(() => document.fonts.ready);
      const n = Math.round(dur * FPS);
      for (let f = 0; f < n; f++) {
        await page.evaluate(t => window.__seek(t), f / FPS);
        const buf = await page.screenshot({ type: "jpeg", quality: 94 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
        if (f === n - 1) await page.screenshot({ path: new URL(`reel-stills/${s.id}-j${k + 1}-${it.sc.type}.jpg`, dir).pathname, type: "jpeg", quality: 80 });
      }
      secs += dur; console.log(`  ${s.id} 장면 ${k + 1} ${it.sc.type} ${dur}s`); continue;
    }
    const { c, i } = it;
    const plan = PLAN[c.type] || INFO_PLAN;
    // 대사: 0.3초부터 한 마디씩, 사이 0.12초
    const beats = []; let cur = .3;
    if (voice) for (const [k, line] of (c.voice || []).entries()) {
      const file = new URL(`voice/${s.id}${tag}-${i + 1}-${k + 1}.wav`, dir).pathname, len = await say(voice, line, file);
      beats.push(+cur.toFixed(2)); clips.push({ file, at: secs + cur }); cur += len + .12;
      console.log(`    ${len.toFixed(2)}s ${line}`);
    }
    const prog = s.jreel ? "" : `<div class="prog">${s.cards.map(() => "<i><b></b></i>").join("")}</div>`;
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
  else if (s.music) { const L = secs.toFixed(2); // 무료 음원(assets/music, CC0): 길이에 맞춰 자르고 앞뒤 페이드
    run(["-i", silent, "-i", new URL("assets/music/" + s.music, import.meta.url).pathname, "-filter_complex",
      `[1]atrim=0:${L},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=${(secs - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-16:TP=-1.5,apad[a]`, ...enc]) }
  else run(["-i", silent, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-filter_complex", "[1]anull[a]", ...enc]);
  console.log("릴스", `out/${date}/${s.id}-reel${tag}.mp4`, secs.toFixed(1) + "초", voice ? `대사 ${clips.length}마디` : "");
}
await browser.close();
