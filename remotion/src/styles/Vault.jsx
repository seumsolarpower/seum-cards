// 모션그래픽 금고형: 실사 없이 그림만. 회사 서랍 → 회사 밖 금고, 연도 타임라인, 소급 X 막대
// beat.kind: "lost"(big 카운트 + 돈이 날아감) | "move"(서랍→금고) | "timeline"(nodes) | "noretro"(bar) | "cta"(comment)
import React from "react";
import { AbsoluteFill, BeatCaptions, Logo, MINT, INK, MUTE, Sfx, Src, Voices, capAt, clamp, ease, interpolate, num, spring, useCurrentFrame, useFont, useVideoConfig } from "./common.jsx";

const sp = (f, fps, d = 13, s = 190) => spring({ frame: f, fps, config: { damping: d, stiffness: s } });

const Bill = ({ x, y, r = 0, o = 1, sc = 1 }) => (
  <div style={{ position: "absolute", left: x - 75, top: y - 42, width: 150, height: 84, borderRadius: 12, background: MINT, border: `5px solid ${INK}`, opacity: o,
    transform: `rotate(${r}deg) scale(${sc})`, display: "grid", placeItems: "center", font: "900 44px/1 P", color: INK, boxShadow: "0 8px 18px rgba(0,0,0,.35)" }}>₩</div>
);

function Drawer({ cx, cy, w = 460, h = 270, label, open = 0 }) {
  return (
    <>
      <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2 - 40 * open, width: w, height: h, borderRadius: 26, background: "#eef1f0", border: `6px solid ${INK}`, boxShadow: "0 24px 50px rgba(0,0,0,.45)" }}>
        <div style={{ position: "absolute", left: w / 2 - 70, top: h / 2 - 14, width: 140, height: 28, borderRadius: 14, background: INK }} />
      </div>
      <div style={{ position: "absolute", left: cx - 250, width: 500, top: cy + h / 2 + 24, textAlign: "center", font: "800 40px/1 P", color: MUTE }}>{label}</div>
    </>
  );
}

function Safe({ cx, cy, size = 380, spin = 0, ok = 0, label }) {
  const d = size * .66;
  return (
    <>
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: 40, background: "#2b3034", border: `8px solid ${MINT}`, boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
        <div style={{ position: "absolute", left: (size - d) / 2 - 8, top: (size - d) / 2 - 8, width: d, height: d, borderRadius: "50%", border: `10px solid ${MINT}`, transform: `rotate(${spin}deg)` }}>
          {[0, 60, 120].map(a => <div key={a} style={{ position: "absolute", left: d / 2 - 15, top: 0, width: 10, height: d - 20, background: MINT, borderRadius: 5, transform: `rotate(${a}deg)` }} />)}
          <div style={{ position: "absolute", left: d / 2 - 44, top: d / 2 - 44, width: 68, height: 68, borderRadius: "50%", background: MINT }} />
        </div>
        {ok > 0 && <div style={{ position: "absolute", right: -40, top: -40, width: 120, height: 120, borderRadius: "50%", background: MINT, border: `6px solid ${INK}`, display: "grid", placeItems: "center",
          font: "900 70px/1 P", color: INK, transform: `scale(${ok})` }}>✓</div>}
      </div>
      {label && <div style={{ position: "absolute", left: cx - 260, width: 520, top: cy + size / 2 + 24, textAlign: "center", font: "800 40px/1 P", color: MINT }}>{label}</div>}
    </>
  );
}

const Kick = ({ text, f, fps }) => { const s = sp(f, fps); return (
  <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [-40, 0])}px)`, font: "900 78px/1.1 P", letterSpacing: "-.04em", color: "#fff" }}>{text}</div>
) };

function Lost({ b, f, fps }) {
  const p = ease(interpolate(f, [2, 22], [0, 1], clamp)), pop = sp(f - 22, fps, 9, 260);
  const fly = b.cap[1] ? b.cap[1].from : 30;
  const bills = [[-130, -20, -12], [-40, -40, 6], [60, -30, -5], [140, -10, 14], [0, -5, 0]];
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center", color: "#fff" }}>
        <div style={{ display: "inline-block", padding: "10px 26px", borderRadius: 40, background: MINT, color: INK, font: "800 40px/1 P" }}>{b.big.label}</div>
        <div style={{ marginTop: 14, font: "900 220px/1 P", letterSpacing: "-.06em", fontVariantNumeric: "tabular-nums", transform: `scale(${1 + .1 * Math.sin(Math.PI * Math.min(1, Math.max(0, pop)))})` }}>
          {num(Math.round(b.big.to * p))}<span style={{ fontSize: 96 }}>{b.big.unit}</span></div>
      </div>
      {bills.map(([dx, dy, r], k) => {
        const t = interpolate(f, [fly + k * 4, fly + k * 4 + 22], [0, 1], clamp), e = t * t;
        return <Bill key={k} x={540 + dx + dx * 3 * e} y={760 + dy - 140 - 700 * e} r={r + 160 * e * (k % 2 ? 1 : -1)} o={1 - t} />;
      })}
      <Drawer cx={540} cy={840} label="회사 서랍" open={interpolate(f, [fly - 6, fly], [0, 1], clamp)} />
    </>
  );
}

function Move({ b, f, fps }) {
  const go = b.cap[1] ? b.cap[1].from : 20, N = 6, A = [270, 820], Z = [800, 760];
  const end = go + (N - 1) * 5 + 18, ok = sp(f - end - 2, fps, 9, 260);
  return (
    <>
      <Drawer cx={A[0]} cy={A[1]} w={360} h={220} label="회사 서랍" />
      <Safe cx={Z[0]} cy={Z[1]} size={360} spin={interpolate(f, [end, end + 14], [0, 220], clamp)} ok={ok} label="회사 밖 금고" />
      {Array.from({ length: N }, (_, k) => {
        const t = interpolate(f, [go + k * 5, go + k * 5 + 18], [0, 1], clamp);
        if (t <= 0 || t >= 1) return null;
        const x = A[0] + (Z[0] - A[0]) * t, y = A[1] - 60 + (Z[1] - A[1] + 60) * t - 300 * Math.sin(Math.PI * t);
        return <Bill key={k} x={x} y={y} r={-20 + 40 * t} sc={1 - .35 * t} />;
      })}
    </>
  );
}

function Timeline({ b, f, fps }) {
  const xs = [180, 540, 900], Y = 800, lit = b.cap.map(c => f >= c.from);
  const last = lit.lastIndexOf(true), line = interpolate(f, [0, 14], [0, 1], clamp);
  return (
    <>
      <Kick text={b.title || "언제부터?"} f={f} fps={fps} />
      <div style={{ position: "absolute", left: xs[0], top: Y - 5, height: 10, width: (xs[2] - xs[0]) * line, background: "rgba(255,255,255,.25)", borderRadius: 5 }} />
      <div style={{ position: "absolute", left: xs[0], top: Y - 5, height: 10, width: last < 0 ? 0 : (xs[last] - xs[0]), background: MINT, borderRadius: 5 }} />
      {b.nodes.map((n, k) => {
        const s = lit[k] ? sp(f - b.cap[k].from, fps, 9, 260) : 0, on = k === last;
        return (
          <React.Fragment key={k}>
            <div style={{ position: "absolute", left: xs[k] - 160, width: 320, top: Y - 190, textAlign: "center", font: "900 96px/1 P", letterSpacing: "-.05em",
              color: lit[k] ? (on ? MINT : "#fff") : "rgba(255,255,255,.25)", transform: `scale(${1 + .18 * s * (on ? 1 : 0)})` }}>{n.y}</div>
            <div style={{ position: "absolute", left: xs[k] - 30, top: Y - 30, width: 60, height: 60, borderRadius: "50%", background: lit[k] ? MINT : "#2b3034", border: `6px solid ${INK}`,
              transform: `scale(${.8 + .5 * s})`, boxShadow: lit[k] ? "0 0 40px rgba(31,216,164,.6)" : "none" }} />
            <div style={{ position: "absolute", left: xs[k] - 170, width: 340, top: Y + 60, textAlign: "center", font: "800 40px/1.2 P", letterSpacing: "-.03em", color: lit[k] ? "#fff" : "rgba(255,255,255,.25)", wordBreak: "keep-all" }}>{n.s}</div>
          </React.Fragment>
        );
      })}
    </>
  );
}

function NoRetro({ b, f, fps }) {
  const Y = 760, L = 100, M = 520, R = 980, grow = ease(interpolate(f, [4, 26], [0, 1], clamp));
  const st = b.cap[1] ? b.cap[1].from : 30, sc = interpolate(f, [st, st + 6], [2.4, 1], { ...clamp, easing: ease });
  return (
    <>
      <Kick text={b.title || "시행일 기준"} f={f} fps={fps} />
      <div style={{ position: "absolute", left: M - 4, top: Y - 150, width: 8, height: 260, background: "#fff", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: M - 80, width: 160, top: Y - 200, textAlign: "center", font: "900 40px/1 P", color: "#fff" }}>시행</div>
      <div style={{ position: "absolute", left: L, top: Y - 60, width: M - L - 16, height: 120, borderRadius: 24, background: "#3a3f43", display: "grid", placeItems: "center", font: "800 40px/1 P", color: "rgba(255,255,255,.7)" }}>시행 전 근무</div>
      <div style={{ position: "absolute", left: M + 16, top: Y - 60, width: (R - M - 16) * grow, height: 120, borderRadius: 24, background: MINT, overflow: "hidden" }}>
        <div style={{ width: R - M - 16, height: 120, display: "grid", placeItems: "center", font: "900 40px/1 P", color: INK }}>이후 근무 → 적립 ✓</div>
      </div>
      {f >= st && <div style={{ position: "absolute", left: L + 20, top: Y - 120, transform: `rotate(-10deg) scale(${sc})`, opacity: interpolate(f, [st, st + 3], [0, 1], clamp),
        background: "#fff", color: INK, border: `8px solid ${INK}`, borderRadius: 26, padding: "14px 30px", font: "900 84px/1 P", letterSpacing: "-.04em", boxShadow: "0 14px 34px rgba(0,0,0,.5)" }}>소급 X</div>}
    </>
  );
}

function Cta({ b, f, fps }) {
  const s = sp(f, fps), word = b.comment || "퇴직금", tk = b.cap[1] ? b.cap[1].from : 10;
  const k = Math.floor(interpolate(f, [tk, tk + word.length * 5], [0, word.length], clamp));
  return (
    <>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [.7, 1])})`, transformOrigin: "540px 640px", position: "absolute", inset: 0 }}>
        <Safe cx={540} cy={640} size={400} spin={f * 1.2} ok={1} />
        <div style={{ position: "absolute", left: 540 - 130, top: 365, width: 260, padding: "12px 0", borderRadius: 18, background: "#fff", color: INK, textAlign: "center", font: "900 40px/1 P", transform: "rotate(-4deg)" }}>내 퇴직금</div>
      </div>
      <div style={{ position: "absolute", left: 120, right: 160, top: 920, height: 100, borderRadius: 50, background: "#fff", display: "flex", alignItems: "center", gap: 18, padding: "0 34px", font: "800 44px/1 P", color: INK }}>
        <span style={{ color: MUTE, fontSize: 34 }}>댓글</span><span>{word.slice(0, k)}{Math.floor(f / 8) % 2 ? "|" : ""}</span>
      </div>
    </>
  );
}

const PARTS = { lost: Lost, move: Move, timeline: Timeline, noretro: NoRetro, cta: Cta };

export const Vault = ({ plan }) => {
  useFont();
  const g = useCurrentFrame(), { fps } = useVideoConfig();
  const B = plan.beats, i = B.findLastIndex(b => g >= b.start), b = B[i], f = g - b.start, P = PARTS[b.kind] || (() => null);
  const enter = sp(f, fps, 16, 200);
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "P", overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.08) 2px, transparent 2.5px)", backgroundSize: "44px 44px", transform: `translateY(${-(g * .6) % 44}px)` }} />
      <AbsoluteFill style={{ opacity: interpolate(enter, [0, 1], [0, 1]), transform: `scale(${interpolate(enter, [0, 1], [.94, 1])})` }}><P b={b} f={f} fps={fps} /></AbsoluteFill>
      <Logo />
      <BeatCaptions plan={plan} top={1160} />
      <Src text={plan.src} />
      <Voices plan={plan} whoosh={.5} />
      {B.map((bb, j) => {
        const c1 = bb.cap[1] ? bb.cap[1].from : 0;
        if (bb.kind === "lost") return <React.Fragment key={j}><Sfx at={bb.start + 20} name="ding" vol={.5} /><Sfx at={bb.start + c1} name="whoosh" vol={.7} /></React.Fragment>;
        if (bb.kind === "move") return <React.Fragment key={j}>{[0, 1, 2, 3, 4, 5].map(k => <Sfx key={k} at={bb.start + c1 + k * 5 + 16} name="pop" vol={.5} />)}<Sfx at={bb.start + c1 + 45} name="ding" vol={.6} /></React.Fragment>;
        if (bb.kind === "timeline") return <React.Fragment key={j}>{bb.cap.map((c, k) => <Sfx key={k} at={bb.start + c.from} name="tick" vol={.8} />)}</React.Fragment>;
        if (bb.kind === "noretro") return <Sfx key={j} at={bb.start + c1} name="thud" vol={.9} />;
        if (bb.kind === "cta") return <React.Fragment key={j}>{[0, 1, 2].map(k => <Sfx key={k} at={bb.start + c1 + k * 5} name="tick" vol={.7} />)}</React.Fragment>;
        return null;
      })}
    </AbsoluteFill>
  );
};
