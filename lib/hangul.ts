// 초성 검색 유틸.
//
// 캐시슬라이드 초성퀴즈처럼 자음만 주어지는 문제가 있어, 검색어가 초성으로만
// 이뤄져 있으면 후보의 초성을 뽑아 비교한다. 일반 검색어는 그대로 부분일치.

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;
/** 한 초성이 담당하는 음절 수 = 중성 21 × 종성 28 */
const PER_CHOSUNG = 588;

/** 문자열이 자음(초성)으로만 이뤄져 있는가 — 공백은 무시한다 */
export function isChosungOnly(s: string): boolean {
  const t = s.replace(/\s+/g, "");
  if (!t) return false;
  return [...t].every((ch) => CHOSUNG.includes(ch));
}

/** "돈버는퀴즈" → "ㄷㅂㄴㅋㅈ". 한글이 아닌 문자는 그대로 남긴다. */
export function toChosung(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
      out += CHOSUNG[Math.floor((code - SYLLABLE_START) / PER_CHOSUNG)];
    } else if (ch.trim()) {
      out += ch;
    }
  }
  return out;
}

/** 검색어를 정규화 — 공백·대소문자 차이로 결과가 갈리지 않게 한다 */
export const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/**
 * 후보 문자열이 검색어에 걸리는지 판단한다.
 * 검색어가 초성만이면 후보의 초성과 비교하고, 아니면 부분일치로 본다.
 */
export function matches(candidate: string, query: string): boolean {
  if (!candidate) return false;
  if (isChosungOnly(query)) {
    return toChosung(candidate).includes(query.replace(/\s+/g, ""));
  }
  return normalize(candidate).includes(normalize(query));
}
