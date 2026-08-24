import { urlsetXml, xmlResponse } from "@/lib/sitemap"
import { POLICY_UPDATED, SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

/** 앱·날짜에 묶이지 않는 고정 페이지 */
export async function GET() {
  return xmlResponse(
    urlsetXml([
      {
        loc: SITE_URL,
        lastmod: POLICY_UPDATED,
        changefreq: "daily",
        priority: "1.0",
      },
      {
        loc: `${SITE_URL}/search`,
        lastmod: POLICY_UPDATED,
        changefreq: "weekly",
        priority: "0.8",
      },
    ])
  )
}
