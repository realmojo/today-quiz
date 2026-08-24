import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { format, subDays } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarDays, ChevronRight, Clock } from "lucide-react"

import AdsenseScript from "@/components/adsense-script"
import AppIcon from "@/components/app-icon"
import JsonLd from "@/components/json-ld"
import QuizAd from "@/components/quiz-ad"
import QuizList from "@/components/quiz-list"
import { tintClass } from "@/lib/app-theme"
import {
  SERVICE_START_DATE,
  getKoreaDate,
  isIndexableDate,
  kstUpdatedToIsoKst,
  resolveDateParam,
} from "@/lib/date"
import { loadQuizDay } from "@/lib/quiz-day"
import { getQuizItem, getQuizSeoLead } from "@/lib/quiz-items"
import { getQuizAnswer } from "@/lib/quiz-server"
import {
  ORG_ID,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
  buildBreadcrumb,
  jsonLdString,
  publisherJsonLd,
} from "@/lib/site"

// 정답은 하루에도 여러 번 갱신되므로 항상 최신 DB 상태를 렌더한다.
export const dynamic = "force-dynamic"

type Params = { type: string; date: string }

/**
 * 라우트 파라미터를 검증하고 정규화한다.
 * canonical URL을 하나로 고정하기 위해, 같은 날짜를 가리키는 다른 표기로
 * 들어오면 308로 정규 경로에 넘긴다.
 */
async function resolveRoute(params: Promise<Params>) {
  const { type, date } = await params

  const item = getQuizItem(type)
  if (!item) notFound()

  const resolved = resolveDateParam(date)
  if (!resolved) notFound()

  if (resolved.param !== date) permanentRedirect(`/${type}/${resolved.param}`)

  return { item, resolved }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { item, resolved } = await resolveRoute(params)
  const { dbDate, param, isToday, date } = resolved

  const shortLabel = format(date, "M월 d일", { locale: ko })
  const seoLead = getQuizSeoLead(item)
  const searchKeywords = item.searchKeywords || []

  // 과거 날짜에 "오늘 정답"을 붙이면 날짜형 검색어와 불일치하고 사용자를
  // 오도하므로, 오늘 페이지에서만 "오늘"을 쓴다.
  const title = isToday
    ? `${seoLead} ${shortLabel} 오늘 정답`
    : `${seoLead} ${shortLabel} 정답`

  const canonical = `${SITE_URL}/${item.type}/${param}`
  const publishedTime = `${dbDate}T00:00:00+09:00`
  const row = await getQuizAnswer(item.type, dbDate)

  return {
    title,
    description: `${seoLead} ${shortLabel} 정답을 실시간으로 공개합니다. ${SITE_NAME}에서 확인하고 바로 포인트를 적립하세요.`,
    // 정답이 없는 화면과 색인 범위를 벗어난 날짜는 검색 결과에서 제외한다.
    ...((!row || !isIndexableDate(dbDate)) && {
      robots: { index: false, follow: true },
    }),
    keywords: [
      `${item.typeKr} 정답`,
      `${shortLabel} ${item.typeKr}`,
      "앱테크",
      item.typeKr,
      item.title,
      ...searchKeywords,
    ],
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      url: canonical,
      publishedTime,
      modifiedTime: row?.updated
        ? kstUpdatedToIsoKst(row.updated)
        : publishedTime,
      section: "앱테크/재테크",
    },
  }
}

export default async function QuizDatePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { item, resolved } = await resolveRoute(params)
  const { dbDate, param, isToday, date } = resolved
  const type = item.type

  const longLabel = format(date, "yyyy년 M월 d일")
  const shortLabel = format(date, "M월 d일", { locale: ko })
  const seoLead = getQuizSeoLead(item)

  const {
    todayContents,
    contents,
    yesterdayAnswers,
    repeatedFromYesterday,
    checkedAt,
    modifiedIso,
  } = await loadQuizDay(type, resolved)

  const answerHref = `/${type}/${param}/answer`
  const url = `${SITE_URL}/${type}/${param}`
  const h1 = isToday
    ? `${seoLead} ${shortLabel} 오늘 정답`
    : `${seoLead} ${shortLabel} 정답`

  // 리드 문단에도 정답을 쓰지 않는다. 본문에서 가려놓고 요약에서 흘리면
  // 정답 페이지를 따로 둔 의미가 없다.
  const lead = todayContents.length
    ? `${longLabel} ${seoLead}에서 ${todayContents.length}문제가 확인됐습니다. 각 문항의 정답 보기를 누르면 정답을 확인할 수 있습니다.`
    : `${longLabel}에는 아직 ${seoLead}의 새 문항이 확인되지 않았습니다. 전날 기록이 있으면 아래에 참고용으로 표시합니다.`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // FAQPage는 내보내지 않는다. 이 화면에는 정답이 없고, 화면에 없는
      // 내용을 구조화 데이터로 내보내는 것은 구글 정책 위반이다.
      // 정답을 담는 스키마는 /answer에만 둔다.
      {
        "@type": "Article",
        "@id": url,
        url,
        headline: h1,
        description: lead,
        inLanguage: "ko",
        isAccessibleForFree: true,
        datePublished: `${dbDate}T00:00:00+09:00`,
        dateModified: modifiedIso,
        author: { "@type": "Organization", "@id": ORG_ID },
        publisher: publisherJsonLd,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID },
        articleSection: "앱테크/재테크",
      },
      buildBreadcrumb([
        { name: "홈", item: SITE_URL },
        { name: `${item.typeKr} 퀴즈`, item: `${SITE_URL}/${type}/today` },
        ...(param !== "today"
          ? [{ name: `${shortLabel} 정답`, item: url }]
          : []),
      ]),
    ],
  }

  return (
    <>
      {todayContents.length > 0 && <AdsenseScript />}
      <JsonLd html={jsonLdString(jsonLd)} />

      <div className="page pt-6">
        {/* 최상단 지면 — 로더가 실려 있을 때만 자리를 만든다 */}
        {todayContents.length > 0 && <QuizAd slotId={item.slotId} />}

        {/* 과거 날짜 페이지에서 오늘로 이동 */}
        {!isToday && (
          <a
            href={`/${type}/today`}
            className="mt-2 flex items-center justify-between gap-3 rounded-[var(--radius)] bg-primary px-5 py-4 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span>
              <span className="block text-[0.9375rem] font-extrabold">
                오늘 {format(getKoreaDate(), "M월 d일", { locale: ko })} 정답 보기
              </span>
              <span className="mt-0.5 block text-xs opacity-75">
                최신 퀴즈 정답으로 이동
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0" />
          </a>
        )}

        {/* ── 앱 헤드 ───────────────────────────────────────── */}
        <section className={`${tintClass(type)} card-surface p-6`}>
          <div className="flex items-center gap-3.5">
            <span
              className="grid shrink-0 place-items-center rounded-2xl p-2"
              style={{ background: "var(--tint-surface)" }}
            >
              <AppIcon item={item} size={48} priority />
            </span>
            <div className="min-w-0">
              <p
                className="text-xs font-extrabold"
                style={{ color: "var(--tint-ink)" }}
              >
                {item.typeKr}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {item.title}
              </p>
            </div>
          </div>

          <h1 className="mt-4 text-[1.5rem] leading-[1.3] font-extrabold tracking-[-0.03em]">
            {h1}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="chip bg-secondary text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {longLabel}
            </span>
            {checkedAt && (
              <span className="chip bg-secondary text-muted-foreground">
                <Clock className="size-3.5" />
                {checkedAt} 확인
              </span>
            )}
            {repeatedFromYesterday > 0 && (
              <span className="chip bg-accent text-accent-foreground">
                전날 반복 {repeatedFromYesterday}
              </span>
            )}
          </div>

          <p className="mt-4 text-[0.9375rem] leading-[1.8] text-muted-foreground">
            {lead}
          </p>
        </section>

        {contents.length === 0 ? (
          <section className="card-surface mt-4 px-6 py-12 text-center">
            <p className="text-base font-extrabold">
              {shortLabel} 등록된 퀴즈가 아직 없습니다.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              곧 업데이트될 예정입니다. 잠시 후 다시 확인해 주세요.
            </p>
            {format(subDays(date, 1), "yyyy-MM-dd") >= SERVICE_START_DATE && (
              <a
                href={`/${type}/${format(subDays(date, 1), "yyyyMMdd")}`}
                className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {format(subDays(date, 1), "M월 d일", { locale: ko })} 정답 보기
              </a>
            )}
          </section>
        ) : (
          <>
            {/* 1번 문항 바로 앞 지면 — 목록에 들어가기 직전이라 눈이 멈춘다 */}
            <QuizAd slotId={item.slotId} />

            <h2 className="mt-6 mb-3 px-1 text-sm font-extrabold text-muted-foreground">
              출제 문제 <span className="tabular">{contents.length}</span>
            </h2>

            <QuizList
              contents={contents}
              yesterdayAnswers={yesterdayAnswers}
              isTodayPage={isToday}
              reveal={false}
              answerHref={answerHref}
              typeKr={item.typeKr}
              title={item.title}
            />

            {/* 목록을 다 훑고 내려온 사용자를 위한 통로 */}
            <a
              href={answerHref}
              target="_self"
              className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius)] bg-primary px-5 py-4 text-primary-foreground transition-opacity hover:opacity-90"
            >
              <span>
                <span className="block text-[0.9375rem] font-extrabold">
                  정답 전체 보기
                </span>
                <span className="mt-0.5 block text-xs opacity-75">
                  {contents.length}문제의 정답을 한 화면에서
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0" />
            </a>
          </>
        )}

        {/* ── 기간 모아보기 ─────────────────────────────────── */}
        <nav className="mt-6 grid grid-cols-2 gap-3">
          <a
            href={`/${type}/weekly`}
            className="card-pressable px-4 py-4 text-sm font-bold"
          >
            주간 모아보기
            <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
              최근 7일
            </span>
          </a>
          <a
            href={`/${type}/monthly`}
            className="card-pressable px-4 py-4 text-sm font-bold"
          >
            월간 기록
            <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
              이번 달 전체
            </span>
          </a>
        </nav>
      </div>
    </>
  )
}
