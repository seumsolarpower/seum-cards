// 카드 한 장 = HTML 한 페이지 (1080×1350). render.mjs가 브라우저로 찍어서 JPG로 만듦.
// 문구에 쓸 수 있는 태그: <em>(사진 위 강조색) <mk>(형광 칠) <b> <br> — 나머지는 전부 글자로 처리.
import { readFileSync } from "fs";
import { CHAR } from "./char.mjs";
import { FACE } from "./faces.mjs";

const ROOT = new URL("..", import.meta.url);
const PALETTES = {
  mint: { acc: "#19e0a8", mk: "#a3f3dc" },
  pistachio: { acc: "#c6ea8f", mk: "#e2f5c7" },
  lime: { acc: "#c8ff2e", mk: "#c8ff2e" },
};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const rich = s => esc(s)
  .replace(/&lt;(\/?)(em|b)&gt;/g, "<$1$2>")
  .replace(/&lt;br\s*\/?&gt;/g, "<br>")
  .replace(/&lt;mk&gt;/g, '<span class="mk">').replace(/&lt;\/mk&gt;/g, "</span>");
const dataUri = (file, type) => `data:${type};base64,${readFileSync(new URL(file, ROOT)).toString("base64")}`;

let fontUri, fontUriRound, fontUriBold, fontUriHand, fontUriPen;
function css(pal) {
  fontUri ??= dataUri("fonts/PretendardVariable.woff2", "font/woff2");
  fontUriRound ??= dataUri("fonts/NanumSquareRound.woff", "font/woff");
  fontUriBold ??= dataUri("fonts/GangwonEdu.woff", "font/woff");
  fontUriHand ??= dataUri("fonts/BaeminJua.woff", "font/woff");
  fontUriPen ??= dataUri("fonts/NanumPenScript.woff2", "font/woff2");
  const p = PALETTES[pal] || PALETTES.mint;
  return `
@font-face{font-family:"Pretendard";src:url("${fontUri}") format("woff2");font-weight:45 920}
@font-face{font-family:"NanumRound";src:url("${fontUriRound}") format("woff")}
@font-face{font-family:"GangwonEdu";src:url("${fontUriBold}") format("woff")}
@font-face{font-family:"BaeminJua";src:url("${fontUriHand}") format("woff")}
@font-face{font-family:"NanumPen";src:url("${fontUriPen}") format("woff2")}
:root{--black:#0e0e10;--white:#fff;--acc:${p.acc};--mk:${p.mk};--f:"BaeminJua","NanumRound",sans-serif;--fb:"BaeminJua",sans-serif;--fpen:"NanumPen",cursive}
*{box-sizing:border-box}html,body{margin:0;background:#000}
.card{word-break:keep-all;overflow-wrap:anywhere;container-type:inline-size;width:1080px;height:1080px;position:relative;overflow:hidden;background:var(--black);color:var(--white);font-family:var(--f);letter-spacing:-.01em}
.card>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.05) saturate(.96)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgb(14 14 16/0) 40%,rgb(14 14 16/.6) 64%,rgb(14 14 16/.92) 100%)}
.top{position:absolute;left:5.5cqw;right:5.5cqw;top:5cqw;display:flex;justify-content:space-between;align-items:center;font:600 2.8cqw/1 var(--f);opacity:.9}
.logo{font:800 3cqw/1 var(--f);letter-spacing:-.03em}.logo b{color:var(--acc);font-weight:800}
.hd{position:absolute;left:5.5cqw;right:5.5cqw;bottom:6cqw;margin:0;font:800 7.6cqw/1.26 var(--fb);letter-spacing:-.045em;text-wrap:balance}
.hd em{font-style:normal;color:var(--acc)}
.hd small{display:block;font:600 3.2cqw/1.4 var(--f);color:rgb(255 255 255/.72);margin-bottom:2cqw;letter-spacing:-.02em}
.bub{position:absolute;background:var(--white);color:var(--black);border-radius:50%;padding:3.4cqw 4.8cqw;font:600 3.4cqw/1.32 var(--f);text-align:center;letter-spacing:-.03em;box-shadow:0 1cqw 3cqw rgb(0 0 0/.25);max-width:40cqw}
.bub::after{content:"";position:absolute;width:3.2cqw;height:3.2cqw;background:var(--white);bottom:-1.2cqw;transform:rotate(45deg)}
.bub.l{left:5cqw}.bub.l::after{left:24%}.bub.r{right:5cqw}.bub.r::after{right:24%}
.lb{position:absolute;background:rgb(14 14 16/.32);color:#fff;backdrop-filter:blur(.9cqw) saturate(1.2);border:.2cqw solid rgb(255 255 255/.18);font:600 3.2cqw/1 var(--f);padding:1.8cqw 2.6cqw;border-radius:1cqw;letter-spacing:-.02em}
.lb b{color:var(--acc);font-weight:800}.lb .n{opacity:.75}
.lb svg{display:block;width:100%;height:auto;margin-top:1.4cqw}
.say{position:absolute;color:#fff;font:800 8.4cqw/1.1 var(--f);letter-spacing:-.05em;text-shadow:0 .4cqw 1.2cqw rgb(0 0 0/.55),0 0 4cqw rgb(0 0 0/.35)}
.say em{font-style:normal;color:var(--acc)}
.l{left:5.5cqw}.r{right:5.5cqw}
.cr{position:absolute;right:5.5cqw;bottom:1.8cqw;font:500 2cqw/1 var(--f);color:rgb(255 255 255/.5)}
.tx{background:var(--white);color:var(--black);padding:7.5cqw 7cqw 6cqw;display:flex;flex-direction:column}
.top2{display:flex;justify-content:space-between;align-items:center;font:600 2.8cqw/1 var(--f);color:#888}
.top2 .logo{color:var(--black)}.top2 .logo b{color:var(--black)}
.kick{margin-top:7cqw;font:700 3.4cqw/1 var(--f);color:#777;letter-spacing:-.02em}
.big{margin:3cqw 0 0;font:800 7cqw/1.28 var(--fb);letter-spacing:-.05em;text-wrap:balance}
.mk{background:var(--mk);padding:0 1cqw;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.body{margin:auto 0 0;font:500 3.6cqw/1.6 var(--f);letter-spacing:-.03em;color:#333}.body b{font-weight:800;color:var(--black)}
.ft{margin-top:3.4cqw;font:500 2.4cqw/1.3 var(--f);color:#777}
.stats{margin-top:6cqw;display:grid;grid-template-columns:1fr 1fr;gap:2.4cqw}
.stats div{background:#f4f4f2;border-radius:2.4cqw;padding:3cqw 3.4cqw;display:grid;gap:1.4cqw}
.stats span{font:600 2.8cqw/1 var(--f);color:#777}.stats b{font:800 6cqw/1 var(--f);letter-spacing:-.04em}
.stats b.up{color:#e5372b}.stats b.dn{color:#2563eb}
.bars{margin-top:6cqw;display:grid;gap:1.6cqw}
.bw{display:flex;align-items:flex-end;gap:1.6cqw;height:26cqw;border-bottom:.3cqw solid #ddd}
.bw i{flex:1;background:#c9ccd3;border-radius:1cqw 1cqw 0 0}.bw i.u{background:var(--black);box-shadow:inset 0 1.6cqw 0 var(--mk)}
.bl{display:flex;justify-content:space-between;font:600 2.8cqw/1 var(--f);color:#777}
.def{margin-top:6cqw;background:#f4f4f2;border-radius:2.4cqw;padding:3.6cqw 4cqw;display:grid;gap:1.6cqw}
.def b{font:800 3.6cqw/1 var(--f)}.def span{font:500 3.3cqw/1.5 var(--f);color:#444;letter-spacing:-.03em}
.cmp{margin-top:6cqw;display:grid;gap:2cqw}
.cmp div{display:grid;grid-template-columns:16cqw 1fr;gap:2cqw;align-items:baseline;border-bottom:.25cqw solid #eee;padding-bottom:2cqw}
.cmp span{font:700 3.2cqw/1.3 var(--f);color:#666}.cmp b{font:700 4.2cqw/1.35 var(--f);letter-spacing:-.03em}
.sum{list-style:none;margin:5cqw 0 0;padding:0;display:grid;counter-reset:n}
.sum li{counter-increment:n;display:grid;grid-template-columns:7cqw 1fr;gap:1cqw;padding:4.4cqw 0;border-top:.25cqw solid #e8e8e8;font:700 4.4cqw/1.38 var(--f);letter-spacing:-.035em}
.sum li::before{content:counter(n,decimal-leading-zero);font:800 3cqw/1.9 var(--f);color:#999}
.q{margin-top:auto;align-self:flex-start;background:var(--black);color:var(--white);border-radius:4cqw 4cqw 4cqw 1cqw;padding:3cqw 4cqw;font:600 3.3cqw/1.4 var(--f);letter-spacing:-.03em}
.q b{color:var(--acc);font-weight:800}
.cta{margin-top:4cqw;display:flex;justify-content:space-between;align-items:center;font:600 2.9cqw/1.3 var(--f);color:#777;border-top:.25cqw solid #e8e8e8;padding-top:3.4cqw}
.cta b{color:var(--black);font-weight:800}
/* 큰 숫자 하나 */
.hero{margin-top:4.6cqw;display:grid;gap:1.6cqw}
.hv{font:800 15cqw/.95 var(--f);letter-spacing:-.06em;font-variant-numeric:tabular-nums}
.hv.up{color:#e5372b}.hv.dn{color:#2563eb}
.hl2{font:600 3.6cqw/1.4 var(--f);color:#444;letter-spacing:-.03em}
/* 캡처 짤 카드 */
/* 가로 캡처는 자르지 않고 가운데 띠로, 위아래 검은 칸에 자막 (짤 원래 모양) */
.jj{background:#0e0e10;display:flex;flex-direction:column;justify-content:center;gap:5cqw;padding:12cqw 0 8cqw}
.jj>img{position:static;width:100%;height:auto;flex:none;object-fit:contain}
.jshade{display:none}
.jt{order:-1}
.jt,.jb{padding:0 6cqw;text-align:center;font:800 7cqw/1.24 var(--f);letter-spacing:-.05em;color:#fff;text-wrap:balance}
.jt em,.jb em{font-style:normal;color:var(--acc)}
.jn{position:absolute;left:6cqw;right:6cqw;bottom:3.6cqw;text-align:center;font:500 2.8cqw/1.4 var(--f);color:rgb(255 255 255/.75)}
/* 짤 카드 */
.mm .big{font-size:6.4cqw}
.mf{position:relative;margin-top:4.4cqw;border-radius:2.4cqw;overflow:hidden;border:.3cqw solid var(--black);background:#fff;flex:none}
.mf img{display:block;width:100%;height:100%;object-fit:cover}
.ov{position:absolute;font:800 4.4cqw/1.2 var(--f);font-style:normal;text-align:center;color:var(--black);letter-spacing:-.04em;text-shadow:0 0 .5cqw #fff,0 0 .5cqw #fff,0 0 1cqw #fff}
.ov.s{font-size:3.6cqw;font-weight:700}
.ov.box{text-shadow:none;font-size:3.9cqw;line-height:1.3;transform:translateY(-50%)}
.ov.sm{text-shadow:none;font-size:2.7cqw;line-height:1.25;font-weight:700}
.mf.tall{height:90cqw;width:auto;align-self:center;margin-top:3.6cqw}
.mf.tall .ov.box{font-size:3.6cqw}
.ov.cap{text-align:left;font-size:4.6cqw;text-shadow:none}
.ov.w2{color:#fff;text-shadow:0 .3cqw 1cqw rgb(0 0 0/.8);font-size:4.4cqw}
.mm .body{margin-top:auto;padding-top:3.4cqw;font-size:3.8cqw;color:#222}
.foot{margin-top:3cqw;display:flex;justify-content:space-between;align-items:center;font:500 2.4cqw/1.3 var(--f);color:#777;border-top:.25cqw solid #eee;padding-top:2.6cqw}
.foot b{color:var(--black);font-weight:800;font-size:2.8cqw}
.phw .bub{z-index:2}
/* 안쪽 카드: 위 사진 + 아래 흰 판 */
.tx.ph{padding:0}
.phw{position:relative;height:46cqw;flex:none;overflow:hidden;background:var(--black)}
.phw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.05) saturate(.95)}
.phw::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(14 14 16/.45),rgb(14 14 16/0) 30%,rgb(14 14 16/0) 60%,rgb(14 14 16/.55))}
.phw .top{z-index:2;color:#fff}
.phw .kick2{position:absolute;z-index:2;left:7cqw;bottom:4.6cqw;background:rgb(14 14 16/.32);backdrop-filter:blur(.9cqw) saturate(1.2);border:.2cqw solid rgb(255 255 255/.18);color:#fff;font:700 3.4cqw/1 var(--f);padding:2cqw 2.8cqw;border-radius:1cqw;letter-spacing:-.02em}
.phw .cr{z-index:2;bottom:2cqw}
.inner{flex:1;display:flex;flex-direction:column;padding:5cqw 7cqw 5.4cqw;min-height:0}
.ph .big{margin:0;font-size:6.4cqw}
.ph .stats{margin-top:4.4cqw;grid-template-columns:repeat(4,1fr);gap:1.6cqw}
.ph .stats div{padding:2.8cqw 2.2cqw;gap:1.6cqw}.ph .stats b{font-size:5cqw}.ph .stats span{font-size:2.8cqw;color:#555}
.ph .bars{margin-top:4.4cqw}.ph .bw{height:17cqw}
.ph .def{margin-top:4.4cqw;padding:3cqw 3.6cqw}
.ph .cmp{margin-top:4cqw;gap:1.6cqw}.ph .cmp div{padding-bottom:1.6cqw}
.ph .body{font-size:3.8cqw;color:#222;margin-top:auto;padding-top:3.4cqw}
.ph .ft{margin-top:2.4cqw}
/* 요약 카드: 흐린 사진 배경 + 유리 판 */
.sm{padding:7.5cqw 7cqw 6cqw;display:flex;flex-direction:column}
.sm>img{filter:blur(1.6cqw) brightness(.32) saturate(1.05);transform:scale(1.12)}
.sm>*:not(img):not(.cr){position:relative}
.sm .kick{margin-top:7cqw;color:rgb(255 255 255/.7)}
.sm .sum{margin-top:4cqw;background:rgb(255 255 255/.08);border:.2cqw solid rgb(255 255 255/.16);backdrop-filter:blur(1cqw);border-radius:3cqw;padding:0 4.4cqw}
.sm .sum li{border-top:.2cqw solid rgb(255 255 255/.14);color:#fff;font-size:4.8cqw}.sm .sum li:first-child{border-top:0}
.sm .sum li::before{color:rgb(255 255 255/.5)}
.sm .sum .mk{color:var(--black)}
.sm .q{background:var(--white);color:var(--black)}.sm .q b{color:var(--black);background:var(--mk);padding:0 .8cqw}
.sm .cta{color:rgb(255 255 255/.65);border-top-color:rgb(255 255 255/.18)}.sm .cta b{color:#fff}
.sm .top2{color:rgb(255 255 255/.7)}.sm .top2 .logo{color:#fff}.sm .top2 .logo b{color:var(--acc)}
.sm .cr{bottom:1.6cqw}
/* 따뜻한 톤 (brand.tone: "warm"): 사진만 살짝 노랗게·부드럽게. 짤·밈 그림은 그대로 */
.warm:not(.jj):not(.sm)>img,.warm .phw img{filter:sepia(.16) saturate(1.08) contrast(.96) brightness(1.04)}
.warm.sm>img{filter:blur(1.6cqw) brightness(.36) sepia(.35) saturate(1.15)}
/* 세움이 캐릭터 */
.ch{position:absolute;width:26cqw;height:auto;z-index:10;filter:drop-shadow(0 .6cqw 1.6cqw rgb(0 0 0/.3))}
.card>.ch{bottom:8cqw;right:6cqw}
.tx .ch{bottom:5cqw;right:5cqw}
.sm .ch{bottom:8cqw;right:6cqw}
/* 표정 얼굴 */
.face{position:absolute;width:35cqw;height:auto;z-index:9;filter:drop-shadow(0 .8cqw 2cqw rgb(0 0 0/.35))}
.card>.face{top:12cqw;left:6cqw}
.tx .face{top:auto;bottom:6cqw;left:6cqw;width:30cqw}
/* 손글씨 강조 */
.pen{font-family:var(--fpen)!important;font-size:1.15em;letter-spacing:-.01em}`;
}

// 브랜드: content의 "brand"로 바꿀 수 있음 (이름 확정 전 기본값)
const BRAND = { logo: "seum", handle: "@seum.now" };
let BR = BRAND;
const logo = () => `<span class="logo">${esc(BR.logo)}<b>.</b></span>`;
// 위치: {side:"l"|"r", top:숫자(cqw)}
const pos = p => `${p.side === "r" ? "right" : "left"}:5.5cqw;top:${Number(p.top) || 0}cqw`;

function chart(c) {
  const pts = (c.points || [6, 10, 9, 16, 19, 24, 28, 36]).map((y, i) => `${4 + i * 12},${y}`);
  const last = pts[pts.length - 1].split(","), end = [Number(last[0]) + 18, c.end ?? 18];
  return `<div class="lb" style="${pos({ side: c.side || "r", top: c.top ?? 13 })};width:30cqw"><span class="n">${esc(c.label)}</span> <b>${esc(c.value)}</b>
<svg viewBox="0 0 120 44" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${last.join(",")} ${end.join(",")}" fill="none" stroke="var(--acc)" stroke-width="4" stroke-linecap="round"/><circle cx="${end[0]}" cy="${end[1]}" r="4.5" fill="var(--acc)"/></svg></div>`;
}

const T = {
  cover: (c, n, total) => `<div class="card">
<img src="${dataUri("assets/" + c.photo, "image/jpeg")}" alt="" style="object-position:${esc(c.pos || "50% 20%")}">
<div class="shade"></div>
<div class="top">${logo()}<span>${n}/${total} →</span></div>
${c.face ? FACE[c.face] : ""}
${c.bubble ? `<div class="bub ${c.bubble.side === "r" ? "r" : "l"}" style="top:${Number(c.bubble.top) || 13}cqw">${rich(c.bubble.text)}</div>` : ""}
${c.chart ? chart(c.chart) : ""}
${c.say ? `<div class="say" style="${pos(c.say)};text-align:${c.say.side === "r" ? "right" : "left"}">${rich(c.say.text)}</div>` : ""}
${(c.tags || []).map(t => `<div class="lb" style="${pos(t)}">${rich(t.text)}</div>`).join("")}
${c.char ? CHAR(c.char) : ""}
<h2 class="hd">${c.small ? `<small>${esc(c.small)}</small>` : ""}${rich(c.title)}</h2>
<div class="cr">Photo: ${esc(c.credit)}</div></div>`,
  facts: c => c.hero ? `<b class="hv ${c.hero.dir || ""}">${esc(c.hero.value)}</b><span class="hl2">${rich(c.hero.label)}</span>` : `${c.stats.map(([k, v, d]) => `<div><span>${esc(k)}</span><b class="${d || ""}">${esc(v)}</b></div>`).join("")}`,
  bars: c => `<div class="bw">${c.bars.map((v, i) => `<i class="${i === c.bars.length - 1 ? "u" : ""}" style="height:${Number(v)}%"></i>`).join("")}</div><div class="bl"><span>${esc(c.labels[0])}</span><span>${esc(c.labels[1])}</span></div>`,
  define: c => `<b>${esc(c.term)}</b><span>${esc(c.def)}</span>`,
  compare: c => c.rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${rich(v)}</b></div>`).join(""),
};
const WRAP = { facts: "stats", bars: "bars", define: "def", compare: "cmp" };

const mime = f => f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg";
const img = c => `<img src="${dataUri("assets/" + c.photo, mime(c.photo))}" alt="" style="object-position:${esc(c.pos || "50% 50%")}">`;
// 짤 템플릿: 칸 위치(%)는 원본 이미지 기준. 대사는 content의 texts 배열 순서대로
const MEMES = {
  doge: { file: "meme-doge.png", ratio: "937/720", slots: [{ l: 2, t: 3, w: 44 }, { l: 58, t: 10, w: 40 }, { l: 2, t: 80, w: 46, s: 1 }, { l: 56, t: 82, w: 42, s: 1 }] },
  monkey: { file: "meme-monkey.jpg", ratio: "923/768", slots: [{ l: 5, t: 5, w: 90, cap: 1 }, { l: 54, t: 86, w: 42, s: 1, w2: 1 }] },
  // 걱정 → 안도 → 다시 걱정
  panik: { file: "meme-panik.png", ratio: "640/881", tall: 1, slots: [{ l: 4, t: 17, w: 41, box: 1 }, { l: 4, t: 50, w: 41, box: 1 }, { l: 4, t: 84, w: 41, box: 1 }] },
  // 싫은 것 vs 좋은 것
  drake: { file: "meme-drake.jpg", ratio: "1/1", slots: [{ l: 53, t: 18, w: 44, box: 1 }, { l: 53, t: 68, w: 44, box: 1 }] },
  // 계획이 마지막에 꼬임 (4칸 칠판)
  gru: { file: "meme-gru.jpg", ratio: "700/449", slots: [{ l: 28, t: 14, w: 20, sm: 1 }, { l: 78, t: 14, w: 20, sm: 1 }, { l: 28, t: 64, w: 20, sm: 1 }, { l: 78, t: 64, w: 20, sm: 1 }] },
  buttons: { file: "meme-buttons.jpg", ratio: "600/908", tall: 1, slots: [{ l: 13, t: 16, w: 32, rot: -12 }, { l: 47, t: 9, w: 30, rot: -12 }, { l: 20, t: 86, w: 60, w2: 1 }] },
};
function memeBox(c) {
  const m = MEMES[c.meme]; if (!m) throw new Error("모르는 짤: " + c.meme);
  const lab = m.slots.map((p, i) => c.texts[i] ? `<i class="ov${p.s ? " s" : ""}${p.cap ? " cap" : ""}${p.w2 ? " w2" : ""}${p.box ? " box" : ""}${p.sm ? " sm" : ""}" style="left:${p.l}%;top:${p.t}%;width:${p.w}%${p.rot ? `;transform:rotate(${p.rot}deg)` : ""}">${rich(c.texts[i])}</i>` : "").join("");
  return `<div class="mf${m.tall ? " tall" : ""}" style="aspect-ratio:${m.ratio}"><img src="${dataUri("assets/" + m.file, mime(m.file))}" alt="">${lab}</div>`;
}
function textCard(c, n, total) {
  const bar = `<div class="top2">${logo()}<span>${n}/${total}</span></div>`, cr = c.credit ? `<div class="cr">Photo: ${esc(c.credit)}</div>` : "";
  if (c.type === "summary") return `<div class="card ${c.photo ? "sm" : "tx"}">${c.photo ? img(c) : ""}${bar}<div class="kick">${esc(c.kick)}</div>
<ol class="sum">${c.items.map(s => `<li><span>${rich(s)}</span></li>`).join("")}</ol>
<div class="q"><b>오늘의 한 줄</b> ${esc(c.quote)}</div>
<div class="cta"><span>${esc(c.cta || "저장해 두고 회의 때 아는 척 👀")}</span></div>${c.char ? CHAR(c.char) : ""}${cr}</div>`;
  if (c.type === "jjal" && c.jjal && !c.photo) {
    // 짤 사전(jjal/catalog.json)에서 확정된 이미지 찾기
    const m = JSON.parse(readFileSync(new URL("jjal/catalog.json", ROOT), "utf8")).items.find(x => x.id === c.jjal);
    if (!m?.image) throw new Error(`짤 "${c.jjal}" 이미지가 아직 없음 (fetch → pick 먼저)`);
    c = { ...c, photo: m.image };
  }
  if (c.type === "jjal") return `<div class="card jj">${img(c)}<div class="jshade"></div><div class="top">${logo()}<span>${n}/${total}</span></div>
${c.top ? `<div class="jt">${rich(c.top)}</div>` : ""}${c.bottom ? `<div class="jb">${rich(c.bottom)}</div>` : ""}</div>`;
  if (c.type === "meme") return `<div class="card tx mm">${bar}<div class="kick">${esc(c.kick)}</div>${c.big ? `<h3 class="big">${rich(c.big)}</h3>` : ""}
${memeBox(c)}<p class="body">${rich(c.body)}</p>${c.source ? `<div class="foot"><span>${esc(c.source)}</span></div>` : ""}</div>`;
  const mid = `<h3 class="big">${rich(c.big)}</h3><div class="${c.type === "facts" && c.hero ? "hero" : WRAP[c.type]}">${T[c.type](c)}</div><p class="body">${rich(c.body)}</p><div class="ft">${esc(c.source || "")}</div>`;
  if (c.photo) return `<div class="card tx ph"><div class="phw">${img(c)}<div class="top">${logo()}<span>${n}/${total}</span></div>${c.bubble ? `<div class="bub ${c.bubble.side === "l" ? "l" : "r"}" style="top:${Number(c.bubble.top) || 12}cqw">${rich(c.bubble.text)}</div>` : ""}<div class="kick2">${esc(c.kick)}</div>${cr}</div><div class="inner">${mid}</div>${c.face ? FACE[c.face] : ""}${c.char ? CHAR(c.char) : ""}</div>`;
  return `<div class="card tx">${bar}<div class="kick">${esc(c.kick)}</div>${mid}${c.face ? FACE[c.face] : ""}${c.char ? CHAR(c.char) : ""}</div>`;
}

export function cardInner(card, n, total, brand) {
  BR = { ...BRAND, ...(brand || {}) };
  if (!T[card.type] && !["summary", "meme", "jjal"].includes(card.type)) throw new Error("모르는 카드 종류: " + card.type);
  const h = card.type === "cover" ? T.cover(card, n, total) : textCard(card, n, total);
  return BR.tone === "warm" ? h.replace('class="card', 'class="card warm') : h;
}
export const cardCss = palette => css(palette);
export function cardHtml(card, n, total, palette = "mint", brand) {
  const inner = cardInner(card, n, total, brand);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css(palette)}</style></head><body>${inner}</body></html>`;
}
