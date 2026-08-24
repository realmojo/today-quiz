// quizkorea와 같은 GA4 속성을 쓴다. 사이트를 나눠 보려면 새 측정 ID를 발급해
// 이 값만 바꾸면 된다.
export const GA_MEASUREMENT_ID = "G-VGZC3BFV8K"

/**
 * GA4(gtag.js) 공식 스니펫. <head>에 실제 <script> 태그로 렌더한다.
 *
 * next/script의 afterInteractive를 쓰면 안 된다. 그 방식은 태그를 HTML에 넣지
 * 않고 하이드레이션 이후 클라이언트에서 주입하는데, 서버가 내려주는 HTML에는
 * <link rel="preload">만 남는다. 브라우저에서는 결국 동작하지만, 원본 HTML을
 * 읽어 태그를 찾는 구글의 설치 감지(태그 어시스턴트·GA 설정 도우미)에는
 * "설치되지 않음"으로 잡힌다.
 *
 * 개발 환경에서는 렌더하지 않는다 — 로컬 트래픽이 리포트에 섞이면 안 된다.
 * 그래서 localhost에서 태그가 보이지 않는 것은 정상이다.
 */
export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
        }}
      />
    </>
  )
}
