/**
 * 페이지별 JSON-LD.
 * html은 호출부에서 jsonLdString()으로 직렬화·이스케이프한 문자열만 받는다.
 */
export default function JsonLd({ html }: { html: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
