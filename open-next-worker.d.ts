// `opennextjs-cloudflare build`가 만들어내는 워커 번들의 타입 선언.
//
// worker.ts가 이 모듈을 import하는데, 빌드 전에는 파일이 아예 없고 빌드 후에는
// 타입 없는 .js라 어느 쪽이든 tsc가 불평한다. @ts-expect-error로 막으면
// 빌드 전/후에 따라 지시자가 "쓰였다/안 쓰였다"가 뒤집혀 typecheck가 깨지므로,
// 형태를 여기서 한 번 선언해 두고 worker.ts는 지시자 없이 쓴다.
// 와일드카드 앰비언트 선언이라 실제 파일이 없을 때만 적용된다.
// 빌드 후에는 진짜 .js가 우선 해석되므로 어느 상태에서도 typecheck가 통과한다.
declare module "*/.open-next/worker.js" {
  type ExecutionContextLike = { waitUntil(promise: Promise<unknown>): void };

  const handler: {
    fetch(
      request: Request,
      env: unknown,
      ctx: ExecutionContextLike,
    ): Promise<Response>;
  };

  export default handler;
}
