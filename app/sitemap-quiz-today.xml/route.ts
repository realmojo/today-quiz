import { getTodayDbDate } from "@/lib/date"
import { quizItems } from "@/lib/quiz-items"
import { getDailyOverview } from "@/lib/quiz-server"
import { toW3CDatetime, urlsetXml, xmlResponse } from "@/lib/sitemap"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * /[type]/today 허브 URL.
 * lastmod에 실제 정답 갱신 시각을 실어 크롤러에게 신선도를 정확히 알린다.
 */
export async function GET() {
  const today = getTodayDbDate()
  const types = quizItems.map((q) => q.type)
  const overview = await getDailyOverview(today, types)

  const urls = types.flatMap((type) => {
    const count = overview.get(type)?.count ?? 0
    if (count === 0) return []
    const updated = overview.get(type)?.updated
    const lastmod = updated ? toW3CDatetime(updated) : today

    return [
      {
        loc: `${SITE_URL}/${type}/today`,
        lastmod,
        changefreq: "hourly",
        priority: "1.0",
      },
    ]
  })

  return xmlResponse(urlsetXml(urls))
}
