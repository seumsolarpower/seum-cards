// 실적 반전형: "실적은 좋았는데 주가는 폭락" 같은 기업 실적 이야기. 실사 없이 그림 + 대표 얼굴 작게
// beat.kind: "drop"(대표 명함 + 주가 카운트) | "score"(성적표 rows) | "gap"(예상 vs 전망 막대) | "quote"(한 줄 인용) | "cta"(댓글 고르기)
import React from "react";
import { AbsoluteFill, BeatCaptions, Logo, MINT, INK, MUTE, Sfx, Src, Voices, clamp, ease, interpolate, marks, num, spring, useCurrentFrame, useFont, useVideoConfig } from "./common.jsx";
import { Img, staticFile } from "remotion";

const sp = (f, fps, d = 13, s = 190) => spring({ frame: f, fps, config: { damping: d, stiffness: s } });

const Kick = ({ text, f, fps, top = 320 }) => { const s = sp(f, fps); return (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [-40, 0])}px)`, font: "900 74px/1.1 P", letterSpacing: "-.04em", color: "#fff" }}>{text}</div>
) };

// 대표 명함: 동그란 얼굴 + 회사·직함·이름
const Card = ({ who, f, fps, top = 300 }) => { const s = sp(f, fps, 14, 170); return (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 40px 18px 18px", borderRadius: 120, background: "rgba(255,255,255,.08)", border: "2px solid rgba(255,255,255,.14)" }}>
      <Img src={staticFile(who.photo)} style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover", border: `5px solid ${MINT}` }} />
      <div>
        <div style={{ font: "700 34px/1.2 P", color: MUTE }}>{who.role}</div>
        <div style={{ font: "900 54px/1.15 P", letterSpacing: "-.03em", color: "#fff" }}>{who.name}</div>
      </div>
    </div>
  </div>
) };

function Drop({ b, f, fps }) {
  const p = ease(interpolate(f, [8, 34], [0, 1], clamp)), v = b.big.to * p, hit = sp(f - 34, fps, 8, 260);
  const ay = interpolate(f, [8, 34], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <Card who={b.who} f={f} fps={fps} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#fff" }}>
        <div style={{ display: "inline-block", padding: "10px 26px", borderRadius: 40, background: MINT, color: INK, font: "800 40px/1 P" }}>{b.big.label}</div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
          <div style={{ font: "900 150px/1 P", color: "#fff", transform: `translateY(${-60 + 120 * ay}px)`, opacity: interpolate(f, [4, 10], [0, 1], clamp) }}>↓</div>
          <div style={{ font: "900 250px/1 P", letterSpacing: "-.06em", fontVariantNumeric: "tabular-nums", transform: `scale(${1 + .1 * Math.sin(Math.PI * Math.min(1, Math.max(0, hit)))}) rotate(${-3 * Math.min(1, Math.max(0, hit))}deg)` }}>
            {num(Math.round(v))}<span style={{ fontSize: 120 }}>{b.big.unit}</span></div>
        </div>
      </div>
    </>
  );
}

// 성적표: 장면 자막 k번째가 나올 때 k번째 줄이 켜지고 ✓
function Score({ b, f, fps }) {
  return (
    <>
      <Kick text={b.title} f={f} fps={fps} />
      {b.rows.map((r, k) => {
        const on = f >= (b.cap[k]?.from ?? 0), s = on ? sp(f - b.cap[k].from, fps, 11, 230) : 0, y = 470 + k * 190;
        return (
          <div key={k} style={{ position: "absolute", left: 90, width: 820, top: y, height: 160, borderRadius: 30, background: on ? "#fff" : "rgba(255,255,255,.08)",
            transform: `scale(${.92 + .08 * s})`, display: "flex", alignItems: "center", padding: "0 36px", gap: 20, color: on ? INK : "rgba(255,255,255,.3)" }}>
            <div style={{ flex: "0 0 230px", font: "800 40px/1.15 P", letterSpacing: "-.03em", wordBreak: "keep-all" }}>{r.k}</div>
            <div style={{ flex: 1, font: "900 64px/1 P", letterSpacing: "-.04em" }}>{r.v}<span style={{ font: "800 34px/1 P", marginLeft: 6 }}>{r.u}</span></div>
            <div style={{ font: "900 44px/1 P", color: on ? "#0a8f69" : "inherit" }}>{r.d}</div>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: on ? MINT : "transparent", display: "grid", placeItems: "center", font: "900 40px/1 P", color: INK, transform: `scale(${s})` }}>✓</div>
          </div>
        );
      })}
    </>
  );
}

// 예상 vs 전망: 0부터 값에 비례하는 막대, 전망은 범위(진한 부분 = 최저, 옅은 부분 = 최고), 차이는 괄호
function Gap({ b, f, fps }) {
  const H = 500, base = 1060, max = Math.max(...b.bars.map(x => x.hi ?? x.v));
  const grow = k => ease(interpolate(f, [6 + k * 10, 30 + k * 10], [0, 1], clamp));
  const xs = [250, 560], W = 210, h = v => H * v / max;
  const br = b.cap[2] ? b.cap[2].from : 40, bs = sp(f - br, fps, 12, 200);
  const top = b.bars[0].v, low = b.bars[1].v, yTop = base - h(top), yLow = base - h(low);
  return (
    <>
      <Kick text={b.title} f={f} fps={fps} />
      {b.bars.map((x, k) => {
        const g = grow(k), on = k === 1;
        return (
          <React.Fragment key={k}>
            {x.hi && <div style={{ position: "absolute", left: xs[k], width: W, top: base - h(x.hi) * g, height: (h(x.hi) - h(x.v)) * g, background: "rgba(31,216,164,.35)", borderRadius: "22px 22px 0 0" }} />}
            <div style={{ position: "absolute", left: xs[k], width: W, top: base - h(x.v) * g, height: h(x.v) * g, background: on ? MINT : "#fff", borderRadius: x.hi ? 0 : "22px 22px 0 0" }} />
            <div style={{ position: "absolute", left: xs[k] - 60, width: W + 120, top: base - h(x.hi ?? x.v) * g - 80, textAlign: "center", font: "900 56px/1 P", letterSpacing: "-.04em", color: on ? MINT : "#fff", opacity: g }}>{x.t}</div>
            <div style={{ position: "absolute", left: xs[k] - 60, width: W + 120, top: base + 20, textAlign: "center", font: "800 38px/1.15 P", color: "#fff", wordBreak: "keep-all" }}>{x.k}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 150, top: base, height: 4, background: "rgba(255,255,255,.4)" }} />
      {/* 괄호: 시장 예상 꼭대기 ~ 전망 최저 */}
      <div style={{ position: "absolute", left: xs[1] + W + 24, top: yTop, height: (yLow - yTop) * bs, width: 30, borderTop: "6px solid #fff", borderRight: "6px solid #fff", borderBottom: bs > .95 ? "6px solid #fff" : "none", opacity: bs }} />
      <div style={{ position: "absolute", left: xs[1] + W + 70, top: (yTop + yLow) / 2 - 34, opacity: bs, font: "900 48px/1.1 P", color: "#fff", letterSpacing: "-.03em", whiteSpace: "nowrap" }}>{b.diff}</div>
    </>
  );
}

function Quote({ b, f, fps }) {
  const s = sp(f, fps, 14, 160), mk = b.cap[1] ? b.cap[1].from : 20, m = ease(interpolate(f, [mk, mk + 14], [0, 1], clamp));
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 300, font: "900 260px/1 P", color: MINT, opacity: s }}>“</div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 520, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` }}>
        <div style={{ font: "900 92px/1.25 P", letterSpacing: "-.045em", color: "#fff", wordBreak: "keep-all" }}>
          {b.line[0]}<br />
          <span style={{ backgroundImage: `linear-gradient(${MINT}, ${MINT})`, backgroundRepeat: "no-repeat", backgroundSize: `${m * 100}% 34%`, backgroundPosition: "0 88%", padding: "0 4px" }}>{b.line[1]}</span>
        </div>
        <div style={{ marginTop: 40, font: "700 36px/1.3 P", color: MUTE }}>{b.by}</div>
      </div>
    </>
  );
}

// 댓글로 고르기: 선택지 알약 + 댓글 칸에 첫 선택지가 쳐짐
function Cta({ b, f, fps }) {
  const s = sp(f, fps), word = b.comment, tk = b.cap[1] ? b.cap[1].from : 10;
  const k = Math.floor(interpolate(f, [tk, tk + word.length * 5], [0, word.length], clamp));
  return (
    <>
      <Kick text={b.title} f={f} fps={fps} top={360} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 36, transform: `scale(${interpolate(s, [0, 1], [.8, 1])})` }}>
        {b.picks.map((p, j) => (
          <div key={j} style={{ padding: "30px 54px", borderRadius: 70, background: "#fff", color: INK, font: "900 64px/1 P", letterSpacing: "-.03em" }}>{p}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 120, right: 160, top: 860, height: 100, borderRadius: 50, background: "#fff", display: "flex", alignItems: "center", gap: 18, padding: "0 34px", font: "800 44px/1 P", color: INK }}>
        <span style={{ color: MUTE, fontSize: 34 }}>댓글</span><span>{word.slice(0, k)}{Math.floor(f / 8) % 2 ? "|" : ""}</span>
      </div>
    </>
  );
}

const PARTS = { drop: Drop, score: Score, gap: Gap, quote: Quote, cta: Cta };

export const Earn = ({ plan }) => {
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
        if (bb.kind === "drop") return <Sfx key={j} at={bb.start + 34} name="thud" vol={1} />;
        if (bb.kind === "score") return <React.Fragment key={j}>{bb.cap.map((c, k) => <Sfx key={k} at={bb.start + c.from} name="ding" vol={.45} />)}</React.Fragment>;
        if (bb.kind === "gap") return <React.Fragment key={j}><Sfx at={bb.start + 8} name="pop" vol={.5} /><Sfx at={bb.start + 18} name="pop" vol={.5} /><Sfx at={bb.start + (bb.cap[2]?.from ?? c1)} name="thud" vol={.8} /></React.Fragment>;
        if (bb.kind === "quote") return <Sfx key={j} at={bb.start + c1} name="tick" vol={.8} />;
        if (bb.kind === "cta") return <React.Fragment key={j}>{[0, 1, 2].map(k => <Sfx key={k} at={bb.start + c1 + k * 5} name="tick" vol={.7} />)}</React.Fragment>;
        return null;
      })}
    </AbsoluteFill>
  );
};
