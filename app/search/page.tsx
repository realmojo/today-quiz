import type { Metadata } from "next"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Search } from "lucide-react"

import AppIcon from "@/components/app-icon"
import JsonLd from "@/components/json-ld"
import { tintClass } from "@/lib/app-theme"
import { getTodayDbDate, toDateParam } from "@/lib/date"
import { isChosungOnly, matches } from "@/lib/hangul"
import { getQuizItem } from "@/lib/quiz-items"
import {
  SEARCH_WINDOW_DAYS,
  getSearchCorpus,
  type SearchHit,
} from "@/lib/quiz-server"
import {
  ORG_ID,
  SITE_URL,
  WEBSITE_ID,
  buildBreadcrumb,
  jsonLdString,
} from "@/lib/site"

export const dynamic = "force-dynamic"

const TITLE = "정답 검색"
const DESCRIPTION = `최근 ${SEARCH_WINDOW_DAYS}일 동안 출제된 앱테크 퀴즈 문제와 정답을 한 번에 검색합니다. 초성만 입력해도 찾을 수 있어 초성퀴즈에도 쓸 수 있습니다.`
const MAX_RESULTS = 60

type Params = Promise<{ q?: string }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Params
}): Promise<Metadata> {
  const { q } = await searchParams
  const keyword = (q ?? "").trim()

  return {
    title: keyword ? `"${keyword}" 검색 결과` : TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/search` },
    // 검색 결과는 조합이 무한해 색인 대상이 아니다. 도구 페이지만 색인한다.
    ...(keyword && { robots: { index: false, follow: true } }),
  }
}

function ResultCard({ hit }: { hit: SearchHit }) {
  const item = getQuizItem(hit.type)
  const seg = hit.dbDate === getTodayDbDate() ? "today" : toDateParam(hit.dbDate)

  return (
    <li className={tintClass(hit.type)}>
      <a
        href={`/${hit.type}/${seg}/answer`}
        target="_self"
        className="card-pressable block p-4"
      >
        <div className="flex items-center gap-2.5">
          {item && (
            <span
              className="grid shrink-0 place-items-center rounded-xl p-1"
              style={{ background: "var(--tint-surface)" }}
            >
              <AppIcon item={item} size={24} className="rounded-lg" />
            </span>
          )}
          <span className="text-xs font-extrabold">
            {item?.typeKr ?? hit.type}
          </span>
          <span className="tabular text-xs text-muted-foreground">
            {format(parseISO(hit.dbDate), "M월 d일", { locale: ko })}
          </span>
        </div>

        <p className="mt-2.5 text-sm leading-snug font-semibold">
          {hit.question || "퀴즈"}
        </p>
        {hit.answer && (
          <p className="mt-1.5 text-[0.9375rem] font-extrabold text-correct">
            {hit.answer}
          </p>
        )}
        {hit.otherAnswers?.length ? (
          <p className="mt-1 text-xs text-muted-foreground">
            다른 정답: {hit.otherAnswers.join(", ")}
          </p>
        ) : null}
      </a>
    </li>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Params
}) {
  const { q } = await searchParams
  const keyword = (q ?? "").trim()

  let hits: SearchHit[] = []
  let total = 0

  if (keyword) {
    const corpus = await getSearchCorpus()
    // 초성 질의는 문제 문장이 아니라 정답을 겨냥한 것이다("ㅊㅅㅇ" → 초성 답).
    // 그래서 초성일 때는 정답만 대조한다.
    const chosung = isChosungOnly(keyword)
    const found = corpus.filter((h) =>
      chosung
        ? matches(h.answer, keyword)
        : matches(h.question, keyword) || matches(h.answer, keyword)
    )
    total = found.length
    hits = found.slice(0, MAX_RESULTS)
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SearchResultsPage",
        "@id": `${SITE_URL}/search`,
        url: `${SITE_URL}/search`,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "ko",
        isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
      },
      buildBreadcrumb([
        { name: "홈", item: SITE_URL },
        { name: TITLE, item: `${SITE_URL}/search` },
      ]),
    ],
  }

  return (
    <>
      <JsonLd html={jsonLdString(jsonLd)} />

      <div className="page pt-6">
        <section className="card-surface p-6">
          <h1 className="text-[1.5rem] leading-[1.3] font-extrabold tracking-[-0.03em]">
            정답 검색
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-[1.75] text-muted-foreground">
            최근 {SEARCH_WINDOW_DAYS}일치 문제와 정답을 한 번에 찾습니다. 초성만
            입력해도 됩니다.
          </p>

          {/* 서버 렌더 폼 — GET으로 ?q=를 붙여 그대로 공유 가능한 URL이 된다 */}
          <form action="/search" method="get" className="mt-5">
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={keyword}
                placeholder="문제나 정답, 초성으로 검색"
                aria-label="검색어"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-2 text-[0.9375rem] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                검색
              </button>
            </div>
          </form>
        </section>

        {keyword && (
          <>
            <h2 className="mt-6 mb-3 px-1 text-sm font-extrabold text-muted-foreground">
              &ldquo;{keyword}&rdquo; 결과{" "}
              <span className="tabular">{total}</span>건
              {total > MAX_RESULTS && ` (상위 ${MAX_RESULTS}건 표시)`}
            </h2>

            {hits.length === 0 ? (
              <div className="card-surface px-6 py-12 text-center">
                <p className="text-base font-extrabold">결과가 없습니다.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  최근 {SEARCH_WINDOW_DAYS}일 안에 출제된 문제만 찾습니다.
                  검색어를 줄여서 다시 시도해 보세요.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hits.map((hit, i) => (
                  <ResultCard key={i} hit={hit} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}
