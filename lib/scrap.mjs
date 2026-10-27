// 신문 스크랩 디자인 요소들
// 찢어진 종이, 형광펜, 손글씨 화살표, 테이프 등

// 찢어진 종이 테두리 SVG
export const TORN_EDGE = `<svg class="torn" viewBox="0 0 1080 30" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 15c10-8 20 8 30 0s20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0L1080 0v30H0z" fill="currentColor"/>
</svg>`;

// 테이프 조각
export const TAPE = (rot = 0) => `<svg class="tape" style="transform:rotate(${rot}deg)" viewBox="0 0 200 60" aria-hidden="true">
  <rect x="0" y="0" width="200" height="60" fill="#f5e6d3" opacity="0.7"/>
  <rect x="0" y="0" width="200" height="60" fill="none" stroke="#d4c5b3" stroke-width="1.5"/>
  <line x1="0" y1="20" x2="200" y2="20" stroke="#e8d9c6" stroke-width="0.5"/>
  <line x1="0" y1="40" x2="200" y2="40" stroke="#e8d9c6" stroke-width="0.5"/>
</svg>`;

// 손글씨 화살표
export const ARROW = (dir = "right") => {
  const paths = {
    right: "M10 25c30-5 60-5 90 0M90 15l15 10-15 10",
    down: "M25 10c-5 30-5 60 0 90M15 90l10 15 10-15",
    left: "M110 25c-30-5-60-5-90 0M20 15L5 25l15 10",
    up: "M25 110c-5-30-5-60 0-90M15 20l10-15 10 15"
  };
  return `<svg class="arrow arrow-${dir}" viewBox="0 0 120 50" aria-hidden="true">
    <path d="${paths[dir]}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
};

// 형광펜 밑줄 (더 손글씨 느낌)
export const HIGHLIGHT = (text, color = "yellow") => {
  const colors = {
    yellow: "#fff44f",
    mint: "#a3f3dc",
    pink: "#ffb4d5"
  };
  return `<span class="hl hl-${color}" style="--hl-color:${colors[color]}">${text}</span>`;
};

// 손글씨 메모 스티커
export const MEMO = (text, rot = 0) => `<div class="memo" style="transform:rotate(${rot}deg)">
  <div class="memo-inner">${text}</div>
</div>`;

// 신문 헤드라인 스타일
export const HEADLINE = text => `<div class="headline">${text}</div>`;
