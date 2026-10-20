// 올린 게시물의 반응(도달·좋아요·저장·공유·댓글)을 모아 stats/ 에 남김. 피드백 정리(seum-feedback 스킬)의 재료.
// 실행: IG_USER_ID=… IG_TOKEN=… node insights.mjs media   (media = media 브랜치 체크아웃, 날짜/posted/세트.instagram 기록을 읽음)
//   DAYS=14: 최근 며칠 게시물까지 다시 잼 (기본 14)
// 결과: media/stats/날짜/세트.instagram.json 에 수집 시각별 스냅샷을 쌓음 (게시 후 몇 시간·하루·일주일 추이를 보려고)
//       media/stats/account.json 에 팔로워 수 추이
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const root = process.argv[2] || "media", DAYS = +(process.env.DAYS || 14);
const B = `https://graph.instagram.com/${process.env.IG_API_VERSION || "v23.0"}`, tk = process.env.IG_TOKEN, uid = process.env.IG_USER_ID;
if (!tk || !uid) { console.log("IG 키 없음 → 건너뜀"); process.exit(0) }

async function get(path, q = {}) {
  const r = await fetch(`${B}/${path}?${new URLSearchParams({ ...q, access_token: tk })}`), j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${path} → ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
}
// 지표는 계정·게시물 종류마다 지원이 달라서 한꺼번에 실패하면 하나씩 다시 물어봄
const METRICS = ["reach", "views", "likes", "comments", "saved", "shares", "total_interactions"];
async function insights(id) {
  const pick = j => Object.fromEntries(j.data.map(m => [m.name, m.values?.[0]?.value ?? m.total_value?.value]));
  try { return pick(await get(`${id}/insights`, { metric: METRICS.join(",") })) }
  catch (e) {
    const out = {};
    for (const m of METRICS) try { Object.assign(out, pick(await get(`${id}/insights`, { metric: m }))) } catch (e2) { out[m] = null; console.log("  지표 실패", m, e2.message.slice(0, 120)) }
    return out;
  }
}

const now = new Date().toISOString(), cutoff = new Date(Date.now() - DAYS * 864e5 + 9 * 3600e3).toISOString().slice(0, 10);
const dates = readdirSync(root).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= cutoff && existsSync(join(root, d, "posted")));
let n = 0, fail = 0;
for (const d of dates) for (const f of readdirSync(join(root, d, "posted")).filter(f => f.endsWith(".instagram"))) {
  const set = f.replace(/\.instagram$/, ""), [postedAt, id] = readFileSync(join(root, d, "posted", f), "utf8").trim().split(" ");
  try {
    const meta = await get(id, { fields: "permalink,like_count,comments_count,timestamp" });
    const c = await get(`${id}/comments`, { fields: "id,text,timestamp,like_count,username", limit: "50" }).catch(e => (console.log("  댓글 실패", e.message.slice(0, 120)), { data: [] }));
    const file = join(root, "stats", d, `${set}.instagram.json`);
    const S = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { date: d, set, id, postedAt, permalink: meta.permalink, snapshots: [] };
    const hours = Math.round((Date.parse(now) - Date.parse(postedAt)) / 36e5);
    S.snapshots.push({ at: now, hours, ...(await insights(id)), likes_count: meta.like_count, comments_count: meta.comments_count });
    S.comments = c.data;
    mkdirSync(join(root, "stats", d), { recursive: true });
    writeFileSync(file, JSON.stringify(S, null, 1));
    const L = S.snapshots.at(-1); n++;
    console.log(`${d} ${set} (${hours}h) 도달 ${L.reach} 좋아요 ${L.likes} 저장 ${L.saved} 공유 ${L.shares} 댓글 ${L.comments}`);
  } catch (e) { fail++; console.log("실패", d, set, e.message) }
}

try {
  const a = await get(uid, { fields: "username,followers_count,media_count" }), file = join(root, "stats", "account.json");
  const A = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  A.push({ at: now, ...a, id: undefined }); mkdirSync(join(root, "stats"), { recursive: true }); writeFileSync(file, JSON.stringify(A, null, 1));
  console.log(`계정 @${a.username} 팔로워 ${a.followers_count} 게시물 ${a.media_count}`);
} catch (e) { fail++; console.log("계정 정보 실패", e.message) }
console.log(`게시물 ${n}개 수집, 실패 ${fail}`);
process.exit(fail && !n ? 1 : 0);
