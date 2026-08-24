import { ExternalLink, Lock } from "lucide-react"

import {
  answerFormat,
  normalizeAnswer,
  splitAnswer,
  type DayQuiz,
} from "@/lib/quiz-day"

/**
 * 문항 목록. 문항 하나가 카드 하나다.
 *
 *   reveal={false} : /[type]/[date]         정답 자리에 잠금 카드를 둔다
 *   reveal={true}  : /[type]/[date]/answer  정답을 펼친다
 *
 * 두 화면의 문항 순서와 id(quiz-{idx})가 같아야 앵커가 맞으므로 렌더를 한
 * 곳에 둔다. reveal이 false일 때는 정답을 숨기는 게 아니라 아예 렌더하지
 * 않는다 — CSS로 가리면 소스보기에 그대로 남고, 화면에 없는 내용을 구조화
 * 데이터로 내보내면 구글 정책에도 걸린다.
 */
function buildQuizDescription(quiz: DayQuiz, typeKr: string, title: string): string {
  const corner = quiz.type ? ` ${quiz.type}` : ""
  const appName = `${typeKr}${corner}`
  const fullTitle = `${typeKr} ${title}`
  const questionPart = quiz.question
    ? `"${quiz.question}"에 관한 문제입니다. 관련 상식을 미리 알아두면 앞으로 비슷한 유형의 퀴즈를 더 빠르고 정확하게 풀 수 있습니다.`
    : "매일 새롭게 출제되는 상식 퀴즈입니다. 꾸준히 도전해 다양한 분야의 지식을 넓혀 보세요."

  return `이 퀴즈는 ${appName}에서 출제된 문항입니다. ${questionPart} ${fullTitle}는 매일 새로운 상식 퀴즈를 출제하는 앱테크 서비스로, 퀴즈 정답을 맞히면 포인트·쿠폰·현금성 리워드 등 다양한 혜택을 받을 수 있습니다. 꾸준히 참여하면 일상 속에서 쏠쏠한 포인트를 적립할 수 있으며, 여러 앱테크 서비스를 함께 활용하면 한 달에 의미 있는 금액을 모을 수 있습니다. 퀴즈에 참여하려면 해당 앱을 열고 퀴즈 배너 또는 이벤트 탭을 선택하면 되며, 리워드가 소진되기 전에 빠르게 참여하는 것이 중요합니다.`
}

export default function QuizList({
  contents,
  yesterdayAnswers,
  isTodayPage,
  reveal,
  answerHref,
  typeKr,
  title,
}: {
  contents: DayQuiz[]
  yesterdayAnswers: Set<string>
  isTodayPage: boolean
  reveal: boolean
  /** reveal=false일 때 정답 페이지 주소 */
  answerHref?: string
  typeKr: string
  title: string
}) {
  return (
    <ol className="space-y-3">
      {contents.map((quiz, idx) => {
        const { answerUrl, answerText } = splitAnswer(quiz)
        const normalized = normalizeAnswer(quiz.answer)
        const repeated =
          quiz.isToday && Boolean(normalized) && yesterdayAnswers.has(normalized)

        return (
          <li
            key={idx}
            id={`quiz-${idx}`}
            className="card-surface scroll-mt-20 p-5"
            {...(reveal && {
              itemScope: true,
              itemType: "https://schema.org/Question",
            })}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="tabular grid size-6 place-items-center rounded-lg bg-secondary text-[0.6875rem] text-secondary-foreground">
                {idx + 1}
              </span>
              <span
                className={
                  quiz.isToday ? "text-primary" : "text-muted-foreground"
                }
              >
                {quiz.isToday
                  ? isTodayPage
                    ? "오늘 퀴즈"
                    : "이 날짜 퀴즈"
                  : "전날 퀴즈"}
              </span>
              {quiz.type && (
                <span className="truncate font-medium text-muted-foreground">
                  {quiz.type}
                </span>
              )}
              {repeated && (
                <span className="chip bg-accent text-accent-foreground">
                  전날 반복
                </span>
              )}
            </div>

            <h3
              className="mt-2.5 text-[1.0625rem] leading-snug font-bold"
              {...(reveal && { itemProp: "name" })}
            >
              {quiz.question || quiz.type}
            </h3>

            {reveal ? (
              <div
                className="mt-3 rounded-2xl bg-correct-surface px-4 py-3.5"
                itemProp="acceptedAnswer"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <p className="text-[0.6875rem] font-black tracking-wide text-correct uppercase">
                  정답
                </p>
                {answerText && (
                  <p
                    itemProp="text"
                    className="mt-1 text-xl leading-snug font-extrabold text-correct"
                  >
                    {answerText}
                  </p>
                )}
                {quiz.answerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={quiz.answerImage}
                    alt={`${quiz.question ?? "퀴즈"} 정답 이미지`}
                    loading="lazy"
                    className="mt-2 h-auto max-w-full rounded-xl"
                  />
                )}
                {quiz.otherAnswers?.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    다른 정답: {quiz.otherAnswers.join(", ")}
                  </p>
                ) : null}
                {answerUrl && (
                  <a
                    href={answerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-correct px-3.5 py-2 text-xs font-bold text-correct-foreground transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="size-3.5" /> 퀴즈 참여하기
                  </a>
                )}
              </div>
            ) : (
              <a
                href={`${answerHref}#quiz-${idx}`}
                target="_self"
                className="group mt-3 flex items-center justify-between gap-3 rounded-2xl bg-correct-surface px-4 py-3.5 transition-colors hover:bg-correct/15"
              >
                <span className="flex items-center gap-2.5">
                  <Lock className="size-4 shrink-0 text-correct" />
                  <span className="text-[0.9375rem] font-extrabold text-correct">
                    정답 보기
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 font-bold text-correct transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </a>
            )}

            <p className="mt-3 text-sm leading-[1.75] text-muted-foreground">
              {buildQuizDescription(quiz, typeKr, title)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {answerFormat(quiz)}
              {quiz.otherAnswers?.length
                ? ` · 허용 답안 ${quiz.otherAnswers.length + 1}개`
                : " · 단일 답안"}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
