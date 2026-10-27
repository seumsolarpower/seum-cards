// 실사 스타일 표정 SVG (임시 - 나중에 실제 사진으로 교체)
// 웹툰 스타일로 간단하게 그린 얼굴 표정

export const FACE = {
  shocked: `<svg viewBox="0 0 300 320" class="face" aria-hidden="true">
    <defs>
      <filter id="f-sketch">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <!-- 얼굴 -->
    <ellipse cx="150" cy="160" rx="130" ry="150" fill="#ffd4a3" filter="url(#f-sketch)"/>
    <!-- 머리카락 -->
    <path d="M30 120c0-80 80-100 120-100s120 20 120 100" fill="#3d2817" filter="url(#f-sketch)"/>
    <ellipse cx="60" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(-20 60 140)" filter="url(#f-sketch)"/>
    <ellipse cx="240" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(20 240 140)" filter="url(#f-sketch)"/>
    <!-- 눈 (놀람) -->
    <circle cx="100" cy="140" r="28" fill="#fff"/>
    <circle cx="100" cy="140" r="22" fill="#2d1810"/>
    <circle cx="105" cy="132" r="8" fill="#fff"/>
    <circle cx="200" cy="140" r="28" fill="#fff"/>
    <circle cx="200" cy="140" r="22" fill="#2d1810"/>
    <circle cx="205" cy="132" r="8" fill="#fff"/>
    <!-- 눈썹 올라감 -->
    <path d="M70 100c10-8 25-8 35 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <path d="M195 100c10-8 25-8 35 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <!-- 입 (놀람) -->
    <ellipse cx="150" cy="220" rx="20" ry="28" fill="#2d1810"/>
    <!-- 볼 홍조 -->
    <ellipse cx="60" cy="180" rx="25" ry="18" fill="#ffb4a3" opacity="0.6"/>
    <ellipse cx="240" cy="180" rx="25" ry="18" fill="#ffb4a3" opacity="0.6"/>
  </svg>`,

  worried: `<svg viewBox="0 0 300 320" class="face" aria-hidden="true">
    <defs>
      <filter id="f-sketch2">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <!-- 얼굴 -->
    <ellipse cx="150" cy="160" rx="130" ry="150" fill="#ffd4a3" filter="url(#f-sketch2)"/>
    <!-- 머리카락 -->
    <path d="M30 120c0-80 80-100 120-100s120 20 120 100" fill="#3d2817" filter="url(#f-sketch2)"/>
    <ellipse cx="60" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(-20 60 140)" filter="url(#f-sketch2)"/>
    <ellipse cx="240" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(20 240 140)" filter="url(#f-sketch2)"/>
    <!-- 눈 (걱정) -->
    <path d="M80 145c5-10 25-12 35 0" fill="none" stroke="#2d1810" stroke-width="4"/>
    <circle cx="97" cy="150" r="4" fill="#2d1810"/>
    <path d="M180 145c5-10 25-12 35 0" fill="none" stroke="#2d1810" stroke-width="4"/>
    <circle cx="197" cy="150" r="4" fill="#2d1810"/>
    <!-- 눈썹 (걱정) -->
    <path d="M70 115c10 8 25 8 35 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <path d="M195 115c10 8 25 8 35 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <!-- 입 (걱정) -->
    <path d="M120 210c10 8 20 8 30 0 10 8 20 8 30 0" fill="none" stroke="#2d1810" stroke-width="5" stroke-linecap="round"/>
    <!-- 땀방울 -->
    <ellipse cx="50" cy="110" rx="10" ry="14" fill="#9fdcf5" filter="url(#f-sketch2)"/>
    <!-- 볼 -->
    <ellipse cx="60" cy="180" rx="25" ry="18" fill="#ffb4a3" opacity="0.5"/>
    <ellipse cx="240" cy="180" rx="25" ry="18" fill="#ffb4a3" opacity="0.5"/>
  </svg>`,

  happy: `<svg viewBox="0 0 300 320" class="face" aria-hidden="true">
    <defs>
      <filter id="f-sketch3">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <!-- 얼굴 -->
    <ellipse cx="150" cy="160" rx="130" ry="150" fill="#ffd4a3" filter="url(#f-sketch3)"/>
    <!-- 머리카락 -->
    <path d="M30 120c0-80 80-100 120-100s120 20 120 100" fill="#3d2817" filter="url(#f-sketch3)"/>
    <ellipse cx="60" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(-20 60 140)" filter="url(#f-sketch3)"/>
    <ellipse cx="240" cy="140" rx="35" ry="60" fill="#3d2817" transform="rotate(20 240 140)" filter="url(#f-sketch3)"/>
    <!-- 눈 (웃음) -->
    <path d="M75 140c8 8 20 8 28 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <path d="M175 140c8 8 20 8 28 0" fill="none" stroke="#2d1810" stroke-width="6" stroke-linecap="round"/>
    <!-- 눈썹 -->
    <path d="M70 110c10-5 25-5 35 0" fill="none" stroke="#2d1810" stroke-width="5" stroke-linecap="round"/>
    <path d="M195 110c10-5 25-5 35 0" fill="none" stroke="#2d1810" stroke-width="5" stroke-linecap="round"/>
    <!-- 입 (웃음) -->
    <path d="M110 200c15 25 50 25 65 0" fill="#fff" stroke="#2d1810" stroke-width="5"/>
    <path d="M130 205c5 8 15 8 20 0" fill="none" stroke="#2d1810" stroke-width="3"/>
    <!-- 볼 홍조 -->
    <ellipse cx="60" cy="180" rx="30" ry="20" fill="#ffb4a3" opacity="0.7"/>
    <ellipse cx="240" cy="180" rx="30" ry="20" fill="#ffb4a3" opacity="0.7"/>
    <!-- 반짝임 -->
    <path d="M50 90l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff" opacity="0.8"/>
    <path d="M240 80l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff" opacity="0.8"/>
  </svg>`
};
