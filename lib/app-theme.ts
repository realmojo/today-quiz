// 앱마다 파스텔 색을 하나씩 배정한다.
//
// 목록에 카드가 25장 깔리므로 아이콘만으로는 구분이 잘 안 된다. 색을 얹으면
// 사용자가 늘 쓰는 앱을 위치가 아니라 색으로 찾는다.
//
// 색은 type 문자열에서 결정론적으로 뽑는다. 앱을 추가·삭제해도 나머지 앱의
// 색이 밀려 바뀌지 않는다 — 배열 인덱스로 돌리면 그렇게 된다.

const TINT_COUNT = 8;

/** 문자열 → 0..TINT_COUNT-1. 순서에 의존하지 않는 안정적인 해시. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % TINT_COUNT;
}

/** globals.css의 .tint-{n} 클래스명 */
export const tintClass = (type: string) => `tint-${hash(type) + 1}`;
