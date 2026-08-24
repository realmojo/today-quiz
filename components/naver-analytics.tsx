// quizkorea와 같은 값을 쓴다. 네이버 애널리틱스의 wa 키는 서치어드바이저에
// 등록한 사이트에 묶이므로, today.quizbells.com을 따로 등록하고 그때 받은
// 키로 바꿔야 이 도메인의 유입이 기록된다.
const NAVER_ANALYTICS_ID = "256ed54a27819a0"

/**
 * 네이버 애널리틱스 공식 스니펫을 <head>의 실제 <script> 태그로 렌더한다.
 *
 * wcslog.js를 async로 두지 않는 이유: 아래 인라인 스크립트가 파싱 시점에 바로
 * 실행되면서 window.wcs를 확인하고 wcs_do()를 부른다. 로더가 async면 그 시점에
 * 아직 window.wcs가 없어 조건문이 그냥 지나가고 조회가 한 건도 기록되지 않는다.
 * 공식 스니펫이 동기 로드인 것도 같은 이유다.
 */
export default function NaverAnalytics() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script type="text/javascript" src="https://wcs.pstatic.net/wcslog.js" />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `if (!window.wcs_add) window.wcs_add = {};
window.wcs_add["wa"] = "${NAVER_ANALYTICS_ID}";
if (window.wcs) {
  window.wcs_do();
}`,
        }}
      />
    </>
  )
}
