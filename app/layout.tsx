import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import GoogleAnalytics from "@/components/google-analytics"
import NaverAnalytics from "@/components/naver-analytics"
import SiteFooter from "@/components/site-footer"
import SiteHeader from "@/components/site-header"
import {
  ORG_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_URL,
  WEBSITE_ID,
  jsonLdString,
} from "@/lib/site"

// 한글 본문 폰트. next/font는 한글 서브셋을 지원하지 않아 CDN <link>로 받는다.
// dynamic-subset 빌드라 실제로 쓰인 글자만 내려온다.
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 앱테크 퀴즈 정답 모음`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // 아이콘 파일 자체는 app/favicon.ico · icon.svg · apple-icon.png가
  // 파일 규약으로 잡아준다. 매니페스트만 여기서 연결한다.
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
}

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      knowsAbout: ["앱테크", "퀴즈 정답", "포인트 적립", "리워드 앱"],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      inLanguage: "ko",
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORG_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
        <GoogleAnalytics />
        <NaverAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd) }}
        />
      </head>
      <body className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="flex-1 pb-16">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
