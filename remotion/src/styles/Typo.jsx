// 키네틱 타이포형: 검정 화면에 자막 덩어리가 화면을 꽉 채우며 쾅쾅 등장
// beat.kick: 위쪽 작은 알약 문구. beat.stack: 덩어리가 아래로 쌓임(연도 목록 등). "*8,229억*"처럼 숫자 하나뿐인 덩어리는 카운트업
import React from "react";
import { AbsoluteFill, Logo, MINT, INK, Sfx, Src, Voices, clamp, curCap, ease, interpolate, marks, num, plain, spring, useCurrentFrame, useFont, useVideoConfig } from "./common.jsx";

// 한글은 글자 폭이 넓어서 960px 안에 한 줄로 들어가게 (글자당 약 1em)
const sizeOf = t => { const L = [...plain(t)].length; return Math.min(300, Math.floor(900 / Math.max(L, 1))) };
const NUM = /^\*([\d,]+)([^\d*]*)\*$/;

function Slam({ c, f, rot, fg = "#fff", accent = MINT }) {
  const { fps } = useVideoConfig();
  const t = f - c.from, s = spring({ frame: t, fps, config: { damping: 12, stiffness: 240 } });
  const m = c.txt.match(NUM), size = sizeOf(c.txt), em = /\*/.test(c.txt);
  let body = marks(c.txt, accent);
  if (m) { const to = +m[1].replace(/,/g, ""), p = ease(interpolate(t, [0, 16], [0, 1], clamp)); body = <span style={{ color: accent }}>{num(Math.round(to * p))}<span style={{ fontSize: size * .5 }}>{m[2]}</span></span> }
  return (
    <div style={{ transform: `scale(${interpolate(s, [0, 1], [1.7, 1])}) rotate(${rot * (1 - s)}deg)`, filter: `blur(${interpolate(s, [0, .6], [14, 0], clamp)}px)`, opacity: interpolate(s, [0, .25], [0, 1], clamp),
      font: `900 ${size}px/1.08 P`, letterSpacing: "-.055em", color: fg, textAlign: "center", wordBreak: "keep-all", fontVariantNumeric: "tabular-nums",
      textShadow: em && accent === MINT ? "0 0 60px rgba(31,216,164,.35)" : "none" }}>{body}</div>
  );
}

// 쌓이는 목록: 앞 줄은 작고 흐리게, 새 줄이 쾅
function Stack({ b, f }) {
  const { fps } = useVideoConfig();
  const lines = b.cap.filter(c => f >= c.from);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: "flex-start", width: 860 }}>
      {lines.map((c, k) => {
        const s = spring({ frame: f - c.from, fps, config: { damping: 12, stiffness: 240 } }), last = k === lines.length - 1;
        const [, big = "", rest = c.txt] = c.txt.match(/^\*([^*]+)\*\s*(.*)$/) || [];
        return (
          <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 30, opacity: interpolate(s, [0, .3], [0, last ? 1 : .45], clamp),
            transform: `translateX(${interpolate(s, [0, 1], [-120, 0])}px) scale(${interpolate(s, [0, 1], [1.3, 1])})`, transformOrigin: "0 50%" }}>
            <span style={{ font: "900 170px/1 P", letterSpacing: "-.05em", color: last ? MINT : "#fff" }}>{big}</span>
            <span style={{ font: "800 64px/1 P", letterSpacing: "-.03em", color: "#fff" }}>{rest}</span>
          </div>
        );
      })}
    </div>
  );
}

export const Typo = ({ plan }) => {
  useFont();
  const g = useCurrentFrame(), { fps } = useVideoConfig();
  const B = plan.beats, i = B.findLastIndex(b => g >= b.start), b = B[i], f = g - b.start;
  const c = curCap(b.cap, f), k = c ? b.cap.indexOf(c) : 0;
  const ring = c ? interpolate(f - c.from, [0, 16], [0, 1], clamp) : 1;
  const kin = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 } });
  const isCta = i === B.length - 1;
  return (
    <AbsoluteFill style={{ background: isCta ? MINT : INK, fontFamily: "P", overflow: "hidden" }}>
      {/* 덩어리마다 퍼지는 민트 원 (박자감) */}
      <div style={{ position: "absolute", left: 540 - 700 * ring, top: 720 - 700 * ring, width: 1400 * ring, height: 1400 * ring, borderRadius: "50%",
        border: `${Math.max(1, 26 * (1 - ring))}px solid ${isCta ? INK : MINT}`, opacity: .35 * (1 - ring) }} />
      <Logo color={isCta ? INK : "#fff"} />
      {b.kick && <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `translateY(${interpolate(kin, [0, 1], [-40, 0])}px)`, opacity: kin }}>
        <span style={{ display: "inline-block", padding: "12px 28px", borderRadius: 44, background: isCta ? INK : MINT, color: isCta ? MINT : INK, font: "900 42px/1 P", letterSpacing: "-.02em" }}>{b.kick}</span>
      </div>}
      <div style={{ position: "absolute", left: 60, right: 60, top: 440, height: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {b.stack ? <Stack b={b} f={f} /> : c && <Slam key={`${i}-${k}`} c={c} f={f} rot={k % 2 ? 4 : -4} fg={isCta ? INK : "#fff"} accent={isCta ? INK : MINT} />}
      </div>
      {/* 진행 점: 지금 장면 위치 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", gap: 14 }}>
        {B.map((_, j) => <div key={j} style={{ width: j === i ? 44 : 14, height: 14, borderRadius: 7, background: isCta ? INK : j <= i ? MINT : "rgba(255,255,255,.25)" }} />)}
      </div>
      <Src text={plan.src} color={isCta ? "rgba(14,15,16,.55)" : undefined} />
      <Voices plan={plan} whoosh={.45} />
      {B.flatMap((bb, j) => bb.cap.map((cc, q) => <Sfx key={`${j}-${q}`} at={bb.start + cc.from} name={NUM.test(cc.txt) ? "thud" : "tick"} vol={NUM.test(cc.txt) ? .9 : .8} />))}
    </AbsoluteFill>
  );
};
