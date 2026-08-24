import type { QuizContent } from "./quiz-server";

/**
 * 표시 단계 정제.
 *
 * 정답 데이터는 커뮤니티 게시물에서 수집되는데, 그 과정에서 작성자 닉네임이
 * 문제 텍스트에 붙거나 정답 칸이 비는 경우가 있다. 전체의 2% 남짓이지만
 * 하필 노출이 많은 앱에서 걸리면 "정답을 알려주는 사이트"가 정답 자리에
 * 마침표를 보여주게 된다.
 *
 * DB를 고치지 않고 화면에 내보내기 직전에 거른다. 원본은 그대로 두므로
 * 수집 로직이 개선되면 이 필터가 자연히 아무것도 걸러내지 않게 된다.
 */

/** 정답 칸에 들어왔지만 정답이 아닌 것들 */
const SYMBOLS_ONLY = /^[\s.,·・:;!?~\-–—…'"“”‘’()[\]{}/\\|]*$/;

/** 정답이 아니라 문제의 뒷부분이 잘려 들어온 경우를 가리키는 표지 */
const QUESTION_MARKERS = [
  "무엇일까요",
  "무엇인가요",
  "무엇입니까",
  "고르세요",
  "맞혀보세요",
  "알아맞혀",
];

/** 비교용 정규화 — 괄호·공백·기호를 걷어낸 알맹이만 남긴다 */
const norm = (s: string): string =>
  s
    .replace(/\[[^\]]*\]|\([^)]*\)/g, "")
    .replace(/[\s.,·・:;!?~\-–—…'"“”‘’/\\|]/g, "")
    .toLowerCase();

/**
 * 문제 끝에 붙은 작성자 닉네임을 떼어낸다.
 *
 * 닉네임은 종류가 매번 달라 사전으로 만들 수 없다(같은 닉네임이 두 번
 * 나오는 경우가 거의 없다). 대신 정답 문자열을 기준점으로 쓴다 —
 * 정답이 문제 안에 등장하고 그 뒤에 공백 없이 짧은 덩어리가 남으면,
 * 그 덩어리가 닉네임이다.
 *
 *   "직방, 퀴즈, 단기임대은재아빠님" + 정답 "단기임대" → "직방, 퀴즈, 단기임대"
 */
export function cleanQuestion(question: string, answer: string): string {
  let q = question.trim();
  if (!q) return q;

  const a = answer.trim();
  if (a && a.length >= 2) {
    const idx = q.lastIndexOf(a);
    if (idx >= 0) {
      const tail = q.slice(idx + a.length);
      // 공백 없이 붙은 3~12자 덩어리만 닉네임으로 본다.
      // 2자까지 허용하면 "디지털학습"의 "학습"처럼 멀쩡한 낱말이 잘린다.
      if (tail.length >= 3 && tail.length <= 12 && !/\s/.test(tail)) {
        q = q.slice(0, idx + a.length);
      }
    }
  }

  // 한글 뒤에 공백 없이 붙은 라틴 문자 덩어리 ("하이라이트stevegrey")
  q = q.replace(/([가-힣])([A-Za-z][A-Za-z0-9_]{2,})$/, "$1");

  return q.trim();
}

/** 화면에 내보낼 수 있는 정답인가 */
export function isUsableAnswer(content: QuizContent): boolean {
  const a = (content.answer || "").trim();
  const q = (content.question || "").trim();

  // 이미지로 답을 주는 문항은 텍스트가 없어도 유효하다
  if (!a) return Boolean(content.answerImage);

  if (SYMBOLS_ONLY.test(a)) return false;

  // 정답 칸에 문제의 뒷부분이 잘려 들어온 경우
  if (QUESTION_MARKERS.some((m) => a.includes(m))) return false;

  const na = norm(a);
  const nq = norm(q);
  // norm은 비교를 위해 괄호 안을 걷어낸다. "(다)-(나)-(가)"처럼 내용이 전부
  // 괄호 안에 있는 정답은 여기서 빈 문자열이 되는데, 멀쩡한 정답이므로 살린다.
  if (!na) return /[가-힣a-zA-Z0-9]/.test(a);

  // 문제와 정답이 사실상 같은 경우 (수집 시 제목이 양쪽에 들어감)
  if (na === nq) return false;
  if (na.length > 12 && nq.length > 12) {
    const [long, short] = na.length >= nq.length ? [na, nq] : [nq, na];
    if (long.includes(short) && short.length / long.length > 0.8) return false;
  }

  return true;
}

/**
 * 목록에 내보내기 직전에 한 번 통과시킨다.
 * 못 쓰는 문항은 버리고, 남은 문항의 문제 텍스트를 정리한다.
 */
export function sanitizeContents(contents: QuizContent[]): QuizContent[] {
  const out: QuizContent[] = [];
  for (const c of contents) {
    if (!isUsableAnswer(c)) continue;
    const question = cleanQuestion(c.question || "", c.answer || "");
    out.push(question === c.question ? c : { ...c, question });
  }
  return out;
}
