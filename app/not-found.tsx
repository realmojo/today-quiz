import { quizItems } from "@/lib/quiz-items"

export default function NotFound() {
  // 막다른 길에서 되돌아갈 통로를 준다 — 인기 앱 몇 개로 충분하다.
  const popular = quizItems.slice(0, 6)

  return (
    <div className="page pt-6">
      <section className="card-surface px-6 py-12 text-center">
        <p className="text-5xl font-black text-muted-foreground/40">404</p>
        <h1 className="mt-4 text-xl font-extrabold">
          찾는 페이지가 없습니다.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          주소가 바뀌었거나 아직 등록되지 않은 날짜일 수 있습니다.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          오늘의 정답 보기
        </a>
      </section>

      <h2 className="mt-6 mb-3 px-1 text-sm font-extrabold text-muted-foreground">
        많이 찾는 앱
      </h2>
      <ul className="grid grid-cols-2 gap-3">
        {popular.map((item) => (
          <li key={item.type}>
            <a
              href={`/${item.type}/today`}
              className="card-pressable block px-4 py-3.5 text-sm font-bold"
            >
              {item.typeKr}
              <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
                {item.title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
