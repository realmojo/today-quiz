import { ADSENSE_CLIENT_ID } from "@/lib/adsense"

/**
 * AdSense 로더. <head>에 두는 구글 공식 스니펫이다.
 *
 * 개발 환경에서는 렌더하지 않는다 — 로컬 트래픽이 무효 클릭으로 잡히면
 * 계정에 불이익이 갈 수 있다.
 */
export default function AdsenseScript() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  )
}
