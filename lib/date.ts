// 날짜 유틸 — URL 파라미터(yyyyMMdd | "today")와 DB 포맷(yyyy-MM-dd) 사이의 변환.
//
// URL 규약:
//   /[type]/today          → 오늘(KST)
//   /[type]/20260801       → 2026-08-01
// DB(quizbells_answer.answerDate)는 "yyyy-MM-dd" 문자열이므로 경계에서 변환한다.

import { format, parseISO, isValid } from "date-fns";

/**
 * 정답 데이터가 존재하는 가장 이른 날짜.
 *
 * 이 하한이 없으면 /[type]/19990101 같은 URL이 전부 200으로 응답하고,
 * 날짜 페이지의 "이전 날" 링크가 과거로 무한히 이어져 크롤러가 빈 페이지를
 * 끝없이 파고든다(크롤 버짓 낭비 + 빈약한 콘텐츠 색인).
 */
export const SERVICE_START_DATE = "2025-06-28";

/**
 * 날짜 페이지를 색인 대상으로 두는 기간(오늘 기준 며칠 전까지).
 * sitemap-quiz-dates.xml의 범위도 이 상수를 쓴다 — 사이트맵에 넣은 URL이
 * noindex이면 서치콘솔이 전부 오류로 잡으므로 둘은 항상 같아야 한다.
 *
 * 한때 3일이었다. 날짜 페이지가 서로 90% 이상 같아서(그날 문제 문장만 다르고
 * 나머지는 같은 템플릿) 수백 개를 색인시키면 얇은 페이지 더미로 읽힌다는
 * 판단이었다. 지금은 1년으로 연다 — "8월 5일 토스 퀴즈 정답"처럼 날짜를 박은
 * 검색어가 실제로 들어오는데, 그 유입을 3일치만 받고 있었다.
 *
 * 얇은 페이지 위험은 사이트맵 쪽에서 막는다. 날짜를 기계적으로 만들지 않고
 * DB에 실제 정답이 있는 (type, 날짜) 조합만 제출하므로, 퀴즈가 없던 날은
 * 애초에 들어가지 않는다.
 */
export const INDEXABLE_DAYS = 365;

/** 이 날짜 페이지를 색인 대상으로 둘 것인가 */
export const isIndexableDate = (dbDate: string): boolean => {
  const limit = new Date(`${getTodayDbDate()}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() - INDEXABLE_DAYS);
  return dbDate >= limit.toISOString().slice(0, 10);
};

/** 한국 시간(KST, UTC+9) 기준 현재 날짜.
 *  서버 런타임이 UTC여도 동일하게 동작하도록 오프셋을 직접 더한다. */
export const getKoreaDate = (): Date => {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTime + 9 * 60 * 60 * 1000);
};

/** 오늘(KST)의 DB 포맷 날짜 문자열 */
export const getTodayDbDate = (): string => format(getKoreaDate(), "yyyy-MM-dd");

/** DB 포맷("2026-08-01") → URL 파라미터("20260801") */
export const toDateParam = (dbDate: string): string => dbDate.replace(/-/g, "");

/** URL 파라미터("20260801") → DB 포맷("2026-08-01") */
export const fromDateParam = (param: string): string =>
  `${param.slice(0, 4)}-${param.slice(4, 6)}-${param.slice(6, 8)}`;

export type ResolvedDate = {
  /** DB 조회용 "yyyy-MM-dd" */
  dbDate: string;
  /** 정규화된 URL 세그먼트 ("today" 또는 "yyyyMMdd") */
  param: string;
  /** 오늘(KST) 날짜인지 */
  isToday: boolean;
  /** date-fns 연산용 Date */
  date: Date;
};

/**
 * URL의 [date] 세그먼트를 해석한다.
 * - "today"            → 오늘
 * - "20260801"         → 해당 날짜
 * - "2026-08-01"       → 해당 날짜 (구형 링크 호환. canonical은 yyyyMMdd)
 * - 그 외 / 유효하지 않은 날짜 / 미래 날짜 → null (호출 측에서 404 또는 리다이렉트)
 */
export const resolveDateParam = (raw: string): ResolvedDate | null => {
  const today = getTodayDbDate();

  if (raw === "today") {
    return {
      dbDate: today,
      param: "today",
      isToday: true,
      date: parseISO(today),
    };
  }

  let dbDate: string;
  if (/^\d{8}$/.test(raw)) {
    dbDate = fromDateParam(raw);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    dbDate = raw;
  } else {
    return null;
  }

  const parsed = parseISO(dbDate);
  // parseISO는 "2026-02-31" 같은 존재하지 않는 날짜를 Invalid Date로 돌려준다.
  if (!isValid(parsed) || format(parsed, "yyyy-MM-dd") !== dbDate) return null;
  // 데이터가 존재할 수 없는 구간은 거부한다 (양방향 무한 크롤 방지).
  if (dbDate > today) return null;
  if (dbDate < SERVICE_START_DATE) return null;

  const isToday = dbDate === today;
  return {
    dbDate,
    param: isToday ? "today" : toDateParam(dbDate),
    isToday,
    date: parsed,
  };
};

// updated 컬럼은 KST 벽시계 시각이 타임존 정보 없이 저장된다
// (timestamp without time zone, 예: "2026-07-10 22:48:31.11").
// 서버 런타임(UTC)에서 new Date()로 그냥 파싱하면 9시간 어긋나므로 아래 헬퍼를 쓴다.
export const kstUpdatedToDate = (updated: string): Date =>
  new Date(`${updated.replace(" ", "T").slice(0, 23)}+09:00`);

/** JSON-LD dateModified / og article:modified_time 용 W3C Datetime (KST 명시) */
export const kstUpdatedToIsoKst = (updated: string): string =>
  `${updated.replace(" ", "T").slice(0, 19)}+09:00`;
