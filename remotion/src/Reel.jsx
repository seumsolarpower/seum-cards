// seum 릴스 (Remotion): 실제 영상 배경 + 말에 맞춰 튀는 자막 + 한 줄씩 찍히는 영수증
// 색은 검정·흰색·민트(#1fd8a4), 글꼴 Pretendard. 오른쪽 아래(x≥930, y 1000~1700)와 위 220·아래 420px는 비움
import React, { useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const MINT = "#1fd8a4", INK = "#0e0f10";
const font = new FontFace("P", `url(${staticFile("Pretendard.woff2")}) format("woff2")`, { weight: "45 920" });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// *강조* → 민트
const marks = (s, color = MINT) => s.split(/(\*[^*]+\*)/).map((p, i) => p.startsWith("*") ? <span key={i} style={{ color }}>{p.slice(1, -1)}</span> : p);
const num = (v, d = 0) => v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });

function Bg({ src, first }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const punch = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } });
  const scale = interpolate(punch, [0, 1], [first ? 1.04 : 1.18, 1.04]) + f * .0007;
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.12) 38%, rgba(0,0,0,.2) 55%, rgba(0,0,0,.78) 100%)" }} />
      {!first && <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 5], [.4, 0], clamp) }} />}
    </AbsoluteFill>
  );
}

// 자막: 지금 말하는 덩어리 하나만, 튀어나오며 등장
function Caption({ cap }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const c = cap.find(c => f >= c.from && f < c.to) || (f >= cap.at(-1).from ? cap.at(-1) : null);
  if (!c) return null;
  const s = spring({ frame: f - c.from, fps, config: { damping: 11, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 170, top: 1160, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [.55, 1])}) rotate(${interpolate(s, [0, 1], [-4, 0])}deg)`, opacity: interpolate(s, [0, .3], [0, 1], clamp),
        font: "900 86px/1.22 P", letterSpacing: "-.04em", color: "#fff", textAlign: "center", wordBreak: "keep-all",
        textShadow: "0 6px 0 #000, 0 -3px 0 #000, 4px 0 0 #000, -4px 0 0 #000, 0 0 30px rgba(0,0,0,.55)" }}>{marks(c.txt)}</div>
    </div>
  );
}

// 첫 장면: 큰 숫자 카운트업
function Big({ big }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const p = interpolate(f, [2, 20], [0, 1], clamp), e = 1 - Math.pow(1 - p, 3);
  const s = spring({ frame: f - 20, fps, config: { damping: 9, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", color: "#fff" }}>
      <div style={{ display: "inline-block", padding: "10px 26px", borderRadius: 40, background: MINT, color: INK, font: "800 40px/1 P", letterSpacing: "-.02em",
        transform: `translateY(${interpolate(f, [0, 8], [-30, 0], clamp)}px)`, opacity: interpolate(f, [0, 6], [0, 1], clamp) }}>{big.label}</div>
      <div style={{ marginTop: 16, font: "900 330px/1 P", letterSpacing: "-.06em", fontVariantNumeric: "tabular-nums",
        transform: `scale(${1 + .12 * Math.sin(Math.PI * Math.min(1, Math.max(0, s)))})`, textShadow: "0 10px 40px rgba(0,0,0,.45)" }}>
        {num(Math.round(big.to * e))}<span style={{ fontSize: 120, marginLeft: 8 }}>{big.unit}</span>
      </div>
    </div>
  );
}

// 영수증: 줄마다 인쇄되듯 늘어나고 숫자가 올라감. cta 때는 '나' 칸이 생김
function Receipt({ plan, f }) {
  const { fps } = useVideoConfig();
  const B = plan.beats, firstRow = B.find(b => b.mode === "row");
  if (!firstRow || f < firstRow.start) return null;
  const R = plan.receipt, drop = spring({ frame: f - firstRow.start, fps, config: { damping: 15, stiffness: 140 } });
  const cur = B.findLast(b => f >= b.start);
  const cta = B.find(b => b.mode === "cta"), stampB = B.find(b => b.mode === "stamp");
  const rows = R.rows.map((r, k) => { const b = B.find(b => b.mode === "row" && b.row === k); return { ...r, at: b ? b.start + 6 : Infinity, on: b === cur } });
  return (
    <div style={{ position: "absolute", left: 56, top: 296, width: 640, transform: `translateY(${interpolate(drop, [0, 1], [-900, 0])}px) rotate(-2deg)`, transformOrigin: "50% 0", filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }}>
      <div style={{ background: "#fff", color: INK, padding: "34px 36px 22px", borderRadius: "22px 22px 0 0" }}>
        <div style={{ font: "800 22px/1 P", letterSpacing: ".28em", color: "#8a9096" }}>RECEIPT · seum.</div>
        <div style={{ marginTop: 12, font: "900 50px/1.1 P", letterSpacing: "-.04em" }}>{R.title}</div>
        <div style={{ marginTop: 8, font: "700 24px/1 P", color: "#8a9096" }}>{R.sub}</div>
        <div style={{ margin: "22px 0 6px", borderTop: "3px dashed #c4cac7" }} />
        {rows.map((r, k) => {
          const g = interpolate(f, [r.at, r.at + 6], [0, 1], clamp);
          if (g <= 0) return null;
          const p = interpolate(f, [r.at, r.at + 14], [0, 1], clamp), v = Math.round(r.v * (1 - Math.pow(1 - p, 3)));
          const me = cta ? spring({ frame: f - (cta.start + 10 + k * 6), fps, config: { damping: 10, stiffness: 240 } }) : 0;
          return (
            <div key={k} style={{ height: 96 * g, overflow: "hidden", opacity: g }}>
              <div style={{ height: 84, marginTop: 6, display: "flex", alignItems: "center", gap: 14, padding: "0 14px", borderRadius: 16, background: r.on ? MINT : "transparent" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "800 36px/1.05 P", letterSpacing: "-.03em" }}>{r.k}</div>
                  {r.note && <div style={{ marginTop: 4, font: "700 20px/1 P", color: r.on ? INK : "#8a9096" }}>{r.note}</div>}
                </div>
                <div style={{ font: "900 52px/1 P", letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums" }}>{num(v)}<span style={{ fontSize: 28 }}>{r.u}</span></div>
                {cta && me > 0 && <div style={{ width: 130, height: 64, borderRadius: 14, border: `4px dashed ${INK}`, display: "grid", placeItems: "center", font: "900 30px/1 P", transform: `scale(${me})` }}>나</div>}
              </div>
            </div>
          );
        })}
        <div style={{ margin: "14px 0 0", borderTop: "3px dashed #c4cac7", paddingTop: 12, font: "600 17px/1.35 P", color: "#8a9096", wordBreak: "keep-all" }}>{plan.src}</div>
      </div>
      <div style={{ height: 22, background: "linear-gradient(-45deg, transparent 15px, #fff 0) 0 0/30px 22px repeat-x, linear-gradient(45deg, transparent 15px, #fff 0) 0 0/30px 22px repeat-x" }} />
      {stampB && f >= stampB.start + 8 && <Stamp s={stampB.stamp} f={f - stampB.start - 8} />}
    </div>
  );
}

function Stamp({ s, f }) {
  const sc = interpolate(f, [0, 6], [2.4, 1], { ...clamp, easing: t => 1 - Math.pow(1 - t, 3) });
  return (
    <div style={{ position: "absolute", right: -150, bottom: 40, transform: `rotate(-12deg) scale(${sc})`, opacity: interpolate(f, [0, 3], [0, 1], clamp),
      background: MINT, color: INK, border: `6px solid ${INK}`, borderRadius: 28, padding: "18px 28px", textAlign: "center", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
      <div style={{ font: "800 28px/1 P", letterSpacing: "-.02em" }}>{s.top}</div>
      <div style={{ marginTop: 8, font: "900 64px/1 P", letterSpacing: "-.05em" }}>{s.big}</div>
      <div style={{ marginTop: 8, font: "800 26px/1 P" }}>{s.sub}</div>
    </div>
  );
}

export const Reel = ({ plan }) => {
  const [h] = useState(() => delayRender("font"));
  useState(() => font.load().then(() => { document.fonts.add(font); continueRender(h) }));
  const f = useCurrentFrame();
  const B = plan.beats, stampB = B.find(b => b.mode === "stamp");
  // 도장 찍힐 때 화면 흔들림
  const sh = stampB ? f - stampB.start - 8 : -1, shake = sh >= 0 && sh < 8 ? (8 - sh) * 2.2 * (sh % 2 ? 1 : -1) : 0;
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "P" }}>
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${-shake * .6}px)` }}>
        {B.map((b, i) => (
          <Sequence key={i} from={b.start} durationInFrames={b.dur}>
            <Bg src={b.broll} first={i === 0} />
            {b.mode === "big" && <Big big={b.big} />}
            <Caption cap={b.cap} />
            <Sequence from={b.vo.at}><Audio src={staticFile(b.vo.file)} /></Sequence>
            {i > 0 && <Audio src={staticFile("sfx/whoosh.wav")} volume={.55} />}
            {b.mode === "big" && <Sequence from={20}><Audio src={staticFile("sfx/ding.wav")} volume={.5} /></Sequence>}
            {b.mode === "row" && <Sequence from={6}><Audio src={staticFile("sfx/tick.wav")} volume={.7} /></Sequence>}
            {b.mode === "row" && <Sequence from={10}><Audio src={staticFile("sfx/tick.wav")} volume={.7} /></Sequence>}
            {b.mode === "stamp" && <Sequence from={8}><Audio src={staticFile("sfx/thud.wav")} volume={.9} /></Sequence>}
            {b.mode === "cta" && plan.receipt.rows.map((_, k) => <Sequence key={k} from={10 + k * 6}><Audio src={staticFile("sfx/pop.wav")} volume={.5} /></Sequence>)}
          </Sequence>
        ))}
        <Receipt plan={plan} f={f} />
        <div style={{ position: "absolute", left: 64, top: 226, font: "800 40px/1 P", letterSpacing: "-.03em", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.4)" }}>seum<span style={{ color: MINT }}>.</span></div>
      </AbsoluteFill>
      {plan.music && <Audio src={staticFile("music.mp3")} volume={.12} loop />}
    </AbsoluteFill>
  );
};
