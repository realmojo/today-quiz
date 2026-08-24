import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { format, startOfMonth } from "date-fns"
import { ko } from "date-fns/locale"

import AdsenseScript from "@/components/adsense-script"
import JsonLd from "@/components/json-ld"
import PeriodView from "@/components/period-view"
import { getKoreaDate } from "@/lib/date"
import { getQuizItem, getQuizSeoLead } from "@/lib/quiz-items"
import { getMonthlyQuizAnswers } from "@/lib/quiz-server"
import {
  SITE_URL,
  buildBreadcrumb,
  jsonLdString,
  publisherJsonLd,
} from "@/lib/site"

export const dynamic = "force-dynamic"

type Params = { type: string }

/** 이번 달 범위 라벨 ("8월 1일 ~ 8월 24일") */
function monthRangeLabel() {
  const today = getKoreaDate()
  return `${format(startOfMonth(today), "M월 d일", { locale: ko })} ~ ${format(today, "M월 d일", { locale: ko })}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { type } = await params
  const item = getQuizItem(type)
  if (!item) notFound()

  const monthLabel = format(getKoreaDate(), "M월")
  const seoLead = getQuizSeoLead(item)
  const rows = await getMonthlyQuizAnswers(type)

  return {
    title: `${seoLead} ${monthLabel} 정답 기록`,
    description: `${seoLead} ${monthLabel} 한 달간 출제된 퀴즈와 정답을 모두 모았습니다.`,
    alternates: { canonical: `${SITE_URL}/${type}/monthly` },
    ...(rows.length === 0 && { robots: { index: false, follow: true } }),
  }
}

export default async function MonthlyPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { type } = await params
  const item = getQuizItem(type)
  if (!item) notFound()

  const rows = await getMonthlyQuizAnswers(type)
  const today = getKoreaDate()
  const range = monthRangeLabel()
  const monthLabel = format(today, "M월")
  const seoLead = getQuizSeoLead(item)
  const heading = `${seoLead} ${monthLabel} 정답 기록`
  const url = `${SITE_URL}/${type}/monthly`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": url,
        url,
        headline: heading,
        description: `${seoLead} ${range} 퀴즈 정답 기록`,
        inLanguage: "ko",
        isAccessibleForFree: true,
        datePublished: format(startOfMonth(today), "yyyy-MM-dd"),
        dateModified: format(today, "yyyy-MM-dd"),
        publisher: publisherJsonLd,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        articleSection: "앱테크/재테크",
      },
      buildBreadcrumb([
        { name: "홈", item: SITE_URL },
        { name: `${item.typeKr} 퀴즈`, item: `${SITE_URL}/${type}/today` },
        { name: "월간 기록", item: url },
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
        lead={`${seoLead} ${monthLabel}(${range}) 한 달간 출제된 문제와 정답을 날짜순으로 모았습니다. 반복 출제되는 문제를 확인하는 데 쓰세요.`}
      />
    </>
  )
}
