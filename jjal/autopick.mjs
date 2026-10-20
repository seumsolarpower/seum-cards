// 사람 선택 없이 후보 중 하나를 자동 확정 (fetch.mjs 다음에 실행)
// 1) ANTHROPIC_API_KEY 가 있으면: 후보를 AI가 직접 보고 "그 장면이 맞는지, 워터마크·자막·잘림이 없는지" 판단해서 고름
// 2) 없으면: 크기·비율 점수로 고름 (영화·예능 캡처는 보통 가로 16:9, 큰 이미지가 깨끗함)
// 실행: node jjal/autopick.mjs [짤id ...]
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";

const catF = new URL("catalog.json", import.meta.url), CAT = JSON.parse(readFileSync(catF, "utf8"));
const only = process.argv.slice(2), KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.JJAL_MODEL || "claude-haiku-5-5";

function score(c) {
  const w = Number(c.w), h = Number(c.h), r = w / h;
  return Math.min(w, 1600) / 1600 * 2 - Math.abs(r - 16 / 9) * 1.5 - (r < 1 ? 1 : 0);
}
async function askAI(m, dir, list) {
  const content = [{ type: "text", text: `한국 짤 "${m.name}" (${m.source}, 뜻: ${m.meaning}) 후보 이미지 ${list.length}장입니다.
그 장면이 맞고, 워터마크·로고·기존 자막·다른 글자가 적고, 잘리지 않고 화질이 좋은 것을 고르세요.
맞는 게 없으면 0. 숫자 하나만 답하세요 (1~${list.length} 또는 0).` }];
  list.forEach((c, i) => {
    const ext = c.file.split(".").pop(), mt = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    content.push({ type: "text", text: `${i + 1}번` }, { type: "image", source: { type: "base64", media_type: mt, data: readFileSync(new URL(c.file, dir)).toString("base64") } });
  });
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 5, messages: [{ role: "user", content }] }) });
  if (!r.ok) throw new Error(`AI 판단 실패 ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Number(((await r.json()).content?.[0]?.text || "").match(/\d+/)?.[0] || 0);
}

for (const m of CAT.items.filter(m => !m.image && (!only.length || only.includes(m.id)))) {
  const dir = new URL(`candidates/${m.id}/`, import.meta.url), lf = new URL("list.json", dir);
  if (!existsSync(lf)) { console.log(m.id, "후보 없음 (fetch 먼저)"); continue }
  const list = JSON.parse(readFileSync(lf, "utf8")); if (!list.length) { console.log(m.id, "후보 0개"); continue }
  const n = KEY ? await askAI(m, dir, list) : list.map((c, i) => [score(c), i + 1]).sort((a, b) => b[0] - a[0])[0][1];
  if (!n || !list[n - 1]) { console.log(`${m.name}: 맞는 후보 없음 → 검색어 바꿔서 다시`); continue }
  const c = list[n - 1], out = `jjal/${m.id}.${c.file.split(".").pop()}`;
  copyFileSync(new URL(c.file, dir), new URL(`../assets/${out}`, import.meta.url));
  Object.assign(m, { image: out, from: c.from, picked: KEY ? "ai" : "score" });
  console.log(`${m.name} → ${n}번 (${KEY ? "AI 판단" : "크기·비율 점수"})`);
}
writeFileSync(catF, JSON.stringify(CAT, null, 2) + "\n");
