import type { Metadata } from "next"
import { addDays, format, subDays } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import AppIcon from "@/components/app-icon"
import JsonLd from "@/components/json-ld"
import {
  SERVICE_START_DATE,
  getTodayDbDate,
  resolveDateParam,
  toDateParam,
} from "@/lib/date"
import { tintClass } from "@/lib/app-theme"
import { quizItems } from "@/lib/quiz-items"
import { getDailyOverview } from "@/lib/quiz-server"
import {
  ORG_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
  jsonLdString,
} from "@/lib/site"

// 홈은 그날의 정답 등록 현황을 그대로 보여주므로 매 요청 최신 상태를 렌더한다.
export const dynamic = "force-dynamic"

type HomeSearchParams = Promise<{ d?: string }>

/**
 * 홈에서 볼 날짜를 정한다.
 *
 * 날짜를 경로가 아니라 쿼리(?d=)로 받는 이유: 홈은 유일한 허브 페이지라
 * 날짜별 경로를 따로 만들면 거의 같은 내용의 허브가 날짜 수만큼 생긴다.
 * canonical을 항상 "/"로 고정하면 사용자는 날짜를 넘겨볼 수 있으면서
 * 검색엔진에는 허브가 하나로만 남는다.
 */
function resolveHomeDate(raw?: string) {
  return (raw ? resolveDateParam(raw) : null) ?? resolveDateParam("today")!
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: HomeSearchParams
}): Promise<Metadata> {
  const { d } = await searchParams
  const { isToday, date } = resolveHomeDate(d)
  const shortLabel = format(date, "M월 d일", { locale: ko })

  return {
    title: isToday
      ? `${SITE_NAME} - 오늘의 앱테크 퀴즈 정답`
      : `${shortLabel} 앱테크 퀴즈 정답`,
    description: SITE_DESCRIPTION,
    alternates: { canonical: SITE_URL },
    // 지난 날짜 뷰는 색인 대상이 아니다(날짜별 정답은 /[type]/[date]가 담당).
    ...(!isToday && { robots: { index: false, follow: true } }),
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams
}) {
  const { d } = await searchParams
  const { dbDate, isToday, date } = resolveHomeDate(d)
  const todayDb = getTodayDbDate()

  const overview = await getDailyOverview(
    dbDate,
    quizItems.map((q) => q.type)
  )

  // 정답이 올라온 앱을 위로 올린다 — 지금 확인할 수 있는 것이 먼저다.
  const ordered = [...quizItems].sort((a, b) => {
    const ca = overview.get(a.type)?.count ?? 0
    const cb = overview.get(b.type)?.count ?? 0
    if (ca > 0 !== cb > 0) return cb - ca
    return 0
  })

  const readyCount = quizItems.filter(
    (q) => (overview.get(q.type)?.count ?? 0) > 0
  ).length

  // 앱 카드가 가리킬 세그먼트 — 보고 있는 날짜를 그대로 이어준다.
  const seg = isToday ? "today" : toDateParam(dbDate)

  const prevDb = format(subDays(date, 1), "yyyy-MM-dd")
  const nextDb = format(addDays(date, 1), "yyyy-MM-dd")
  const hasPrev = prevDb >= SERVICE_START_DATE
  const hasNext = nextDb <= todayDb

  const shortLabel = format(date, "M월 d일", { locale: ko })

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `${SITE_NAME} - 오늘의 앱테크 퀴즈 정답`,
        description: SITE_DESCRIPTION,
        inLanguage: "ko",
        isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        mainEntity: { "@id": `${SITE_URL}/#quiz-list` },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#quiz-list`,
        name: "오늘의 앱테크 퀴즈 정답 목록",
        numberOfItems: quizItems.length,
        itemListElement: quizItems.map((q, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${q.typeKr} ${q.title} 오늘 정답`,
          url: `${SITE_URL}/${q.type}/today`,
        })),
      },
    ],
  }

  return (
    <>
      <JsonLd html={jsonLdString(jsonLd)} />

      <div className="page pt-6">
        {/* ── 히어로 ────────────────────────────────────────── */}
        <section className="card-surface overflow-hidden px-6 py-7">
          <p className="text-xs font-bold text-muted-foreground">
            {format(date, "yyyy년 M월 d일 (E)", { locale: ko })}
          </p>
          <h1 className="mt-1.5 text-[1.75rem] leading-[1.25] font-extrabold tracking-[-0.03em]">
            {isToday ? "오늘 뭐 나왔지?" : `${shortLabel} 퀴즈 정답`}
          </h1>
          <p className="mt-2.5 text-[0.9375rem] leading-[1.75] text-muted-foreground">
            앱테크 퀴즈 {quizItems.length}개의 정답을 한곳에 모았습니다. 앱을
            고르면 문제와 정답을 바로 볼 수 있어요.
          </p>

          <div className="mt-5 flex items-center gap-2">
            {/* chip은 gap-1이라 숫자를 span으로 감싸면 "13 개"처럼 벌어진다.
                tabular를 chip에 직접 걸고 문자열은 한 노드로 둔다. */}
            <span className="chip tabular bg-correct-surface text-correct">
              {readyCount}개 앱 공개
            </span>
            <span className="chip tabular bg-secondary text-muted-foreground">
              전체 {quizItems.length}개
            </span>
          </div>
        </section>

        {/* ── 날짜 이동 ─────────────────────────────────────── */}
        <nav
          aria-label="날짜 이동"
          className="mt-4 flex items-center justify-between gap-2"
        >
          {hasPrev ? (
            <a
              href={`/?d=${toDateParam(prevDb)}`}
              rel="prev"
              className="card-pressable flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold"
            >
              <ChevronLeft className="size-4 text-muted-foreground" />
              {format(subDays(date, 1), "M월 d일", { locale: ko })}
            </a>
          ) : (
            <span />
          )}

          {!isToday && (
            <a
              href="/"
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              오늘로
            </a>
          )}

          {hasNext ? (
            <a
              href={nextDb === todayDb ? "/" : `/?d=${toDateParam(nextDb)}`}
              rel="next"
              className="card-pressable flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold"
            >
              {format(addDays(date, 1), "M월 d일", { locale: ko })}
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
          ) : (
            <span />
          )}
        </nav>

        {/* ── 앱 카드 그리드 ────────────────────────────────── */}
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordered.map((item) => {
            const status = overview.get(item.type)
            const count = status?.count ?? 0
            const ready = count > 0

            return (
              <li key={item.type} className={tintClass(item.type)}>
                <a
                  href={`/${item.type}/${seg}`}
                  className="card-pressable flex h-full flex-col p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid shrink-0 place-items-center rounded-2xl p-1.5"
                      style={{ background: "var(--tint-surface)" }}
                    >
                      <AppIcon item={item} size={40} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-extrabold">
                        {item.typeKr}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.title}
                      </span>
                    </span>

                    {ready ? (
                      <span
                        className="chip tabular shrink-0"
                        style={{
                          background: "var(--tint-surface)",
                          color: "var(--tint-ink)",
                        }}
                      >
                        {count}문제
                      </span>
                    ) : (
                      <span className="chip shrink-0 bg-secondary text-muted-foreground">
                        대기
                      </span>
                    )}
                  </div>

                  {/*
                    카드에 앱 이름만 있으면 첫 화면에서 얻는 정보가 없다.
                    첫 문항의 질문을 한 줄 미리 보여준다. 정답은 넣지 않는다 —
                    상세 페이지에서 가려둔 것을 목록에서 흘리면 의미가 없다.
                  */}
                  {status?.preview?.question && (
                    <span className="mt-3 line-clamp-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      {status.preview.question}
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
