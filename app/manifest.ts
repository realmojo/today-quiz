import type { MetadataRoute } from "next"

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

/**
 * 웹 앱 매니페스트.
 *
 * 홈 화면에 추가했을 때 쓰이는 아이콘·이름을 담는다. 파비콘 자체는
 * app/favicon.ico와 app/icon.svg가 담당하고, 여기서는 큰 크기(192·512)만
 * 다룬다 — 안드로이드 런처와 스플래시가 요구하는 크기다.
 *
 * maskable을 따로 두지 않는다. 아이콘이 이미 라운드 사각형을 꽉 채우는
 * 형태라 런처가 어떤 모양으로 잘라도 Q가 잘리지 않는다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - 앱테크 퀴즈 정답 모음`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "ko",
    // globals.css의 --background / --primary 를 sRGB로 옮긴 값
    background_color: "#F5F7FB",
    theme_color: "#2875E8",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
