// 플랫폼별 캐러셀 게시. 이미지는 공개 URL(인스타·스레드) 또는 파일(X)로 받음.
import { createHmac, randomBytes } from "crypto";
import { readFileSync } from "fs";

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function call(url, opt = {}) {
  const r = await fetch(url, opt), t = await r.text();
  let j; try { j = JSON.parse(t) } catch { j = { raw: t } }
  if (!r.ok) throw new Error(`${r.status} ${url.split("?")[0]} → ${t.slice(0, 300)}`);
  return j;
}
const form = o => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined));
// 컨테이너가 준비될 때까지 기다림 (최대 약 2분)
async function waitReady(get, okWord, field, tries = 24) {
  for (let i = 0; i < tries; i++) {
    const s = (await get())[field];
    if (s === okWord) return;
    if (s === "ERROR" || s === "EXPIRED") throw new Error("미디어 처리 실패: " + s);
    await sleep(5000);
  }
  throw new Error("미디어 처리 시간 초과");
}

// 인스타그램 (Instagram API with Instagram Login): 비즈니스/크리에이터 계정, JPG 공개 URL 필요
export async function instagram({ urls, caption }, env = process.env) {
  const B = `https://graph.instagram.com/${env.IG_API_VERSION || "v23.0"}`, id = env.IG_USER_ID, tk = env.IG_TOKEN;
  const kids = [];
  for (const u of urls) kids.push((await call(`${B}/${id}/media`, { method: "POST", body: form({ image_url: u, is_carousel_item: "true", access_token: tk }) })).id);
  const box = (await call(`${B}/${id}/media`, { method: "POST", body: form({ media_type: "CAROUSEL", children: kids.join(","), caption, access_token: tk }) })).id;
  await waitReady(() => call(`${B}/${box}?fields=status_code&access_token=${tk}`), "FINISHED", "status_code");
  return (await call(`${B}/${id}/media_publish`, { method: "POST", body: form({ creation_id: box, access_token: tk }) })).id;
}

// 인스타 릴스: mp4 공개 URL. 영상 처리가 길어서 최대 약 5분 기다림. 피드에도 같이 보임
export async function instagramReel({ videoUrl, caption }, env = process.env) {
  const B = `https://graph.instagram.com/${env.IG_API_VERSION || "v23.0"}`, id = env.IG_USER_ID, tk = env.IG_TOKEN;
  const box = (await call(`${B}/${id}/media`, { method: "POST", body: form({ media_type: "REELS", video_url: videoUrl, caption, share_to_feed: "true", access_token: tk }) })).id;
  await waitReady(() => call(`${B}/${box}?fields=status_code&access_token=${tk}`), "FINISHED", "status_code", 60);
  return (await call(`${B}/${id}/media_publish`, { method: "POST", body: form({ creation_id: box, access_token: tk }) })).id;
}

// 스레드 (Threads API): 글 500자, 이미지 공개 URL
export async function threads({ urls, caption }, env = process.env) {
  const B = "https://graph.threads.net/v1.0", id = env.THREADS_USER_ID, tk = env.THREADS_TOKEN;
  const kids = [];
  for (const u of urls) kids.push((await call(`${B}/${id}/threads`, { method: "POST", body: form({ media_type: "IMAGE", image_url: u, is_carousel_item: "true", access_token: tk }) })).id);
  const box = (await call(`${B}/${id}/threads`, { method: "POST", body: form({ media_type: "CAROUSEL", children: kids.join(","), text: caption.slice(0, 500), access_token: tk }) })).id;
  await waitReady(() => call(`${B}/${box}?fields=status&access_token=${tk}`), "FINISHED", "status");
  return (await call(`${B}/${id}/threads_publish`, { method: "POST", body: form({ creation_id: box, access_token: tk }) })).id;
}

// X: OAuth 1.0a 사용자 키로 이미지 업로드(최대 4장) 후 글 작성
const pct = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
export function oauth1(method, url, env, extra = {}) {
  const o = { oauth_consumer_key: env.X_API_KEY, oauth_nonce: env.OAUTH_NONCE || randomBytes(16).toString("hex"), oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: env.OAUTH_TS || String(Math.floor(Date.now() / 1000)), oauth_token: env.X_ACCESS_TOKEN, oauth_version: "1.0" };
  const all = { ...o, ...extra }, base = [method, pct(url), pct(Object.keys(all).sort().map(k => `${pct(k)}=${pct(all[k])}`).join("&"))].join("&");
  o.oauth_signature = createHmac("sha1", `${pct(env.X_API_SECRET)}&${pct(env.X_ACCESS_SECRET)}`).update(base).digest("base64");
  return "OAuth " + Object.keys(o).sort().map(k => `${pct(k)}="${pct(o[k])}"`).join(", ");
}
export async function x({ files, caption }, env = process.env) {
  const up = "https://api.x.com/2/media/upload", ids = [];
  for (const f of files.slice(0, 4)) {
    const fd = new FormData();
    fd.append("media", new Blob([readFileSync(f)], { type: "image/jpeg" }), "card.jpg");
    fd.append("media_category", "tweet_image");
    const j = await call(up, { method: "POST", headers: { Authorization: oauth1("POST", up, env) }, body: fd });
    ids.push(j.data?.id || j.media_id_string);
  }
  const tw = "https://api.x.com/2/tweets";
  const j = await call(tw, { method: "POST", headers: { Authorization: oauth1("POST", tw, env), "Content-Type": "application/json" }, body: JSON.stringify({ text: caption, media: { media_ids: ids } }) });
  return j.data?.id;
}

// X 글자 수: 한글·한자 등은 2자로 계산, 280 넘으면 자름
export function xText(s) {
  let n = 0, out = "";
  for (const ch of s) { const w = /[ᄀ-￿]/.test(ch) && !/[ -⁯]/.test(ch) ? 2 : 1; if (n + w > 280) break; n += w; out += ch }
  return out;
}
