import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 앱 아이콘은 이미 200px webp로 사전 리사이즈되어 있고 실제 표시 크기도
  // 24~48px이라 런타임 최적화로 얻을 게 없다. 원본을 그대로 서빙한다.
  images: {
    unoptimized: true,
  },

  // 프로덕션 빌드에서 console.* 제거 (원인 추적용 error/warn은 남긴다)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  async headers() {
    return [
      {
        // 보안 헤더. 요청과 무관한 고정 헤더라 여기서 붙이는 편이 경로가 짧다.
        // CSP는 넣지 않는다 — 광고·분석 서드파티 스크립트와 충돌한다.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // HTML·데이터 응답은 항상 재검증한다. 정답은 하루에도 여러 번 갱신되므로
        // 중간 캐시가 지난 정답을 들고 있으면 안 된다.
        source: "/((?!_next/static/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // 앱 아이콘은 배포 사이에 바뀌지 않는 정적 자산인데 위의 전역 no-cache에
        // 걸려 매번 재검증을 요구하고 있었다. 하루로 잡아 왕복을 줄인다.
        source: "/images/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        // 빌드 자산은 파일명에 콘텐츠 해시가 들어가 영구 캐시가 안전하다.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig

// next dev에서 Cloudflare 바인딩(getCloudflareContext 등)을 로컬로 흉내 낸다.
// 프로덕션 빌드에는 영향이 없다.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
initOpenNextCloudflareForDev()
