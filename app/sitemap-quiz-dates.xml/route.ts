import { format, subDays } from "date-fns"

import {
  INDEXABLE_DAYS,
  SERVICE_START_DATE,
  getKoreaDate,
  toDateParam,
} from "@/lib/date"
import { quizItems } from "@/lib/quiz-items"
import { supabaseAdmin } from "@/lib/supabase"
import { toW3CDatetime, urlsetXml, xmlResponse } from "@/lib/sitemap"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

// PostgREST의 기본 응답 한도가 1000행이라 나눠 받는다.
const PAGE_SIZE = 1000
// 폭주 방지 상한. 365일 × 25앱 ≈ 9천 행이라 40페이지면 충분히 넉넉하다.
const MAX_PAGES = 40

type Row = { type: string; answerDate: string; updated: string | null }

/**
 * 어제부터 INDEXABLE_DAYS 전까지의 조회 구간. 오늘은 sitemap-quiz-today.xml이
 * 관리하므로 뺀다. 서비스 시작일보다 이전은 데이터가 있을 수 없어 잘라낸다.
 */
function range() {
  const today = getKoreaDate()
  const to = format(subDays(today, 1), "yyyy-MM-dd")
  const from = format(subDays(today, INDEXABLE_DAYS), "yyyy-MM-dd")

  return { from: from < SERVICE_START_DATE ? SERVICE_START_DATE : from, to }
}

/**
 * 오래된 날짜 페이지는 사실상 고정 콘텐츠다. 크롤러가 1년치를 매일 다시 훑지
 * 않도록 지난 정도에 따라 재방문 힌트를 낮춘다.
 */
function changefreq(daysAgo: number): string {
  if (daysAgo < 7) return "daily"
  if (daysAgo < 30) return "weekly"
  return "monthly"
}

/**
 * 구간 안에서 실제 정답이 있는 (type, answerDate) 조합을 전부 모은다.
 *
 * 날짜를 기계적으로 생성하지 않는 이유: 퀴즈가 열리지 않은 날까지 사이트맵에
 * 들어가면 빈 화면을 색인시키는 꼴이 된다. 데이터가 있는 조합만 낸다.
 */
async function fetchAnswerDates(from: string, to: string) {
  // "type-date" → 그 조합의 최신 updated
  const updatedMap = new Map<string, string>()
  if (!supabaseAdmin) return updatedMap

  const types = quizItems.map((q) => q.type)

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin
      .from("quizbells_answer")
      .select("type, answerDate, updated")
      .gte("answerDate", from)
      .lte("answerDate", to)
      .in("type", types)
      // 페이지 경계가 흔들리지 않도록 정렬을 고정한다.
      .order("answerDate", { ascending: false })
      .order("type", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      console.error("sitemap 날짜별 조회 오류:", error.message)
      break
    }

    const rows = (data || []) as Row[]
    for (const row of rows) {
      const key = `${row.type}-${row.answerDate}`
      const prev = updatedMap.get(key)
      const modified = row.updated || row.answerDate
      if (!prev || modified > prev) updatedMap.set(key, modified)
    }

    // 마지막 페이지 — 더 받을 것이 없다.
    if (rows.length < PAGE_SIZE) break
  }

  return updatedMap
}

export async function GET() {
  const { from, to } = range()
  const today = getKoreaDate()

  let updatedMap = new Map<string, string>()
  try {
    updatedMap = await fetchAnswerDates(from, to)
  } catch (e) {
    console.error("sitemap 날짜별 조회 오류:", e)
  }

  const urls = [...updatedMap]
    .map(([key, updated]) => {
      // key는 "{type}-{yyyy-MM-dd}" — 날짜가 항상 뒤 10자다.
      const date = key.slice(-10)
      const type = key.slice(0, -11)
      const daysAgo = Math.round(
        (today.getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86400000
      )

      return {
        loc: `${SITE_URL}/${type}/${toDateParam(date)}`,
        lastmod: updated.includes("T") ? toW3CDatetime(updated) : updated,
        changefreq: changefreq(daysAgo),
        // 최근일수록 높게 — 크롤 순서에 힌트를 준다.
        priority: daysAgo < 7 ? "0.7" : daysAgo < 30 ? "0.5" : "0.3",
      }
    })
    // 최신 날짜가 위로 오도록 정렬한다.
    .sort((a, b) => (a.loc < b.loc ? 1 : a.loc > b.loc ? -1 : 0))

  return xmlResponse(urlsetXml(urls))
}
