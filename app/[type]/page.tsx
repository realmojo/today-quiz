import { notFound, permanentRedirect } from "next/navigation"

import { getQuizItem } from "@/lib/quiz-items"

/**
 * /[type] 로 들어온 링크·크롤 신호를 canonical 허브(/[type]/today)로 넘긴다.
 * 308이라 검색엔진이 링크 가치를 그대로 이전한다.
 */
export default async function QuizTypePage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params

  if (!getQuizItem(type)) notFound()

  permanentRedirect(`/${type}/today`)
}
