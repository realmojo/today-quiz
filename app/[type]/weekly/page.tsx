import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { format, subDays } from "date-fns"
import { ko } from "date-fns/locale"

import AdsenseScript from "@/components/adsense-script"
import JsonLd from "@/components/json-ld"
import PeriodView from "@/components/period-view"
import { getKoreaDate } from "@/lib/date"
import { getQuizItem, getQuizSeoLead } from "@/lib/quiz-items"
import { getWeeklyQuizAnswers } from "@/lib/quiz-server"
import {
  SITE_URL,
  buildBreadcrumb,
  jsonLdString,
  publisherJsonLd,
} from "@/lib/site"

export const dynamic = "force-dynamic"

type Params = { type: string }

/** 최근 7일 범위 라벨 ("7월 30일 ~ 8월 5일") */
function weekRangeLabel() {
  const today = getKoreaDate()
  return `${format(subDays(today, 6), "M월 d일", { locale: ko })} ~ ${format(today, "M월 d일", { locale: ko })}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { type } = await params
  const item = getQuizItem(type)
  if (!item) notFound()

  const range = weekRangeLabel()
  const seoLead = getQuizSeoLead(item)
  const rows = await getWeeklyQuizAnswers(type)

  return {
    title: `${seoLead} 이번 주 정답 총정리 (${range})`,
    description: `${seoLead} ${range} 전체 퀴즈 정답을 한눈에 확인하세요.`,
    alternates: { canonical: `${SITE_URL}/${type}/weekly` },
    ...(rows.length === 0 && { robots: { index: false, follow: true } }),
  }
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { type } = await params
  const item = getQuizItem(type)
  if (!item) notFound()

  const rows = await getWeeklyQuizAnswers(type)
  const today = getKoreaDate()
  const range = weekRangeLabel()
  const seoLead = getQuizSeoLead(item)
  const heading = `${seoLead} 이번 주 정답 총정리`
  const url = `${SITE_URL}/${type}/weekly`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": url,
        url,
        headline: heading,
        description: `${seoLead} ${range} 전체 퀴즈 정답 모음`,
        inLanguage: "ko",
        isAccessibleForFree: true,
        datePublished: format(subDays(today, 6), "yyyy-MM-dd"),
        dateModified: format(today, "yyyy-MM-dd"),
        publisher: publisherJsonLd,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        articleSection: "앱테크/재테크",
      },
      buildBreadcrumb([
        { name: "홈", item: SITE_URL },
        { name: `${item.typeKr} 퀴즈`, item: `${SITE_URL}/${type}/today` },
        { name: "주간 정답", item: url },
      ]),
    ],
  }

  return (
    <>
      {rows.length > 0 && <AdsenseScript />}
      <JsonLd html={jsonLdString(jsonLd)} />
      <PeriodView
        item={item}
        rows={rows}
        heading={heading}
        rangeLabel={range}
        lead={`${seoLead} 이번 주(${range}) 전체 퀴즈 정답을 한눈에 모았습니다. 날짜별 문제와 정답을 그대로 실어두었으니 놓친 날의 정답도 여기서 바로 확인하세요.`}
      />
    </>
  )
}
