import { getTodayDbDate } from "@/lib/date"
import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap"
import { SITE_URL } from "@/lib/site"

// lastmod에 "오늘" 날짜를 쓰므로 빌드 시점에 고정되지 않도록 매 요청 렌더링한다.
export const dynamic = "force-dynamic"

export async function GET() {
  const today = getTodayDbDate()

  return xmlResponse(
    sitemapIndexXml([
      { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-quiz-today.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-quiz-dates.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-quiz-periods.xml`, lastmod: today },
    ])
  )
}
