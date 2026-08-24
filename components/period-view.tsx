import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

import AppIcon from "@/components/app-icon"
import QuizAd from "@/components/quiz-ad"
import { tintClass } from "@/lib/app-theme"
import { getKoreaDate, toDateParam } from "@/lib/date"
import { splitAnswer } from "@/lib/quiz-day"
import { type QuizItem } from "@/lib/quiz-items"
import {
  dedupeKeepLongestQuestion,
  type QuizAnswerRow,
} from "@/lib/quiz-server"

/**
 * 주간·월간 모아보기 공통 지면.
 *
 * 날짜 하나가 카드 하나다. 문항은 카드 안에서 접힌 목록으로 쌓인다.
 * 정답은 여기서 그대로 보여준다 — 기간 모아보기는 "훑어보는" 화면이라
 * 문항마다 다시 클릭하게 만들면 쓸모가 사라진다.
 */
export default function PeriodView({
  item,
  rows,
  heading,
  rangeLabel,
  lead,
}: {
  item: QuizItem
  rows: QuizAnswerRow[]
  heading: string
  rangeLabel: string
  lead: string
}) {
  const type = item.type
  const todayDb = format(getKoreaDate(), "yyyy-MM-dd")

  const days = rows.map((row) => ({
    dbDate: row.answerDate,
    label: format(parseISO(row.answerDate), "M월 d일 (E)", { locale: ko }),
    contents: dedupeKeepLongestQuestion(row.contents || []),
  }))

  const totalQuestions = days.reduce((sum, d) => sum + d.contents.length, 0)

  // 목록 한가운데 광고를 한 번 끼운다. 날짜가 하나뿐이면 위 지면과 붙어
  // 버리므로 두 묶음 이상일 때만 넣는다.
  const midIndex = days.length >= 2 ? Math.floor(days.length / 2) : -1

  return (
    <div className="page pt-6">
      {days.length > 0 && <QuizAd slotId={item.slotId} />}

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
          {heading}
        </h1>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          {rangeLabel}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {/* chip은 gap-1이라 숫자를 span으로 감싸면 "7 문제"처럼 벌어진다 */}
          <span className="chip tabular bg-secondary text-muted-foreground">
            수록 {totalQuestions}문제
          </span>
          <span className="chip tabular bg-secondary text-muted-foreground">
            {days.length}일치
          </span>
        </div>

        <p className="mt-4 text-[0.9375rem] leading-[1.8] text-muted-foreground">
          {lead}
        </p>
      </section>

      {days.length === 0 ? (
        <section className="card-surface mt-4 px-6 py-12 text-center">
          <p className="text-base font-extrabold">
            해당 기간의 정답이 아직 등록되지 않았습니다.
          </p>
          <a
            href={`/${type}/today`}
            className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            오늘 정답 보기
          </a>
        </section>
      ) : (
        <div className="mt-4 space-y-3">
          {/*
            DB에는 같은 날짜에 여러 행이 들어온다(하루에 회차가 여러 번 열리는
            앱이 있다). 날짜만으로는 키가 유일하지 않아 행 순서를 함께 쓴다.
          */}
          {days.map((day, dayIdx) => (
            <div key={`${day.dbDate}-${dayIdx}`}>
              {dayIdx === midIndex && <QuizAd slotId={item.slotId} />}

              <section className="card-surface overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                  <h2 className="text-base font-extrabold tracking-[-0.02em]">
                    {day.label}
                  </h2>
                  <a
                    href={`/${type}/${day.dbDate === todayDb ? "today" : toDateParam(day.dbDate)}`}
                    className="chip shrink-0 bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    자세히 →
                  </a>
                </div>

                <ol className="space-y-2 px-3 pb-3">
                  {day.contents.map((quiz, i) => {
                    const { answerText } = splitAnswer(quiz)
                    return (
                      <li key={i} className="rounded-2xl bg-secondary/50 p-3.5">
                        <p className="text-sm leading-snug font-semibold">
                          {quiz.question || "퀴즈"}
                        </p>
                        <p className="mt-1.5 text-[0.9375rem] font-extrabold text-correct">
                          {answerText}
                          {quiz.answerImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={quiz.answerImage}
                              alt={`${quiz.question ?? ""} 정답 이미지`}
                              loading="lazy"
                              className={`h-auto max-h-32 w-auto rounded-lg ${answerText ? "mt-1" : ""}`}
                            />
                          )}
                        </p>
                        {quiz.otherAnswers && quiz.otherAnswers.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            다른 정답: {quiz.otherAnswers.join(", ")}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </section>
            </div>
          ))}
        </div>
      )}

      <nav className="mt-6 grid grid-cols-2 gap-3">
        <a
          href={`/${type}/today`}
          className="card-pressable px-4 py-4 text-sm font-bold"
        >
          오늘 정답
        </a>
        <a href="/" className="card-pressable px-4 py-4 text-sm font-bold">
          다른 앱 보기
        </a>
      </nav>
    </div>
  )
}
