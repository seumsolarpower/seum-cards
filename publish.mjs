// 찍어 둔 카드를 인스타·스레드·X에 올림. content/날짜.json 의 "approved": true 이고 세트의 "at" 시각이 지났을 때만 (사람 검수 후).
// 실행: MEDIA_BASE_URL=https://.../media node publish.mjs 2026-10-20
//   PLATFORMS=instagram,threads,x (기본 셋 다)  DRY=1: 올릴 내용만 출력  FORCE=1: 승인 없이 (테스트용)
// 같은 날·같은 세트·같은 플랫폼은 out/날짜/posted/ 에 기록해서 두 번 안 올림 (워크플로가 media 브랜치에 보관)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import * as P from "./lib/platforms.mjs";

const date = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const dir = new URL(`out/${date}/`, import.meta.url);
const DRY = process.env.DRY === "1", base = (process.env.MEDIA_BASE_URL || "").replace(/\/$/, "");
const want = (process.env.PLATFORMS || "instagram,threads,x").split(",").map(s => s.trim()).filter(Boolean);
const NEED = { instagram: ["IG_USER_ID", "IG_TOKEN"], threads: ["THREADS_USER_ID", "THREADS_TOKEN"], x: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"] };

// 승인: 파일 전체("approved": true) 또는 세트별(sets[].approved: true)
// 게시 시각: 세트의 "at": "12:10" (한국 시각). 그 시각이 지나야 올림. 없으면 승인되자마자
const nowKst = new Date(Date.now() + 9 * 3600e3).toISOString(), today = nowKst.slice(0, 10), hhmm = nowKst.slice(11, 16);
const due = s => !s.at || date < today || (date === today && hhmm >= s.at);
const ok = s => process.env.FORCE === "1" || ((C.approved || s.approved) && due(s));
// CHECK=1: 지금 올릴 세트 수만 출력 (워크플로가 카드 찍기 전에 확인용). 인스타 기록 기준
if (process.env.CHECK === "1") {
  console.log(C.sets.filter(s => ok(s) && !existsSync(new URL(`posted/${s.id}.instagram`, dir))).length); process.exit(0);
}
if (!C.sets.some(ok)) { console.log(`${date}: 지금 올릴 세트 없음 (승인 안 됐거나 "at" 시각 전). 건너뜀`); process.exit(0) }
if (!DRY && !base && want.some(p => p !== "x")) throw new Error("MEDIA_BASE_URL 이 없음 (인스타·스레드는 공개 이미지 주소가 필요)");
mkdirSync(new URL("posted/", dir), { recursive: true });

let fail = 0;
for (const s of C.sets) {
  if (!ok(s)) { console.log(due(s) ? "승인 안 된 세트 건너뜀:" : `${s.at} 전이라 건너뜀:`, s.id); continue }
  const files = s.cards.map((_, i) => `${s.id}-${i + 1}.jpg`);
  const urls = files.map(f => `${base}/${date}/${f}`), paths = files.map(f => new URL(f, dir).pathname);
  // X는 사진 4장까지: 5장 이상이면 앞 3장 + 마지막(요약) 장
  const xPaths = paths.length > 4 ? [...paths.slice(0, 3), paths[paths.length - 1]] : paths;
  for (const p of want) {
    const mark = new URL(`posted/${s.id}.${p}`, dir);
    if (existsSync(mark)) { console.log("이미 올림", s.id, p); continue }
    const missing = NEED[p]?.filter(k => !process.env[k]);
    if (!NEED[p]) { console.log("모르는 플랫폼", p); continue }
    if (missing.length && !DRY) { console.log(`${p}: 키 없음(${missing.join(", ")}) → 건너뜀`); continue }
    const caption = p === "x" ? P.xText(s.caption.x || s.caption.threads) : (s.caption[p] || s.caption.instagram);
    if (DRY) { console.log(`[DRY] ${p} ${s.id}\n  이미지: ${(p === "x" ? xPaths : urls).join("\n          ")}\n  글: ${caption.replace(/\n/g, " ⏎ ")}`); continue }
    try {
      const id = await P[p]({ urls, files: xPaths, caption });
      writeFileSync(mark, `${new Date().toISOString()} ${id}\n`);
      console.log("올림", s.id, p, id);
    } catch (e) { fail++; console.log("실패", s.id, p, e.message) }
  }
}
process.exit(fail ? 1 : 0);
