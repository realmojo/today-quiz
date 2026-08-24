import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // OpenNext/Cloudflare 빌드 산출물 — 우리가 쓴 코드가 아니다
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
  ]),
  {
    rules: {
      // 내부 이동을 next/link 대신 <a>로 한다.
      //
      // <a>는 클릭할 때마다 전체 페이지를 다시 불러온다. 클라이언트 라우팅의
      // 부드러운 전환은 잃지만, 그 대신 광고·분석 스크립트가 매 이동마다
      // 새로 실행된다. 이 사이트는 광고 수익으로 운영되므로 그쪽을 택했다.
      //
      // 이 규칙은 그 선택을 되돌리라고 계속 경고하므로 끈다.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
