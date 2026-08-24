import { SITE_NAME } from "@/lib/site"

export default function SiteFooter() {
  return (
    <footer className="mt-auto pb-10">
      <div className="page">
        <div className="card-surface px-5 py-6">
          <p className="text-sm font-extrabold">{SITE_NAME}</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            앱테크 퀴즈 정답을 매일 모아 정리합니다. 정답은 각 앱의 출제 시각에
            맞춰 갱신되며, 리워드가 소진되면 정답을 맞혀도 적립되지 않을 수
            있습니다.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            각 앱의 이름과 아이콘은 해당 회사의 상표이며, 어떤 앱의 퀴즈인지
            알리기 위한 목적으로만 표기합니다.
          </p>
        </div>
      </div>
    </footer>
  )
}
