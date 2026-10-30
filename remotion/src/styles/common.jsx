// 스타일 릴스(pov·typo·vault) 공용: 글꼴, 강조, 자막, 목소리·음악, 로고
import React, { useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const MINT = "#1fd8a4", INK = "#0e0f10", MUTE = "#8a9096";
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
export const ease = t => 1 - Math.pow(1 - t, 3);
export const num = (v, d = 0) => v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
// *강조* → 민트
export const marks = (s, color = MINT) => s.split(/(\*[^*]+\*)/).map((p, i) => p.startsWith("*") ? <span key={i} style={{ color }}>{p.slice(1, -1)}</span> : p);
export const plain = s => s.replace(/\*/g, "");

const font = new FontFace("P", `url(${staticFile("Pretendard.woff2")}) format("woff2")`, { weight: "45 920" });
export function useFont() {
  const [h] = useState(() => delayRender("font"));
  useState(() => font.load().then(() => { document.fonts.add(font); continueRender(h) }));
}

// 지금 말하는 자막 덩어리 (beat 안 프레임 기준)
export const curCap = (cap, f) => cap.find(c => f >= c.from && f < c.to) || (f >= cap.at(-1).from ? cap.at(-1) : null);

// 외곽선 자막: 지금 덩어리 하나만 튀어나오며 등장
export function Caption({ cap, top = 1160, size = 86 }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const c = curCap(cap, f);
  if (!c) return null;
  const s = spring({ frame: f - c.from, fps, config: { damping: 11, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 170, top, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [.55, 1])}) rotate(${interpolate(s, [0, 1], [-4, 0])}deg)`, opacity: interpolate(s, [0, .3], [0, 1], clamp),
        font: `900 ${size}px/1.22 P`, letterSpacing: "-.04em", color: "#fff", textAlign: "center", wordBreak: "keep-all",
        WebkitTextStroke: "16px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 #000, 0 0 34px rgba(0,0,0,.5)" }}>{marks(c.txt)}</div>
    </div>
  );
}

// 장면별 자막을 전체 프레임 기준으로 (지금 장면 것만)
export function BeatCaptions({ plan, top, size }) {
  const f = useCurrentFrame(), b = plan.beats.find(b => f >= b.start && f < b.start + b.dur);
  if (!b) return null;
  return <Caption cap={b.cap.map(c => ({ ...c, from: c.from + b.start, to: c.to + b.start }))} top={top} size={size} />;
}

// 목소리(장면마다) + 장면 전환 휙 + 배경음악
export function Voices({ plan, whoosh = .5 }) {
  return (
    <>
      {plan.beats.map((b, i) => (
        <Sequence key={i} from={b.start} durationInFrames={b.dur}>
          <Sequence from={b.vo.at}><Audio src={staticFile(b.vo.file)} /></Sequence>
          {i > 0 && whoosh > 0 && <Audio src={staticFile("sfx/whoosh.wav")} volume={whoosh} />}
        </Sequence>
      ))}
      {plan.music && <Audio src={staticFile("music.mp3")} volume={.12} loop />}
    </>
  );
}

export const Sfx = ({ at, name, vol = .6 }) => <Sequence from={Math.max(0, Math.round(at))} durationInFrames={30}><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>;

export const Logo = ({ color = "#fff" }) => (
  <div style={{ position: "absolute", left: 64, top: 226, font: "800 40px/1 P", letterSpacing: "-.03em", color, textShadow: "0 2px 12px rgba(0,0,0,.3)" }}>seum<span style={{ color: MINT }}>.</span></div>
);

export const Src = ({ text, color = "rgba(255,255,255,.45)" }) => text ? (
  <div style={{ position: "absolute", left: 64, right: 200, top: 1456, font: "600 22px/1.35 P", color, wordBreak: "keep-all" }}>{text}</div>
) : null;

// 장면 안 자막 k번째가 시작하는 전체 프레임
export const capAt = (b, k = 0) => b.start + (b.cap[Math.min(k, b.cap.length - 1)]?.from ?? 0);
export { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence };
