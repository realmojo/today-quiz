import { SITE_URL } from "@/lib/site"

// Sitemap 줄에 절대 URL이 들어가므로 SITE_URL과 함께 움직여야 한다.
// public/robots.txt로 두면 도메인이 바뀔 때 손으로 고쳐야 한다.
export const dynamic = "force-static"

const BOTS = [
  // AI 크롤러 명시적 허용 (인용 노출을 노린다)
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  // 네이버
  "Yeti",
]

export async function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    ...BOTS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n")

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
