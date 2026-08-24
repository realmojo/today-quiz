import { Search } from "lucide-react"

import { SITE_NAME } from "@/lib/site"

/**
 * 상단바.
 *
 * 스크롤을 따라오되 배경을 반투명 + 블러로 처리해 카드 지면 위에 얹힌
 * 느낌을 준다. 구분선(border-b) 대신 흐린 그림자로 경계를 만든다.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="page flex h-14 items-center justify-between gap-3">
        <a
          href="/"
          className="flex items-center gap-2 text-[1.0625rem] font-extrabold tracking-[-0.02em]"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground"
          >
            Q
          </span>
          {SITE_NAME}
        </a>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <a
            href="/"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            오늘
          </a>
          <a
            href="/search"
            aria-label="정답 검색"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Search className="size-[1.125rem]" />
          </a>
        </nav>
      </div>
    </header>
  )
}
