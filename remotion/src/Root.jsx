import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel.jsx";
import { Pov } from "./styles/Pov.jsx";
import { Typo } from "./styles/Typo.jsx";
import { Vault } from "./styles/Vault.jsx";
import { Earn } from "./styles/Earn.jsx";
import plan from "./plan.json";

// 세트 remo.style 로 화면 형식 고름 (기본: 영수증형 Reel)
const STYLES = { receipt: Reel, pov: Pov, typo: Typo, vault: Vault, earn: Earn };

export const Root = () => (
  <Composition id="Reel" component={STYLES[plan.style] || Reel} durationInFrames={plan.total} fps={plan.fps} width={1080} height={1920} defaultProps={{ plan }} />
);
