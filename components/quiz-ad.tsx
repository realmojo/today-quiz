"use client"

import { useEffect, useRef } from "react"

import { ADSENSE_CLIENT_ID } from "@/lib/adsense"

/**
 * AdSense 수동 광고 유닛.
 *
 * <ins>를 서버에서 그리지 않고 마운트한 뒤 DOM으로 직접 붙인다.
 *
 * head의 로더는 async라 하이드레이션보다 먼저 실행될 수 있다. 그때 로더가
 * 서버 HTML의 <ins>에 iframe과 data-adsbygoogle-status를 심어버리면, React는
 * 서버가 보낸 것과 지금 DOM이 다르다고 판단해(React #418) 그 트리를 통째로
 * 다시 그린다. 이미 채워진 광고가 날아가고, 뒤이은 push()는 붙을 자리를 못
 * 찾아 no_div로 실패한다.
 *
 * 마운트 뒤에 붙이면 이 자리는 React가 그린 적이 없어 다시 조정하지도 않는다.
 * 광고 요청은 어차피 클라이언트에서 나가므로 잃는 것도 없다.
 */
export default function QuizAd({ slotId }: { slotId: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  // StrictMode는 효과를 두 번 실행한다. push가 두 번 나가면 no_div가 뜬다.
  const requested = useRef(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host || requested.current) return
    requested.current = true

    const ins = document.createElement("ins")
    ins.className = "adsbygoogle"
    ins.style.display = "block"
    ins.setAttribute("data-ad-client", ADSENSE_CLIENT_ID)
    ins.setAttribute("data-ad-slot", slotId)
    ins.setAttribute("data-ad-format", "auto")
    ins.setAttribute("data-full-width-responsive", "true")
    host.appendChild(ins)

    const w = window as Window & { adsbygoogle?: unknown[] }
    ;(w.adsbygoogle = w.adsbygoogle || []).push({})
  }, [slotId])

  if (process.env.NODE_ENV !== "production") return null

  return (
    <aside className="my-6">
      <div ref={hostRef} />
    </aside>
  )
}
