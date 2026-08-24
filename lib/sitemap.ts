// sitemap XML 직렬화 공통 헬퍼.
// 라우트마다 같은 문자열 템플릿을 반복해 두면 스키마를 손볼 때 빠뜨리기 쉽다.

export type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: string;
};

/** XML 텍스트 노드에 들어갈 값 이스케이프 */
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function urlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      ({ loc, lastmod, changefreq, priority }) =>
        `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}${priority ? `\n    <priority>${priority}</priority>` : ""}
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export function sitemapIndexXml(
  entries: { loc: string; lastmod: string }[],
): string {
  const body = entries
    .map(
      ({ loc, lastmod }) =>
        `  <sitemap>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

export const xmlResponse = (xml: string) =>
  new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });

/** DB의 KST 벽시계 문자열(타임존 없음) → sitemap lastmod용 W3C Datetime */
export const toW3CDatetime = (updated: string): string =>
  `${updated.replace(" ", "T").slice(0, 19)}+09:00`;
