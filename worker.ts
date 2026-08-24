// 커스텀 Worker 엔트리 — OpenNext 핸들러 앞단에 Cloudflare Cache API 캐시를 둔다.
//
// 배경: OpenNext-on-Workers 구조에서는 Worker 자체가 오리진이라, 응답에 s-maxage를
// 붙여도 엣지가 앞단에서 캐시해 주지 않는다. 이 사이트의 모든 페이지는
// force-dynamic이라 그대로 두면 요청 하나마다 SSR 렌더 + Supabase 조회가 돌고,
// 그게 전부 Workers CPU 과금으로 잡힌다. 그래서 Worker 안에서 caches.default를
// 직접 match/put 해 히트 시 렌더를 통째로 건너뛴다.
//
// 이 앱은 쿠키·인증·개인화가 전혀 없어 같은 URL이면 모든 방문자에게 같은 HTML이
// 나간다. 그래서 봇/사용자를 구분하지 않고 짧은 TTL로 통째 캐시할 수 있다.
//
// 캐시 계층:
//   1) sitemap*.xml  6시간
//   2) feed.xml      30분
//   3) 그 외 HTML    60초  ← 정답 갱신 지연 상한이 60초라는 뜻
//
// 공통 조건: GET · 200 · Set-Cookie 없음. /_next/ 는 제외(에셋은 Assets 바인딩이
// 자체 캐시한다). Cache API는 커스텀 도메인(존)에서만 동작하고
// workers.dev 프리뷰에서는 조용히 no-op이다.

// `opennextjs-cloudflare build` 산출물. 타입은 open-next-worker.d.ts에 선언해 뒀다.
import handler from "./.open-next/worker.js";
// Durable Object 클래스 등 생성된 worker의 나머지 export를 그대로 통과시킨다.
export * from "./.open-next/worker.js";

const SITEMAP_TTL = 21600; // 6시간
const FEED_TTL = 1800; // 30분
const PAGE_TTL = 60; // 60초 — 정답 신선도 우선

// ── 도메인 이전 ──────────────────────────────────────────────────
// 사이트는 answer.quizbells.com에서 운영한다. 옛 도메인으로 들어온 요청은
// 경로·쿼리를 그대로 달고 301로 넘겨 색인과 링크 가치를 새 주소로 옮긴다.
//
// 여기서 처리하는 이유: Worker 진입 직후라 SSR·Supabase 조회는 물론 아래
// Cache API 조회도 타지 않는다. 리다이렉트 한 건에 붙는 비용이 사실상 없다.
//
// 전제: Cloudflare에서 quizkorea.com이 계속 이 Worker로 라우팅되어야 한다.
// 커스텀 도메인 바인딩을 떼면 이 코드는 실행되지 않는다.
const CANONICAL_HOST = "answer.quizbells.com";
const LEGACY_HOSTS = new Set(["quizkorea.com", "www.quizkorea.com"]);

// 브라우저는 301을 무기한 캐시하기도 한다. 되돌릴 여지를 남겨두려고
// 한 시간으로 끊는다 — 검색엔진이 이전을 인식하는 데는 지장이 없다.
const REDIRECT_CACHE_CONTROL = "public, max-age=3600";

function redirectToCanonical(url: URL): Response {
  const target = new URL(url);
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  target.port = "";

  return new Response(null, {
    status: 301,
    headers: {
      location: target.toString(),
      "cache-control": REDIRECT_CACHE_CONTROL,
    },
  });
}

type CacheDecision = { ttl: number; isFeed: boolean };

/** 요청별 캐시 결정. 캐시 대상이 아니면 null. */
function decide(pathname: string): CacheDecision | null {
  if (pathname.startsWith("/_next/")) return null;

  if (/^\/sitemap(-[a-z0-9-]+)?\.xml$/.test(pathname)) {
    return { ttl: SITEMAP_TTL, isFeed: true };
  }
  if (pathname === "/feed.xml") return { ttl: FEED_TTL, isFeed: true };

  return { ttl: PAGE_TTL, isFeed: false };
}

// HTML HIT 응답이 존 캐시·브라우저에 2차 캐시되지 않도록 강제한다.
// 존이 s-maxage를 보고 브라우저 max-age까지 덧붙이면, 정답이 갱신돼도
// 사용자 브라우저가 낡은 HTML을 몇 시간씩 들고 있게 된다.
const HTML_CLIENT_CACHE_CONTROL = "private, max-age=0, must-revalidate";

type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };
type WorkerHandler = {
  fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response>;
};

const worker = {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const next = () => (handler as WorkerHandler).fetch(request, env, ctx);

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return next();
    }

    // 옛 도메인은 메서드를 가리지 않고 전부 넘긴다.
    if (LEGACY_HOSTS.has(url.hostname)) return redirectToCanonical(url);

    if (request.method !== "GET") return next();

    const decision = decide(url.pathname);
    if (!decision) return next();

    // caches.default는 Workers 런타임 전역. 미지원 환경(로컬 dev 등)은 통과.
    const cache = (globalThis as { caches?: { default?: Cache } }).caches
      ?.default;
    if (!cache) return next();

    // 헤더 없는 정규화된 키 → 쿠키·UA 차이로 캐시가 조각나지 않는다.
    const cacheKey = new Request(url.toString(), { method: "GET" });

    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const res = new Response(hit.body, hit);
        res.headers.set("x-qk-edge-cache", "HIT");
        if (!decision.isFeed) {
          res.headers.set("cache-control", HTML_CLIENT_CACHE_CONTROL);
        }
        return res;
      }
    } catch {
      // Cache API 사용 불가 — 그냥 렌더로 진행
    }

    const res = await next();

    // 성공 응답만, Set-Cookie가 없을 때만 저장한다.
    if (res.status === 200 && !res.headers.has("set-cookie")) {
      try {
        const copy = new Response(res.clone().body, res);
        copy.headers.set("cache-control", `public, s-maxage=${decision.ttl}`);
        // Next가 붙이는 Vary(RSC 등)는 Cache API 저장을 방해할 수 있어 제거한다.
        copy.headers.delete("vary");
        ctx.waitUntil(cache.put(cacheKey, copy));
      } catch {
        // 저장 실패는 무시 — 다음 요청이 다시 렌더하면 된다
      }
    }

    const out = new Response(res.body, res);
    out.headers.set("x-qk-edge-cache", "MISS");
    return out;
  },
};

export default worker;
