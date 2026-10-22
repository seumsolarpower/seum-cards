# 무료로 쓸 수 있는 소재 모음

카드·릴스에 쓸 사진·그림·아이콘·음원·글꼴 출처. 2026-10-22 정리.
라이선스는 바뀔 수 있으니 처음 쓸 때 사이트의 라이선스 페이지를 한 번 더 확인한다.

## 사진

| 곳 | 라이선스 | 출처 표기 | 자동 검색 | 메모 |
|---|---|---|---|---|
| **Pexels** (pexels.com) | Pexels License, 상업 사용 OK | 필요 없음 (해 주면 좋음) | API 키 무료, 바로 발급 | 사진+영상. 아시아 인물·카페 사진 꽤 있음. **1순위** |
| **Unsplash** (unsplash.com) | Unsplash License, 상업 사용 OK | 필요 없음 | API 키 무료 (앱 등록, 시간당 50회) | 감성 제일 좋음. **Unsplash+ 표시 사진은 유료라 제외** |
| **Pixabay** (pixabay.com) | Content License, 상업 사용 OK | 필요 없음 | API 키 무료 | 사진·일러스트·벡터·영상·음원까지. 품질은 섞여 있음 |
| StockSnap (stocksnap.io) | CC0 | 필요 없음 | 없음 | 양은 적지만 깔끔 |
| Burst (burst.shopify.com) | 무료 상업 사용 | 필요 없음 | 없음 | 쇼핑·소품·결제 사진에 강함 |
| **공공누리** (kogl.or.kr) | 1유형: 출처 표시하면 상업 OK | 필요 | 없음 | 정부·공공기관 사진. 2~4유형은 상업 금지·변경 금지라 **1유형만** |
| 한국관광공사 포토코리아 (photo.visitkorea.or.kr) | 공공누리 1유형 사진 다수 | 필요 | 없음 | 서울·여행 주제(환율·여행 세트)에 좋음. 사진마다 유형 확인 |
| 위키미디어 커먼즈 | CC0 / CC BY (CC BY-SA는 피하기) | CC BY는 필요 | API (키 없이 됨) | 마지막 수단. "서양·무료 사진 느낌"이 남 |

인물 사진 주의: 무료 사진이라도 사람이 나오면 **광고·협찬·특정 상품 추천처럼 보이게 쓰면 안 됨**. 정보 카드 배경은 괜찮음.
연예인·정치인 등 실존 인물은 위 사이트가 아니라 공식 사진(백악관 = 퍼블릭 도메인, 정부 = 공공누리 1유형)만. 통신사(연합·로이터·AP·게티) 사진 금지.

## 그림 (일러스트)

| 곳 | 라이선스 | 메모 |
|---|---|---|
| unDraw (undraw.co) | 무료 상업, 표기 불필요 | 색을 민트로 바꿔서 받을 수 있음 |
| Open Peeps / Humaaans | CC0 | 손그림 사람. 리액션 대용 가능 |
| DrawKit (drawkit.com) | 무료 묶음 있음 | 무료/유료 섞임, 묶음마다 확인 |
| Storyset (Freepik) | 무료는 **출처 표기 필수** | 표기 싫으면 유료 |
| Freepik | 무료는 출처 표기 필수, Premium 유료 | 결과에 유료가 섞여 있어 주의 |

## 아이콘

| 곳 | 라이선스 |
|---|---|
| Lucide (lucide.dev) | ISC (무료, 표기 불필요) |
| Tabler Icons | MIT |
| Phosphor Icons | MIT |

(이모지 스티커는 디자인 원칙상 금지)

## 음원·효과음 (릴스 다시 할 때)

| 곳 | 라이선스 | 메모 |
|---|---|---|
| Pixabay Music | Content License, 표기 불필요 | 유튜브 Content ID에 가끔 오탐이 걸림 |
| YouTube 오디오 보관함 | 곡마다 다름 (표기 필요한 곡 있음) | 유튜브 스튜디오에서 받음 |
| Freesound (freesound.org) | CC0 / CC BY 섞임 | **CC0만** 쓰면 편함. 지금 쓰는 cute-happy.mp3가 여기 CC0 |
| Incompetech (Kevin MacLeod) | CC BY | 표기 필수 |
| 인스타 앱 음원 | 앱 안에서만 | 비즈니스 계정은 저작권 무료곡만 뜸 |

## 글꼴

- Pretendard (OFL) — 지금 쓰는 글꼴. 디자인 원칙상 하나만 씀.
- 눈누 (noonnu.cc) — 상업 무료 한글 글꼴 모음. 쓰기 전 글꼴마다 "허용 범위" 표 확인.

## 짤

- jjal/catalog.json + jjalbot.com. 짤은 저작권이 애매한 영역이라 규칙 유지: 호감 인물(유재석·박명수·하하)만, 논란 인물 금지, 협찬 게시물엔 안 씀.

## 쓸 때 할 일

1. 받은 사진은 `assets/`에 넣고, 카드 `credit`에 "이름, 출처" (표기 불필요한 곳도 남겨 두면 나중에 확인이 쉬움).
2. API 키는 `.env`에만 (`PEXELS_KEY=`, `UNSPLASH_KEY=`, `PIXABAY_KEY=`), 저장소에 올리지 않음. Actions에서 쓰려면 Secrets에 같은 이름으로.
3. 사진 고르는 기준은 reel-design.md "사진 고르기".
