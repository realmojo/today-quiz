// 사이트 전역 상수 + 구조화 데이터(JSON-LD) 공통 빌더.
// 모든 페이지가 같은 @id(Organization/WebSite)를 참조해야 검색엔진이 사이트를
// 하나의 엔티티로 인식한다.

/**
 * canonical·OG·사이트맵이 전부 여기서 파생된다.
 *
 * 도메인이 아직 정해지지 않아 환경 변수로 받는다. 배포 전에 반드시 SITE_URL을
 * 실제 도메인으로 설정할 것 — 폴백이 그대로 나가면 canonical과 사이트맵이
 * 전부 localhost를 가리킨다.
 *
 * NEXT_PUBLIC_ 접두어를 쓰지 않는 이유는 supabase.ts와 같다:
 *   NEXT_PUBLIC_*  → next build 시점에 번들에 리터럴로 박힌다. 값을 바꾸려면
 *                    재배포해야 하고, wrangler의 keep_vars도 지켜주지 않는다.
 *   일반 변수      → process.env 런타임 조회로 남는다. Worker의 환경 변수만
 *                    바꾸면 바로 반영된다.
 * 이 상수는 서버(메타데이터·JSON-LD·사이트맵)에서만 쓰므로 런타임 조회로 충분하다.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "투데이퀴즈";
export const SITE_NAME_EN = "TODAY QUIZ";
export const SITE_DESCRIPTION =
  "토스 행운퀴즈, 캐시워크 돈버는퀴즈, 신한쏠퀴즈 등 앱테크 퀴즈 정답을 매일 실시간으로 모아 보여드립니다.";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** 정책 문서의 최종 개정일. 내용을 고치면 이 날짜도 함께 올릴 것. */
export const POLICY_UPDATED = "2026-08-24";

export function buildBreadcrumb(items: { name: string; item: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

export const publisherJsonLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  alternateName: SITE_NAME_EN,
  url: SITE_URL,
};

/** JSON-LD를 <script>로 렌더할 때 쓰는 직렬화.
 *  `</script>` 시퀀스가 본문에 섞여 스크립트가 조기 종료되는 것을 막는다. */
export const jsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
