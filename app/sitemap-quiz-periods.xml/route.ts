import { format, startOfMonth, subDays } from "date-fns"
import { getKoreaDate, getTodayDbDate } from "@/lib/date"
import { quizItems } from "@/lib/quiz-items"
import { supabaseAdmin } from "@/lib/supabase"
import { urlsetXml, xmlResponse } from "@/lib/sitemap"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

export async function GET() {
  const lastmod = getTodayDbDate()
  const today = getKoreaDate()
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd")
  const weekStart = format(subDays(today, 6), "yyyy-MM-dd")

  const monthTypes = new Set<string>()
  const weekTypes = new Set<string>()
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("quizbells_answer")
      .select("type, answerDate")
      .gte("answerDate", monthStart)
      .lte("answerDate", lastmod)
    if (error) {
      console.error("sitemap 기간별 조회 오류:", error.message)
    } else {
      for (const row of data || []) {
        monthTypes.add(row.type)
        if (row.answerDate >= weekStart) weekTypes.add(row.type)
      }
    }
  }

  const urls = quizItems.flatMap((item) => {
    const entries = []
    if (weekTypes.has(item.type))
      entries.push({
        loc: `${SITE_URL}/${item.type}/weekly`,
        lastmod,
        changefreq: "daily",
        priority: "0.8",
      })
    if (monthTypes.has(item.type))
      entries.push({
        loc: `${SITE_URL}/${item.type}/monthly`,
        lastmod,
        changefreq: "daily",
        priority: "0.8",
      })
    return entries
  })

  return xmlResponse(urlsetXml(urls))
}
