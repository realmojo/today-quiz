# 투데이퀴즈 (today-quiz)

앱테크 퀴즈 정답 사이트. 정답 데이터는 quizkorea(answer.quizbells.com)와 **같은
Supabase `quizbells_answer` 테이블**을 공유하고, UI만 새로 짰다.

- quizkorea — 흰 지면·헤어라인 구분선·각진 모서리의 미니멀 신문 지면
- today-quiz — 연회색 바닥 위 흰 카드·큰 라운드·부드러운 그림자·앱별 파스텔

## 실행

```bash
pnpm dev        # 개발 서버
pnpm build      # 프로덕션 빌드
pnpm start      # 프로덕션 서버
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
```

## 환경 변수

`.env`(로컬) 또는 Cloudflare Worker 환경 변수로 설정한다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | PostgREST 엔드포인트. `NEXT_PUBLIC_SUPABASE_URL` 폴백 있음 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서버에서만 쓴다 |
| `SITE_URL` | ✅ | canonical·OG·사이트맵의 기준. **배포 전 반드시 실제 도메인으로 설정할 것** |

`NEXT_PUBLIC_` 접두어를 쓰지 않는다. 접두어가 붙으면 빌드 시점에 번들로 박혀
값을 바꿀 때마다 재배포해야 하고, wrangler의 `keep_vars`도 지켜주지 않는다.
셋 다 서버에서만 쓰므로 런타임 조회로 충분하다.

## URL 구조

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 — 앱별 오늘 정답 현황 (카드 그리드) |
| `/[type]/today` | 오늘 문제 목록 (정답은 가려짐) |
| `/[type]/20260801` | 특정 날짜 문제 목록 |
| `/[type]/today/answer` | 오늘 정답 전체보기 |
| `/[type]/weekly` · `/[type]/monthly` | 기간 모아보기 |
| `/search?q=` | 정답 검색 (초성 지원, 최근 90일) |
| `/[type]` | → `/[type]/today` (308) |

날짜 세그먼트는 `today` 또는 `yyyyMMdd`만 canonical이다. 다른 표기(`2026-08-01`)로
들어오면 308로 넘긴다. 없는 `type`·잘못된 날짜·미래 날짜는 404.

### 정답을 왜 분리했나

`/[type]/[date]`는 문항만 보여주고 `/[type]/[date]/answer`에서 정답을 편다.
정답을 감추는 곳은 화면만이 아니다 — 리드 문단, FAQPage의 `acceptedAnswer`,
문항별 마이크로데이터 전부에서 뺐다. 화면에 없는 내용을 구조화 데이터로
내보내면 구글 정책 위반이다. 정답을 담는 스키마는 `/answer`에만 있다.

`/answer`는 `noindex, follow`다. 같은 목록에 정답만 더한 화면이라 둘 다 색인되면
서로 중복 판정을 받는다. 검색 유입은 문제 페이지가 받고 사용자는 클릭으로 넘어온다.

## 구조

```
app/
  page.tsx                       홈 (카드 그리드)
  [type]/[date]/page.tsx         문제 목록 (핵심 랜딩)
  [type]/[date]/answer/page.tsx  정답 전체보기
  [type]/weekly|monthly/         기간 모아보기
  search/                        초성 검색
  sitemap*.xml/, robots.txt/     SEO 라우트
lib/
  quiz-items.ts   지원 앱 레지스트리 (type, 이름, seoLead, AdSense 슬롯)
  quiz-server.ts  Supabase 조회 + 중복 정답 제거
  quiz-day.ts     문제/정답 두 페이지가 공유하는 목록 조립
  date.ts         KST 처리, URL↔DB 날짜 변환
  app-theme.ts    앱 → 파스텔 색 배정 (type 해시 기반)
  site.ts         사이트 상수 · JSON-LD 공통 빌더
  adsense.ts      퍼블리셔 ID (클라이언트 번들용으로 site.ts와 분리)
components/       카드 지면 컴포넌트
```

`lib/`의 데이터 계층(`supabase`·`quiz-server`·`date`·`quiz-items`·`hangul`)은
quizkorea에서 그대로 가져왔다. 같은 테이블을 같은 규칙으로 읽어야 두 사이트의
정답이 어긋나지 않는다.

## 디자인

- `--radius: 1.25rem` — 각진 모서리를 쓰지 않는다
- 구분선(`border`) 대신 `.card-surface`의 그림자로 위계를 만든다
- 앱마다 파스텔 색 하나(`.tint-1` ~ `.tint-8`). `lib/app-theme.ts`가 `type`
  문자열 해시로 배정하므로 앱을 추가·삭제해도 나머지 색이 밀리지 않는다
- 라이트 테마 전용 (`color-scheme: light`)

## 광고

`components/quiz-ad.tsx`는 `<ins>`를 **마운트 뒤 DOM으로 직접 붙인다**. head의
애드센스 로더가 async라 하이드레이션보다 먼저 서버 HTML의 `<ins>`를 건드리면
React가 트리를 통째로 다시 그리고(React #418) 이미 채워진 광고가 날아간다.
서버에서 그리지 않으면 이 경합 자체가 없다.

> 새 도메인은 애드센스 사이트 목록에 따로 추가하고 승인을 받아야 광고가 채워진다.
> 그전까지는 요청은 나가지만 `data-ad-status="unfilled"`로 빈 자리만 남는다.

## 배포 (Cloudflare Workers)

```bash
pnpm deploy    # opennextjs-cloudflare build && deploy
pnpm preview   # 로컬에서 Worker 런타임으로 미리보기
pnpm upload    # 버전만 업로드 (배포는 대시보드에서)
```

Workers Builds 설정:

| 항목 | 값 |
| --- | --- |
| 빌드 명령 | `npx opennextjs-cloudflare build` |
| 배포 명령 | `npx opennextjs-cloudflare deploy` |
| 버전 명령 | `npx wrangler versions upload` |
| 루트 디렉터리 | `/` |

`wrangler.jsonc`의 `keep_vars: true`가 배포 때 대시보드에 설정한 일반 텍스트
환경 변수를 지우지 않게 막는다. 이 옵션이 없으면 `wrangler deploy`가 이 파일을
설정의 단일 원본으로 보고 여기에 없는 변수를 전부 삭제한다.

`worker.ts`는 OpenNext 핸들러 앞단에 Cloudflare Cache API 캐시를 둔다. 모든
페이지가 `force-dynamic`이라 그대로 두면 요청마다 SSR + Supabase 조회가 돌고
전부 Workers CPU 과금으로 잡힌다. 쿠키·인증·개인화가 없어 같은 URL이면 모든
방문자에게 같은 HTML이 나가므로 통째 캐시할 수 있다.
