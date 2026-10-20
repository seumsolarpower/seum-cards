# seum 카드 자동 게시

평일 아침 그날 뉴스 캐러셀(세트당 4장)을 JPG로 찍어서 인스타그램·스레드·X에 올린다.

```
content/2026-10-20.json   그날 콘텐츠 (세트 = 카드 4장 + 플랫폼별 글)
lib/cards.mjs             카드 디자인 (검정·흰색·포인트 1색, Pretendard)
render.mjs                카드 → out/날짜/세트-번호.jpg (Playwright)
publish.mjs               인스타·스레드·X 게시, "approved": true 일 때만
.github/workflows/post.yml 평일 08:10 KST 자동 실행
jjal/                     한국 짤 사전(catalog.json) + 짤봇 후보 수집(jjalbot.py) + 확정(pick/autopick)
```

## 하루 흐름

1. 전날 밤 `content/내일날짜.json` 작성 (`"approved": false`)
2. 워크플로가 08:10에 카드만 찍어서 Artifacts(`cards-날짜`)에 올림 → 폰으로 확인
3. 괜찮으면 `"approved": true` 로 바꾸고 Actions에서 `post` 수동 실행 → 게시
   - 미리 승인해 두면 08:10에 바로 올라감

## 처음 한 번 준비

| 할 일 | 메모 |
|---|---|
| 인스타 계정을 **비즈니스 또는 크리에이터**로 전환 | 개인 계정은 API 게시 불가 |
| Meta 개발자 앱 만들기 → Instagram API(Instagram 로그인) 추가 | `IG_USER_ID`, `IG_TOKEN`(장기 토큰, 60일마다 갱신) |
| 같은 앱에 Threads API 추가 | `THREADS_USER_ID`, `THREADS_TOKEN`(60일마다 갱신) |
| X 개발자 계정 → 앱 권한 Read and Write | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`. 요금제 확인 필요 |
| GitHub 저장소를 **공개**로 만들고 위 값을 Secrets에 등록 | 인스타·스레드가 이미지 주소를 직접 가져가야 해서 공개 필요 |

키가 없는 플랫폼은 건너뛴다. 예: 인스타만 먼저 해 보려면 IG 키만 넣으면 됨.

## 로컬 확인

```
node test.mjs                         # 브라우저 없이 도는 검사
HTML=1 node render.mjs 2026-10-20     # 카드 HTML만 저장 (out/)
DRY=1 FORCE=1 node publish.mjs 2026-10-20   # 올릴 내용만 출력
```
