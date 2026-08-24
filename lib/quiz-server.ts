// 서버 컴포넌트 전용: Supabase 직접 조회.
// 라우트 핸들러(/api)를 거치지 않고 DB를 바로 읽는다 — self-fetch가 불가능한
// 엣지/Workers 런타임에서도 안전하고, 네트워크 왕복이 한 번 줄어든다.

import { cache } from "react";
import { format, subDays, startOfMonth } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase";
import { getKoreaDate } from "@/lib/date";
import { sanitizeContents } from "@/lib/quiz-sanitize";

/** quizbells_answer.contents 배열의 한 문항 */
export type QuizContent = {
  /** 문제가 속한 코너 이름 (예: "쏠퀴즈") */
  type?: string;
  question?: string;
  answer?: string;
  otherAnswers?: string[];
  answerImage?: string;
  answerLink?: string;
};

export type QuizAnswerRow = {
  id: number;
  type: string;
  answerDate: string;
  contents: QuizContent[];
  created?: string;
  /** KST 벽시계 시각, 타임존 없음 — lib/date.ts의 헬퍼로 변환해서 쓸 것 */
  updated?: string;
};

/** 메인 목록이 쓰는 앱별 요약 */
export type DailyOverview = {
  count: number;
  updated?: string;
  /** 첫 문항 미리보기 — 목록에서 바로 읽히도록 */
  preview?: { question: string; answer: string };
};

/**
 * 특정 앱·날짜의 정답 레코드 조회.
 * React cache(): 같은 요청 안에서 generateMetadata와 페이지 본문이 각각
 * 호출해도 DB 조회는 1회만 실행된다.
 */
export const getQuizAnswer = cache(
  async (type: string, dbDate: string): Promise<QuizAnswerRow | null> => {
    if (!supabaseAdmin) return null;

    try {
      const { data, error } = await supabaseAdmin
        .from("quizbells_answer")
        .select("*")
        .eq("type", type)
        .eq("answerDate", dbDate)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("getQuizAnswer 오류:", error.message);
        return null;
      }

      return data?.contents?.length ? (data as QuizAnswerRow) : null;
    } catch (error) {
      console.error("getQuizAnswer 오류:", error);
      return null;
    }
  },
);

/** 날짜 범위 조회 (주간·월간 공통) */
const getQuizAnswerRange = async (
  type: string,
  startDate: string,
  endDate: string,
): Promise<QuizAnswerRow[]> => {
  if (!supabaseAdmin) return [];

  try {
    const { data, error } = await supabaseAdmin
      .from("quizbells_answer")
      .select("*")
      .eq("type", type)
      .gte("answerDate", startDate)
      .lte("answerDate", endDate)
      .order("answerDate", { ascending: false });

    if (error) {
      console.error("getQuizAnswerRange 오류:", error.message);
      return [];
    }

    return (data || []) as QuizAnswerRow[];
  } catch (error) {
    console.error("getQuizAnswerRange 오류:", error);
    return [];
  }
};

/** 최근 7일 정답 */
export const getWeeklyQuizAnswers = (type: string) => {
  const today = getKoreaDate();
  return getQuizAnswerRange(
    type,
    format(subDays(today, 6), "yyyy-MM-dd"),
    format(today, "yyyy-MM-dd"),
  );
};

/** 이번 달 정답 */
export const getMonthlyQuizAnswers = (type: string) => {
  const today = getKoreaDate();
  return getQuizAnswerRange(
    type,
    format(startOfMonth(today), "yyyy-MM-dd"),
    format(today, "yyyy-MM-dd"),
  );
};

/**
 * 홈 지면용: 특정 날짜에 등록된 모든 앱의 정답 현황을 한 번의 쿼리로 가져온다.
 * 앱마다 따로 조회하면 25번 왕복이라 홈 TTFB가 그만큼 늘어난다.
 * 반환: type → { 문항 수, 최종 갱신 시각 }
 */
export const getDailyOverview = cache(
  async (
    dbDate: string,
    types: string[],
  ): Promise<Map<string, DailyOverview>> => {
    const map = new Map<string, DailyOverview>();
    if (!supabaseAdmin) return map;

    try {
      const { data, error } = await supabaseAdmin
        .from("quizbells_answer")
        .select("type, contents, updated")
        .eq("answerDate", dbDate)
        .in("type", types);

      if (error) {
        console.error("getDailyOverview 오류:", error.message);
        return map;
      }

      for (const row of (data || []) as QuizAnswerRow[]) {
        const clean = dedupeByAnswer(row.contents || []);
        const count = clean.length;
        const prev = map.get(row.type);
        // 같은 날짜에 레코드가 여러 개면 문항이 더 많은 쪽을 대표로 삼는다.
        if (!prev || count > prev.count) {
          // 메인에서 정답 한 줄을 미리 보여주기 위해 첫 문항을 함께 싣는다.
          // 목록만 있으면 방문자가 첫 화면에서 얻는 정보가 없다.
          const first = clean[0];
          map.set(row.type, {
            count,
            updated: row.updated,
            preview: first
              ? {
                  question: (first.question || "").trim(),
                  answer: (first.answer || "").trim(),
                }
              : undefined,
          });
        }
      }
    } catch (error) {
      console.error("getDailyOverview 오류:", error);
    }

    return map;
  },
);

/**
 * 같은 정답이 반복 등록된 경우 하나만 남긴다.
 * 크롤러가 같은 문제를 코너별로 중복 수집하는 일이 있어 화면·스키마 모두에서 제거한다.
 */
export const dedupeByAnswer = (contents: QuizContent[]): QuizContent[] => {
  const seen = new Set<string>();
  const result: QuizContent[] = [];

  // 못 쓰는 문항을 먼저 걷어낸다 — 아래 중복 제거보다 앞에 와야
  // 깨진 항목이 대표로 남는 일이 없다.
  for (const quiz of sanitizeContents(contents)) {
    const key = (quiz.answer || "").trim() || quiz.answerImage;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(quiz);
  }

  return result;
};

/** 같은 정답 중 문제 문장이 가장 긴 것만 남긴다 (주간·월간 요약용) */
export const dedupeKeepLongestQuestion = (
  contents: QuizContent[],
): QuizContent[] => {
  const map = new Map<string, QuizContent>();

  for (const quiz of sanitizeContents(contents)) {
    const key = (quiz.answer || "").trim() || quiz.answerImage;
    if (!key) continue;

    const existing = map.get(key);
    if (
      !existing ||
      (quiz.question || "").length > (existing.question || "").length
    ) {
      map.set(key, quiz);
    }
  }

  return Array.from(map.values());
};

/** 검색이 훑는 기간. 공유 DB라 검색용 인덱스를 새로 만들 수 없어,
 *  한 번의 조회로 감당되는 범위로 제한한다. */
export const SEARCH_WINDOW_DAYS = 90;

export type SearchHit = {
  type: string;
  dbDate: string;
  question: string;
  answer: string;
  otherAnswers?: string[];
  answerImage?: string;
};

/**
 * 최근 SEARCH_WINDOW_DAYS 구간의 문항을 한 번에 가져온다.
 *
 * contents가 jsonb라 PostgREST로 부분일치 필터를 걸 수 없다. 공유 DB에
 * 검색용 함수나 인덱스를 새로 만들면 quizbells 쪽에도 영향이 가므로,
 * 범위를 좁혀 통째로 받아 서버에서 거른다. React cache()로 감싸 같은 요청
 * 안에서는 한 번만 조회한다.
 */
export const getSearchCorpus = cache(async (): Promise<SearchHit[]> => {
  if (!supabaseAdmin) return [];

  const from = format(
    subDays(getKoreaDate(), SEARCH_WINDOW_DAYS),
    "yyyy-MM-dd",
  );

  try {
    const { data, error } = await supabaseAdmin
      .from("quizbells_answer")
      .select("type, answerDate, contents")
      .gte("answerDate", from)
      .order("answerDate", { ascending: false });

    if (error) {
      console.error("getSearchCorpus 오류:", error.message);
      return [];
    }

    const out: SearchHit[] = [];
    const seen = new Set<string>();

    for (const row of (data || []) as QuizAnswerRow[]) {
      for (const c of row.contents || []) {
        const question = (c.question || "").trim();
        const answer = (c.answer || "").trim();
        if (!question && !answer) continue;
        // 같은 날 같은 앱에서 중복 수집된 문항은 하나만 남긴다
        const key = `${row.type}|${row.answerDate}|${question}|${answer}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          type: row.type,
          dbDate: row.answerDate,
          question,
          answer,
          otherAnswers: c.otherAnswers,
          answerImage: c.answerImage,
        });
      }
    }
    return out;
  } catch (error) {
    console.error("getSearchCorpus 오류:", error);
    return [];
  }
});
