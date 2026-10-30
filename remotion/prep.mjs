// Remotion 릴스 재료 준비: content/날짜.json 세트의 "remo" → public/(목소리·B롤·효과음·글꼴) + src/plan.json
// 실행: node prep.mjs 2026-10-30 youth-savings   (ffmpeg, FISH_KEY 필요)
// remo: { voice: "fish:<id>", music, receipt: {title, sub, rows:[{k, v, u, note, plain}]} (plain: 연도처럼 쉼표·카운트업 없이), src,
//         beats: [{ say: "읽을 말", cap: ["자막 덩어리", "*강조*는 민트"], broll: {url, from, x}, mode: "big"|"row"|"stamp"|"cta", big, row, stamp }] }
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const [date, id] = process.argv.slice(2);
const C = JSON.parse(readFileSync(new URL(`../content/${date}.json`, import.meta.url), "utf8"));
const R = C.sets.find(s => s.id === id).remo;
const pub = new URL("public/", import.meta.url).pathname, FPS = 30;
for (const d of ["vo", "broll", "sfx", "raw"]) mkdirSync(pub + d, { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
const len = f => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();

// 목소리: 대사 한 마디씩 Fish TTS → 앞뒤 무음 자르고 wav
async function tts(text, file) {
  let r;
  for (let t = 0; t < 5; t++) {
    r = await fetch("https://api.fish.audio/v1/tts", { method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.FISH_KEY, model: process.env.FISH_MODEL || "s2.1-pro-free" },
      body: JSON.stringify({ text, reference_id: R.voice.slice(5), format: "mp3", language: "ko", prosody: { speed: +(process.env.FISH_SPEED || 1.1) } }) });
    if (r.status !== 429 && r.status !== 503) break;
    await new Promise(ok => setTimeout(ok, 10000));
  }
  if (!r.ok) throw new Error(`Fish TTS 실패 ${r.status}: ` + (await r.text()).slice(0, 300));
  writeFileSync(pub + "raw/vo.mp3", Buffer.from(await r.arrayBuffer()));
  ff("-i", pub + "raw/vo.mp3", "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "44100", "-ac", "1", pub + file);
  return len(pub + file);
}

// 효과음은 직접 합성 (저작권 걱정 없음)
const sfx = {
  whoosh: ["-f", "lavfi", "-i", "anoisesrc=d=0.32:c=pink:a=0.5", "-af", "highpass=f=500,lowpass=f=5000,afade=t=in:d=0.18,afade=t=out:st=0.18:d=0.14,volume=0.7"],
  pop: ["-f", "lavfi", "-i", "sine=f=760:d=0.09", "-af", "asetrate=44100*1.25,aresample=44100,afade=t=out:st=0:d=0.09,volume=0.8"],
  tick: ["-f", "lavfi", "-i", "anoisesrc=d=0.035:c=white:a=0.6", "-af", "highpass=f=2500,afade=t=out:st=0:d=0.035"],
  thud: ["-f", "lavfi", "-i", "sine=f=85:d=0.25", "-f", "lavfi", "-i", "anoisesrc=d=0.08:c=brown:a=0.8", "-filter_complex", "[0]afade=t=out:st=0:d=0.25[a];[1]lowpass=f=900[b];[a][b]amix=inputs=2:normalize=0,volume=1.6"],
  ding: ["-f", "lavfi", "-i", "sine=f=1320:d=0.6", "-f", "lavfi", "-i", "sine=f=1980:d=0.6", "-filter_complex", "[0][1]amix=inputs=2,afade=t=out:st=0:d=0.6,volume=0.6"],
};
for (const [k, a] of Object.entries(sfx)) ff(...a, "-ar", "44100", "-ac", "1", pub + `sfx/${k}.wav`);
copyFileSync(new URL("../fonts/PretendardVariable.woff2", import.meta.url), pub + "Pretendard.woff2");
if (R.music) copyFileSync(new URL("../assets/music/" + R.music, import.meta.url), pub + "music.mp3");

// 자막 덩어리 시각: 대사 길이를 덩어리 글자 수(숫자는 더 길게 읽힘) 비율로 나눔
const weight = s => [...s.replace(/[*\s]/g, "")].reduce((n, ch) => n + (/\d/.test(ch) ? 1.6 : /[,.?!~·]/.test(ch) ? .3 : 1), 0);
const beats = []; let t = 0;
for (const [i, b] of R.beats.entries()) {
  const vlen = await tts(b.say, `vo/${i}.wav`), at = i ? .18 : .05;
  const dur = Math.max(b.min || 0, at + vlen + .3);
  const ws = b.cap.map(weight), W = ws.reduce((a, c) => a + c, 0);
  let c = at; const cap = b.cap.map((txt, k) => { const from = c; c += vlen * ws[k] / W; return { txt, from: Math.round(from * FPS), to: Math.round(c * FPS) } });
  // B롤: 받아서 가운데(또는 x 비율) 세로로 잘라 1080×1920, 필요한 길이만
  const raw = pub + `raw/b${i}.mp4`;
  if (!existsSync(raw)) execFileSync("curl", ["-sfL", "--retry", "4", "-o", raw, b.broll.url]);
  const x = b.broll.x ?? .5;
  ff("-ss", String(b.broll.from || 0), "-i", raw, "-t", (dur + .5).toFixed(2), "-an", "-vf",
    `scale=-2:1920,crop=1080:1920:(iw-1080)*${x}:0,fps=${FPS},eq=saturation=1.08`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", pub + `broll/${i}.mp4`);
  beats.push({ ...b, start: Math.round(t * FPS), dur: Math.round(dur * FPS), vo: { file: `vo/${i}.wav`, at: Math.round(at * FPS) }, broll: `broll/${i}.mp4`, cap });
  console.log(`${i} ${b.mode} ${dur.toFixed(2)}s  ${b.say}`);
  t += dur;
}
const plan = { fps: FPS, total: Math.round(t * FPS), music: !!R.music, receipt: R.receipt, src: R.src, beats };
writeFileSync(new URL("src/plan.json", import.meta.url), JSON.stringify(plan, null, 1));
console.log("총", t.toFixed(1) + "초");
