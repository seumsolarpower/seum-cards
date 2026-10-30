// POV 폰 화면형: 화면 전체가 내 폰 잠금화면, 알림이 위에서부터 쌓임
// beat.notes: [{ at: 자막 번호, app, title, body, big?: "0원", count?: {to, unit}, type?: "타이핑할 글", good?, warn? }]
// beat.flip: 이 장면부터 배경이 밝아짐(반전). extra: { pov: "POV 문구", date, clock }
import React from "react";
import { AbsoluteFill, BeatCaptions, Logo, MINT, INK, MUTE, Sfx, Src, Voices, capAt, clamp, ease, interpolate, num, spring, useCurrentFrame, useFont, useVideoConfig } from "./common.jsx";

const TOP = 600, GAP = 22, MAXN = 3;
// 카드 높이: 기본 + 큰 숫자 줄 + 본문 줄
const hOf = n => 150 + (n.count || n.big ? 82 : 0) + (n.body || n.type ? 50 : 0);

function Note({ n, f, y, idx }) {
  const { fps } = useVideoConfig();
  const t = f - n.t, s = spring({ frame: t, fps, config: { damping: 13, stiffness: 190 } });
  const fade = interpolate(y + hOf(n), [1180, 1250], [1, 0], clamp); // 자막 자리(1260~)에 닿기 전에 사라짐
  const icon = n.good ? "✓" : n.warn ? "!" : n.icon || n.app[0];
  const iconBg = n.good || n.warn ? MINT : n.dark ? INK : "#fff";
  let body = n.body;
  if (n.type) { const k = Math.floor(interpolate(t, [8, 8 + n.type.length * 5], [0, n.type.length], clamp)); body = n.type.slice(0, k) + (Math.floor(t / 8) % 2 ? "|" : " ") }
  const p = n.count ? ease(interpolate(t, [4, 24], [0, 1], clamp)) : 0;
  return (
    <div style={{ position: "absolute", left: 56, right: 56, top: y, opacity: interpolate(s, [0, .4], [0, 1], clamp) * fade,
      transform: `translateY(${interpolate(s, [0, 1], [-70, 0])}px) scale(${interpolate(s, [0, 1], [.92, 1]) - (idx > 0 ? .02 * idx : 0)})`, transformOrigin: "50% 0" }}>
      <div style={{ display: "flex", gap: 26, alignItems: "center", padding: "26px 30px", borderRadius: 42, background: n.good ? "rgba(31,216,164,.96)" : "rgba(255,255,255,.93)",
        color: INK, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <div style={{ flex: "0 0 92px", height: 92, borderRadius: 24, background: iconBg, border: iconBg === "#fff" ? "3px solid #e3e6e5" : "none", display: "grid", placeItems: "center",
          font: "900 46px/1 P", color: iconBg === INK ? MINT : INK }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", font: "700 26px/1 P", color: n.good ? INK : MUTE }}><span>{n.app}</span><span>지금</span></div>
          <div style={{ marginTop: 10, font: "800 40px/1.15 P", letterSpacing: "-.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
          {n.count && <div style={{ marginTop: 6, font: "900 76px/1 P", letterSpacing: "-.05em", color: INK, fontVariantNumeric: "tabular-nums" }}>{num(Math.round(n.count.to * p))}<span style={{ fontSize: 40 }}>{n.count.unit}</span></div>}
          {n.big && <div style={{ marginTop: 6, font: "900 76px/1 P", letterSpacing: "-.05em" }}>{n.big}</div>}
          {body && <div style={{ marginTop: 8, font: `${n.type ? 900 : 600} ${n.type ? 44 : 32}px/1.25 P`, color: n.good || n.type ? INK : "#3d4246", wordBreak: "keep-all" }}>{body}</div>}
        </div>
      </div>
    </div>
  );
}

export const Pov = ({ plan }) => {
  useFont();
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const B = plan.beats, X = plan.extra || {};
  const notes = B.flatMap(b => (b.notes || []).map(n => ({ ...n, t: capAt(b, n.at ?? 0) })));
  const live = notes.filter(n => f >= n.t);
  const flipB = B.find(b => b.flip), flip = flipB ? spring({ frame: f - capAt(flipB, 0), fps, config: { damping: 20, stiffness: 90 } }) : 0;
  const flash = flipB ? interpolate(f - capAt(flipB, 0), [0, 3, 14], [0, .7, 0], clamp) : 0;
  // 새 알림이 오면 위 알림들이 아래로 밀림 (부드럽게)
  const push = m => spring({ frame: f - m.t, fps, config: { damping: 15, stiffness: 170 } });
  const pos = n => live.filter(m => m.t > n.t).reduce((a, m) => a + push(m), 0);
  const yOf = n => TOP + live.filter(m => m.t > n.t).reduce((a, m) => a + push(m) * (hOf(m) + GAP), 0);
  const drift = f * .02;
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "P", overflow: "hidden" }}>
      {/* 잠금화면 배경: 어두운 민트 빛 → 반전 후 밝은 민트 */}
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${30 + Math.sin(drift) * 8}% ${28 + Math.cos(drift) * 5}%, rgba(31,216,164,${.28 + .5 * flip}), transparent 70%),
        radial-gradient(800px 800px at ${78 - Math.sin(drift) * 6}% 78%, rgba(31,216,164,${.12 + .35 * flip}), transparent 70%), linear-gradient(180deg, #121517, #07090a)` }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Logo />
      {/* 잠금화면 시계 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 268, textAlign: "center", color: "#fff" }}>
        <div style={{ display: "inline-block", padding: "10px 24px", borderRadius: 40, background: MINT, color: INK, font: "900 36px/1 P", letterSpacing: "-.02em" }}>{X.pov || "POV"}</div>
        <div style={{ marginTop: 14, font: "700 36px/1 P", opacity: .85 }}>{X.date}</div>
        <div style={{ marginTop: 4, font: "300 190px/1 P", letterSpacing: "-.04em" }}>{X.clock || "9:41"}</div>
      </div>
      {live.map((n, i) => { const idx = pos(n); return idx < MAXN + 1 ? <Note key={i} n={n} f={f} idx={idx} y={yOf(n)} /> : null })}
      <BeatCaptions plan={plan} top={1262} size={78} />
      <Src text={plan.src} />
      <Voices plan={plan} whoosh={.3} />
      {notes.map((n, i) => <Sfx key={i} at={n.t} name={n.good ? "ding" : "pop"} vol={n.good ? .6 : .7} />)}
    </AbsoluteFill>
  );
};

