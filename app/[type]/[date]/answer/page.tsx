import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ArrowLeft, Clock } from "lucide-react"

import AdsenseScript from "@/components/adsense-script"
import AppIcon from "@/components/app-icon"
import JsonLd from "@/components/json-ld"
import QuizAd from "@/components/quiz-ad"
import QuizList from "@/components/quiz-list"
import { tintClass } from "@/lib/app-theme"
import { resolveDateParam } from "@/lib/date"
import { loadQuizDay } from "@/lib/quiz-day"
import { getQuizItem, getQuizSeoLead } from "@/lib/quiz-items"
import {
  SITE_NAME,
  SITE_URL,
  buildBreadcrumb,
  jsonLdString,
} from "@/lib/site"

export const dynamic = "force-dynamic"

type Params = { type: string; date: string }

async function resolveRoute(params: Promise<Params>) {
  const { type, date } = await params

  const item = getQuizItem(type)
  if (!item) notFound()

  const resolved = resolveDateParam(date)
  if (!resolved) notFound()

  if (resolved.param !== date) {
    permanentRedirect(`/${type}/${resolved.param}/answer`)
  }

  return { item, resolved }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { item, resolved } = await resolveRoute(params)
  const { param, isToday, date } = resolved

  const shortLabel = format(date, "M월 d일", { locale: ko })
  const seoLead = getQuizSeoLead(item)

  return {
    title: isToday
      ? `${seoLead} ${shortLabel} 오늘 정답 전체보기`
      : `${seoLead} ${shortLabel} 정답 전체보기`,
    description: `${seoLead} ${shortLabel} 출제 문항의 정답을 한 화면에 모았습니다. ${SITE_NAME}에서 확인하세요.`,
    alternates: { canonical: `${SITE_URL}/${item.type}/${param}/answer` },
    /*
      색인 대상은 문제 페이지 하나로 둔다.
      이 화면은 같은 문항 목록에 정답만 더한 것이라 둘 다 색인되면 서로
      중복 판정을 받는다. 검색 유입은 문제 페이지가 받고 사용자는 클릭으로
      넘어오면 되므로 follow는 열어 두고 index만 닫는다.
    */
    robots: { index: false, follow: true },
  }
}

export default async function QuizAnswerPage({
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

  const { todayContents, contents, yesterdayAnswers, checkedAt } =
    await loadQuizDay(type, resolved)

  const questionHref = `/${type}/${param}`
  const url = `${SITE_URL}/${type}/${param}/answer`

  // 정답을 실제로 화면에 펼치는 유일한 곳이라, acceptedAnswer에 답을 싣는
  // 것도 여기서만 한다.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": url,
        inLanguage: "ko",
        mainEntity: contents.map((quiz) => ({
          "@type": "Question",
          name: `${longLabel} ${seoLead}${quiz.question ? ` "${quiz.question}"` : ""} 정답은 무엇인가요?`,
          acceptedAnswer: {
            "@type": "Answer",
            text:
              `${longLabel} ${seoLead} 정답은 ${quiz.answer || (quiz.answerImage ? "정답 이미지 참고" : "확인 중")}입니다.` +
              (quiz.otherAnswers?.length
                ? ` 다른 정답은 ${quiz.otherAnswers.join(", ")}입니다.`
                : ""),
          },
        })),
      },
      buildBreadcrumb([
        { name: "홈", item: SITE_URL },
        { name: `${item.typeKr} 퀴즈`, item: `${SITE_URL}/${type}/today` },
        { name: `${shortLabel} 문제`, item: `${SITE_URL}/${type}/${param}` },
        { name: `${shortLabel} 정답`, item: url },
      ]),
    ],
  }

  return (
    <>
      {todayContents.length > 0 && <AdsenseScript />}
      <JsonLd html={jsonLdString(jsonLd)} />

      <div className="page pt-6">
        {todayContents.length > 0 && <QuizAd slotId={item.slotId} />}

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
            {seoLead} {shortLabel} {isToday ? "오늘 " : ""}정답
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <time
              dateTime={`${dbDate}T00:00:00+09:00`}
              className="chip bg-secondary text-muted-foreground"
            >
              {longLabel}
            </time>
            {checkedAt && (
              <span className="chip bg-secondary text-muted-foreground">
                <Clock className="size-3.5" />
                {checkedAt} 확인
              </span>
            )}
          </div>

          <p className="mt-4 text-[0.9375rem] leading-[1.8] text-muted-foreground">
            {contents.length > 0
              ? `총 ${contents.length}문제의 문항과 정답입니다. 리워드가 소진되면 정답을 맞혀도 적립되지 않으니 확인 후 바로 참여하세요.`
              : `${longLabel}에는 아직 확인된 문항이 없습니다.`}
          </p>
        </section>

        {contents.length === 0 ? (
          <section className="card-surface mt-4 px-6 py-12 text-center">
            <p className="text-base font-extrabold">
              등록된 정답이 아직 없습니다.
            </p>
            <a
              href={questionHref}
              target="_self"
              className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              문제 페이지로 돌아가기
            </a>
          </section>
        ) : (
          <>
            <h2 className="mt-6 mb-3 px-1 text-sm font-extrabold text-muted-foreground">
              문항별 정답 <span className="tabular">{contents.length}</span>
            </h2>

            <QuizList
              contents={contents}
              yesterdayAnswers={yesterdayAnswers}
              isTodayPage={isToday}
              reveal
            />
          </>
        )}

        <a
          href={questionHref}
          target="_self"
          className="card-pressable mt-4 flex items-center gap-2 px-5 py-4 text-sm font-bold"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
          {item.typeKr} {shortLabel} 문제 페이지로
        </a>
      </div>
    </>
  )
}
