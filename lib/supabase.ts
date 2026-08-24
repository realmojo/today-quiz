import { PostgrestClient } from "@supabase/postgrest-js";

// 이 앱은 Supabase를 서버에서만 읽는다(브라우저에서 직접 호출하는 곳이 없다).
// 그래서 NEXT_PUBLIC_ 접두어 대신 일반 변수를 쓴다 — 중요한 차이가 있다:
//
//   NEXT_PUBLIC_*  → next build 시점에 번들에 리터럴로 박힌다.
//                    Cloudflare Workers Builds에서 "빌드 변수"로 넣어야 하고,
//                    나중에 값을 바꾸려면 재배포해야 한다.
//   일반 변수      → process.env 런타임 조회로 남는다.
//                    Worker의 환경 변수/시크릿만 바꾸면 바로 반영되고,
//                    wrangler.jsonc의 keep_vars가 배포 때 지워지지 않게 지켜준다.
//
// NEXT_PUBLIC_SUPABASE_URL 폴백은 quizbells의 .env를 그대로 복사해 쓰는
// 로컬 개발 편의를 위해 남겨둔다.
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️ Supabase 환경 변수가 없습니다. SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.",
  );
}

// PostgREST(테이블 쿼리/RPC)만 쓰고 auth·realtime·storage는 쓰지 않는다.
// 무거운 @supabase/supabase-js 대신 경량 @supabase/postgrest-js만 번들해
// Worker 크기를 줄인다. 쿼리 API는 동일하다.
export const supabaseAdmin = supabaseServiceKey
  ? new PostgrestClient(`${supabaseUrl}/rest/v1`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      schema: "public",
    })
  : null;
