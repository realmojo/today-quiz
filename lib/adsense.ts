/**
 * AdSense 퍼블리셔 ID.
 *
 * site.ts가 아니라 별도 모듈에 둔다. 이 값은 클라이언트 컴포넌트(quiz-ad.tsx)가
 * 쓰는데, site.ts에 두면 SITE_URL 같은 서버 전용 process.env 조회까지 클라이언트
 * 번들로 딸려 들어간다(그쪽에서는 undefined가 되어 조용히 폴백으로 떨어진다).
 *
 * 슬롯 ID는 앱마다 다르며 lib/quiz-items.ts의 slotId에 있다.
 *
 * 주의: 새 도메인은 애드센스 사이트 목록에 따로 추가하고 승인을 받아야 광고가
 * 채워진다. 그전까지는 요청은 나가지만 data-ad-status="unfilled"로 빈 자리만 남는다.
 */
export const ADSENSE_CLIENT_ID = "ca-pub-9130836798889522";
