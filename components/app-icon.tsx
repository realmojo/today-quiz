import type { QuizItem } from "@/lib/quiz-items"

/**
 * 앱 아이콘.
 * 원본이 이미 200px webp로 사전 리사이즈되어 있고 실제 표시 크기는 40~64px라
 * next/image 런타임 최적화로 얻을 것이 없다. <img>로 그대로 서빙한다.
 */
export default function AppIcon({
  item,
  size = 44,
  priority = false,
  className = "",
}: {
  item: QuizItem
  size?: number
  priority?: boolean
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image}
      alt={`${item.typeKr} 앱 아이콘`}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`rounded-2xl object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
