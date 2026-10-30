import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel.jsx";
import plan from "./plan.json";

export const Root = () => (
  <Composition id="Reel" component={Reel} durationInFrames={plan.total} fps={plan.fps} width={1080} height={1920} defaultProps={{ plan }} />
);
