// 세움이: 직접 그린 캐릭터 (저작권 걱정 없음). 연한 민트 찹쌀떡(모찌) 몸 + 민트 새싹, 표정 shock | happy
const EYE = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="#0e0f10"/><circle cx="${x + 6}" cy="${y - 9}" r="7" fill="#fff"/><circle cx="${x - 6}" cy="${y + 9}" r="3.5" fill="#fff"/>`;
export const CHAR = e => `<svg viewBox="0 0 400 420" class="ch" aria-hidden="true">
  <defs>
    <filter id="sketch">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="multiply" result="blend"/>
      <feComposite in="blend" in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>
  <ellipse cx="200" cy="396" rx="130" ry="12" fill="#000" opacity=".35" filter="url(#sketch)"/>
  <path d="M200 118c-2-20 0-34 4-46" stroke="#12a982" stroke-width="9" stroke-linecap="round" fill="none" filter="url(#sketch)"/>
  <ellipse cx="176" cy="70" rx="26" ry="15" fill="#17c495" transform="rotate(25 176 70)" filter="url(#texture)"/><ellipse cx="230" cy="62" rx="28" ry="16" fill="#12a982" transform="rotate(-25 230 62)" filter="url(#texture)"/>
  <ellipse cx="148" cy="380" rx="28" ry="15" fill="#bfe6d6" filter="url(#texture)"/><ellipse cx="252" cy="380" rx="28" ry="15" fill="#bfe6d6" filter="url(#texture)"/>
  ${e === "happy" ? `<ellipse cx="44" cy="214" rx="24" ry="34" fill="#e3f7ee" transform="rotate(-35 44 214)" filter="url(#texture)"/><ellipse cx="356" cy="214" rx="24" ry="34" fill="#e3f7ee" transform="rotate(35 356 214)" filter="url(#texture)"/>` : ""}
  <path d="M200 112c120 0 172 70 172 152 0 74-72 112-172 112S28 338 28 264c0-82 52-152 172-152z" fill="#e3f7ee" filter="url(#texture)"/>
  <ellipse cx="200" cy="340" rx="150" ry="34" fill="#c8ecdd" opacity=".7" filter="url(#texture)"/>
  <ellipse cx="112" cy="172" rx="34" ry="18" fill="#fff" opacity=".9" transform="rotate(-30 112 172)" filter="url(#sketch)"/><circle cx="150" cy="148" r="7" fill="#fff" filter="url(#sketch)"/>
  <ellipse cx="104" cy="306" rx="26" ry="14" fill="#ff8fa3" opacity=".7" filter="url(#texture)"/><ellipse cx="296" cy="306" rx="26" ry="14" fill="#ff8fa3" opacity=".7" filter="url(#texture)"/>
  ${e === "shock" ? `
  ${EYE(146, 266)}${EYE(254, 266)}
  <ellipse cx="200" cy="314" rx="11" ry="14" fill="#0e0f10" filter="url(#sketch)"/>
  <ellipse cx="62" cy="300" rx="22" ry="30" fill="#e3f7ee" stroke="#bfe6d6" stroke-width="6" filter="url(#sketch)"/><ellipse cx="338" cy="300" rx="22" ry="30" fill="#e3f7ee" stroke="#bfe6d6" stroke-width="6" filter="url(#sketch)"/>
  <path d="M332 150c12 18 18 30 18 40a18 18 0 0 1-36 0c0-10 6-22 18-40z" fill="#9fdcf5" filter="url(#texture)"/>
  <path d="M60 120l-14-30M92 104l-4-34" stroke="#fff" stroke-width="10" stroke-linecap="round" filter="url(#sketch)"/>` : `
  <path d="M124 272q22-26 44 0M232 272q22-26 44 0" fill="none" stroke="#0e0f10" stroke-width="11" stroke-linecap="round" filter="url(#sketch)"/>
  <path d="M180 300q10 12 20 0q10 12 20 0" fill="none" stroke="#0e0f10" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#sketch)"/>
  <path d="M74 128l7 19 19 7-19 7-7 19-7-19-19-7 19-7zM330 92l6 15 15 6-15 6-6 15-6-15-15-6 15-6zM364 300l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#fff" filter="url(#sketch)"/>`}
</svg>`;
