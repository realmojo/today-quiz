// 날짜 페이지(/[type]/[date])와 정답 페이지(/[type]/[date]/answer)가 공유하는
// 데이터 조립.
//
// 두 페이지는 같은 문항 목록을 같은 순서로 보여준다. 문제 페이지의 "정답 보기"가
// #quiz-{idx} 앵커로 정답 페이지의 같은 문항을 가리키므로, 목록을 만드는 규칙이
// 한 곳에 있어야 두 화면의 인덱스가 어긋나지 않는다.

import { format, subDays } from "date-fns"

import {
  getKoreaDate,
  getTodayDbDate,
  kstUpdatedToIsoKst,
  type ResolvedDate,
} from "@/lib/date"
import {
  dedupeByAnswer,
  getQuizAnswer,
  type QuizContent,
} from "@/lib/quiz-server"

/** 목록에 실리는 문항 — 어느 날짜에서 왔는지를 함께 들고 다닌다. */
export type DayQuiz = QuizContent & { isToday: boolean; seg: string }

export type QuizDay = {
  /** 해당 날짜의 문항 */
  todayContents: DayQuiz[]
  /** 화면에 실제로 그리는 목록 (해당 날짜 + 전날, 중복 제거) */
  contents: DayQuiz[]
  /** 전날 정답 집합 — 반복 출제 판정용 */
  yesterdayAnswers: Set<string>
  /** 전날과 답이 같은 문항 수 */
  repeatedFromYesterday: number
  /** "숫자형 2개 · O/X형 2개" */
  formatSummary: string
  /** 마지막 정답 갱신 시각 "HH:mm" (없으면 null) */
  checkedAt: string | null
  /** Article의 dateModified용 ISO(KST) */
  modifiedIso: string
  /** 정답이 하나라도 등록됐는지 */
  hasAnswers: boolean
}

export const normalizeAnswer = (value?: string) =>
  (value || "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\s+/g, "")
    .toLocaleLowerCase("ko-KR")

/** 실제 문항·답안 모양에서만 판정하는 출제 형식. */
export function answerFormat(quiz: QuizContent): string {
  const question = quiz.question || ""
  const answer = normalizeAnswer(quiz.answer)

  if (!answer && quiz.answerImage) return "이미지 답안"
  if (/초성|자음/.test(question)) return "초성형"
  if (/^(o|x|○|×)$/.test(answer)) return "O/X형"
  if (/^[\d,.%원만억천백십]+$/.test(answer)) return "숫자형"
  if (quiz.otherAnswers?.length) return "복수 답안형"
  return "단답형"
}

/** 정답 문자열에 URL이 섞여 있는 경우가 있어 표시용으로 갈라둔다. */
export function splitAnswer(quiz: QuizContent) {
  const answerUrl =
    quiz.answerLink || quiz.answer?.match(/https?:\/\/[^\s]+/)?.[0]
  const answerText = answerUrl
    ? (quiz.answer || "").replace(answerUrl, "").trim()
    : quiz.answer

  return { answerUrl, answerText }
}

export async function loadQuizDay(
  type: string,
  resolved: ResolvedDate
): Promise<QuizDay> {
  const { dbDate, param, date } = resolved
  const yesterdayDb = format(subDays(date, 1), "yyyy-MM-dd")

  // 오늘·어제 정답은 서로 독립이라 병렬로 가져와 TTFB를 줄인다.
  // getQuizAnswer는 React cache()라 같은 요청 안에서는 한 번만 조회된다.
  const [todayRow, yesterdayRow] = await Promise.all([
    getQuizAnswer(type, dbDate),
    getQuizAnswer(type, yesterdayDb),
  ])

  const todayContents: DayQuiz[] = (todayRow?.contents ?? [])
    .slice()
    .reverse()
    .map((q) => ({ ...q, isToday: true, seg: param }))

  // 어제 문항까지 함께 싣는 이유: 앱에 따라 자정 직후에는 당일 정답이 아직
  // 등록되지 않는데, 그때 빈 페이지를 보여주면 사용자가 바로 이탈한다.
  const yesterdaySeg =
    yesterdayDb === getTodayDbDate() ? "today" : yesterdayDb.replace(/-/g, "")
  const yesterdayContents: DayQuiz[] = (yesterdayRow?.contents ?? []).map(
    (q) => ({ ...q, isToday: false, seg: yesterdaySeg })
  )

  const contents = dedupeByAnswer([
    ...todayContents,
    ...yesterdayContents,
  ]) as DayQuiz[]

  const yesterdayAnswers = new Set(
    yesterdayContents.map((q) => normalizeAnswer(q.answer)).filter(Boolean)
  )
  const repeatedFromYesterday = todayContents.filter((q) => {
    const answer = normalizeAnswer(q.answer)
    return answer && yesterdayAnswers.has(answer)
  }).length

  const formatCounts = todayContents.reduce<Map<string, number>>(
    (counts, q) => {
      const label = answerFormat(q)
      counts.set(label, (counts.get(label) ?? 0) + 1)
      return counts
    },
    new Map()
  )
  const formatSummary = [...formatCounts]
    .map(([label, count]) => `${label} ${count}개`)
    .join(" · ")

  return {
    todayContents,
    contents,
    yesterdayAnswers,
    repeatedFromYesterday,
    formatSummary,
    checkedAt: todayRow?.updated
      ? kstUpdatedToIsoKst(todayRow.updated).slice(11, 16)
      : null,
    modifiedIso: todayRow?.updated
      ? kstUpdatedToIsoKst(todayRow.updated)
      : `${format(getKoreaDate(), "yyyy-MM-dd'T'HH:mm:ss")}+09:00`,
    hasAnswers: Boolean(todayRow),
  }
}
