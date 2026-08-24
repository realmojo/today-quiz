// 지원하는 앱테크 퀴즈 앱 레지스트리.
// type      : URL 세그먼트 (/[type]/today) 이자 DB(quizbells_answer.type) 키
// typeKr    : 화면에 노출되는 앱 이름
// title     : 퀴즈 코너 이름
// seoLead   : 검색 사용자가 실제로 입력하는 "연속 구문". 타이틀·H1 선두에 온다.
//             네이버는 붙은 구문 매칭 가중치가 높아 어순이 검색 노출을 좌우한다.
// slotId    : /[type]/today 최상단 AdSense 수동 광고 슬롯.
// image     : 목록·헤더용 앱 아이콘(200px webp). 각 앱의 상표이며,
//             어떤 앱의 퀴즈인지 알리기 위한 목적으로만 표기한다.
// appLink   : 정답 페이지에서 앱을 바로 여는 딥링크 (있는 앱만)

export type QuizItem = {
  type: string;
  typeKr: string;
  title: string;
  seoLead?: string;
  image: string;
  slotId: string;
  searchKeywords: string[];
};

export const quizItems: QuizItem[] = [
  {
    type: "toss",
    typeKr: "토스",
    title: "두근두근 1등찍기 행운퀴즈",
    // 검색량 1위 "두근두근1등찍기"(43k), 2위 "토스 두근두근 1등찍기"(23k)가
    // 연속 구문으로 포함되도록 어순을 "두근두근 1등찍기"가 붙어 오게 배치
    seoLead: "토스 두근두근 1등찍기 행운퀴즈",
    image: "/images/toss_200.webp",
    slotId: "2997462295",
    searchKeywords: [
      "두근두근1등찍기",
      "토스 두근두근 1등찍기",
      "토스 1등찍기",
      "두근두근 1등찍기 오늘 정답",
      "토스 두근두근 1등찍기 오늘",
      "토스 두근두근 1등찍기 오늘 정답",
      "토스 두근두근 1등",
      "토스 행운퀴즈",
      "토스퀴즈",
      "토스두근두근정답",
    ],
  },
  {
    type: "cashwalk",
    typeKr: "캐시워크",
    title: "돈버는퀴즈",
    image: "/images/cashwalk_200.webp",
    slotId: "4602333795",
    searchKeywords: ["캐시워크 돈버는퀴즈 정답", "캐시워크 퀴즈"],
  },
  {
    type: "shinhan",
    typeKr: "신한쏠페이",
    title: "쏠퀴즈, 퀴즈팡팡, 출석퀴즈",
    image: "/images/shinhan_200.webp",
    slotId: "3289252127",
    searchKeywords: ["신한 쏠퀴즈 정답", "신한쏠 퀴즈팡팡", "신한 출석퀴즈"],
  },
  {
    type: "kakaobank",
    typeKr: "카카오뱅크",
    title: "AI 이모지 퀴즈",
    // 검색 1위 "카뱅 ai 퀴즈 정답"(183k), 2위 "카뱅이모지퀴즈"(67k) 모두 "카뱅"으로 시작.
    // typeKr "카카오뱅크"를 H1에 쓰면 실제 검색어와 전혀 매핑되지 않는다.
    seoLead: "카뱅 AI 이모지 퀴즈",
    image: "/images/kakaobank_200.webp",
    slotId: "1976170454",
    searchKeywords: [
      "카뱅이모지퀴즈",
      "카뱅 이모지 퀴즈",
      "카뱅 ai 퀴즈 정답",
      "카뱅AI퀴즈정답",
      "카뱅 이모지 퀴즈 정답",
      "카카오뱅크 ai퀴즈",
      "카카오뱅크 ai 이모지",
      "사물관련이모지",
      "ai사물관련이모지",
      "카카오뱅크 사물관련이모지",
    ],
  },
  {
    type: "nh",
    typeKr: "농협",
    title: "디깅퀴즈",
    image: "/images/nh_200.webp",
    slotId: "9663088787",
    searchKeywords: [
      "디킹퀴즈",
      "디킹퀴즈정답",
      "디킹퀴즈 정답",
      "농협 디깅퀴즈",
      "농협 디킹퀴즈",
    ],
  },
  {
    type: "kakaopay",
    typeKr: "카카오페이",
    title: "퀴즈타임",
    image: "/images/kakaopay_200.webp",
    slotId: "2642239070",
    searchKeywords: [
      "카카오페이 퀴즈",
      "카카오페이 퀴즈타임 정답",
      "카페 퀴즈",
    ],
  },
  {
    type: "bitbunny",
    typeKr: "비트버니",
    title: "퀴즈",
    image: "/images/bitbunny_200.webp",
    slotId: "2947943528",
    searchKeywords: [
      "비트버니 퀴즈 정답",
      "비트버니 퀴즈",
      "비트버니 오늘의 퀴즈",
    ],
  },
  {
    type: "okcashbag",
    typeKr: "오케이캐시백",
    title: "오퀴즈",
    image: "/images/okcashbag_200.webp",
    slotId: "1572699980",
    searchKeywords: [
      "오퀴즈 정답",
      "오케이캐시백 오퀴즈",
      "오케이정답",
      "오퀴즈",
    ],
  },
  {
    type: "cashdoc",
    typeKr: "캐시닥·타임스프레드",
    title: "용돈퀴즈",
    image: "/images/cashdoc_200.webp",
    slotId: "7946536645",
    searchKeywords: ["캐시닥 퀴즈", "타임스프레드 퀴즈"],
  },
  {
    type: "kbstar",
    typeKr: "KB스타 KBPAY",
    title: "도전미션 스타퀴즈, 퀴즈",
    image: "/images/kbstar_200.webp",
    slotId: "4007291633",
    searchKeywords: ["KB스타 퀴즈", "KBPAY 퀴즈", "KB 스타퀴즈 정답"],
  },
  {
    type: "3o3",
    typeKr: "삼쩜삼",
    title: "퀴즈",
    image: "/images/3o3_200.webp",
    slotId: "2881912227",
    searchKeywords: ["삼쩜삼 퀴즈 정답"],
  },
  {
    type: "doctornow",
    typeKr: "닥터나우",
    title: "퀴즈",
    image: "/images/doctornow_200.webp",
    slotId: "8116509722",
    searchKeywords: [
      "닥터나우 퀴즈 정답",
      "닥터나우 오늘의 퀴즈",
      "닥터나우 퀴즈",
    ],
  },
  {
    type: "mydoctor",
    typeKr: "나만의 닥터",
    title: "건강 퀴즈",
    image: "/images/mydoctor_200.webp",
    slotId: "9321780182",
    searchKeywords: [
      "나만의닥터 퀴즈 정답",
      "나만의 닥터 건강퀴즈",
      "나만의닥터 퀴즈",
    ],
  },
  {
    type: "hpoint",
    typeKr: "에이치포인트",
    title: "퀴즈",
    image: "/images/hpoint_200.webp",
    slotId: "9946014023",
    searchKeywords: [
      "에이치포인트 퀴즈 정답",
      "H포인트 퀴즈",
      "H.Point 퀴즈 정답",
    ],
  },
  {
    type: "climate",
    typeKr: "기후행동 기후동행 기회소득",
    title: "퀴즈",
    // 사용자는 "기후동행퀴즈"로 붙여 검색(노출 31만, CTR 4.7%) — 연속 구문을 선두에 배치
    seoLead: "기후동행퀴즈 기후행동 기회소득",
    image: "/images/climate_200.webp",
    slotId: "9471517092",
    searchKeywords: [
      "기후동행퀴즈",
      "기후동행 오늘의퀴즈 정답",
      "오늘기후행동퀴즈정답",
      "기후행동퀴즈",
      "기후동행 퀴즈 정답",
    ],
  },
  {
    type: "skstoa",
    typeKr: "SK 스토아",
    title: "퀴즈타임",
    image: "/images/skstoa_200.webp",
    slotId: "5201099596",
    searchKeywords: [
      "SK스토아 퀴즈 정답",
      "SK스토아 퀴즈타임 정답",
      "에스케이스토아 퀴즈",
    ],
  },
  {
    type: "hanabank",
    typeKr: "하나은행 하나원큐",
    title: "퀴즈하나",
    image: "/images/hanabank_200.webp",
    slotId: "2610449486",
    searchKeywords: ["하나은행 퀴즈", "하나원큐 퀴즈하나 정답"],
  },
  {
    type: "auction",
    typeKr: "옥션",
    title: "매일퀴즈",
    image: "/images/auction_200.webp",
    slotId: "2805890601",
    searchKeywords: ["옥션 매일퀴즈 정답"],
  },
  {
    type: "kbank",
    typeKr: "케이뱅크",
    title: "AI 퀴즈",
    image: "/images/kbank_200.webp",
    slotId: "5256939918",
    searchKeywords: ["케이뱅크 AI퀴즈 정답"],
  },
  {
    type: "monimo",
    typeKr: "모니모",
    title: "모니스쿨 퀴즈",
    image: "/images/monimo_200.webp",
    slotId: "9594660233",
    searchKeywords: [
      "모니스쿨 정답",
      "모니모 모니스쿨",
      "모니모 모니스쿨 정답",
      "모니모스쿨",
      "모니모스쿨 정답",
    ],
  },
  {
    type: "buzzvil",
    typeKr: "버즈빌",
    title: "퀴즈",
    image: "/images/buzzvil_200.webp",
    slotId: "9179727264",
    searchKeywords: ["버즈빌 퀴즈 정답", "버즈빌 오늘의 퀴즈"],
  },
  {
    type: "livemate",
    typeKr: "리브메이트",
    title: "오늘의퀴즈",
    image: "/images/livemate_200.webp",
    slotId: "9130208499",
    searchKeywords: [
      "리브메이트 오늘의퀴즈 정답",
      "리브메이트 퀴즈 정답",
      "리브메이트 일반상식퀴즈",
      "리브메이트 퀴즈",
      "리브메이트 정답",
    ],
  },
  {
    type: "paybooc",
    typeKr: "페이북",
    title: "퀴즈팡",
    image: "/images/paybooc_200.webp",
    slotId: "5490346384",
    searchKeywords: [
      "페이북 퀴즈 정답",
      "페이북 퀴즈팡",
      "페이북 퀴즈팡 정답",
      "비씨카드 페이북 퀴즈",
    ],
  },
  {
    type: "cashslide",
    typeKr: "캐시슬라이드",
    title: "초성퀴즈",
    image: "/images/cashslide_200.webp",
    slotId: "8948772916",
    searchKeywords: [
      "캐시슬라이드 초성퀴즈 정답",
      "캐시슬라이드 초성퀴즈",
      "캐시슬라이드 퀴즈",
      "초성퀴즈 정답",
    ],
  },
  {
    type: "balso",
    typeKr: "발로소득",
    title: "OX퀴즈",
    image: "/images/balso_200.webp",
    slotId: "7635691240",
    searchKeywords: [
      "발로소득 퀴즈 정답",
      "발로소득 OX퀴즈",
      "발로소득 퀴즈",
      "발로소득 오늘의 퀴즈",
    ],
  },
];

export const getQuizItem = (type: string): QuizItem | undefined =>
  quizItems.find((item) => item.type === type);

/** SEO 타이틀·H1 선두 구문. seoLead가 없으면 `${typeKr} ${title}`. */
export const getQuizSeoLead = (item: {
  typeKr: string;
  title: string;
  seoLead?: string;
}) => item.seoLead || `${item.typeKr} ${item.title}`;

/** 정답 페이지에서 "앱 바로 열기" 링크를 제공하는 앱들 */
export const quizAppLinks: Record<string, { label: string; url: string }> = {
  kakaobank: {
    label: "카카오뱅크 앱 열기",
    url: "https://kakaobank.onelink.me/0qMi/jcwk0sbz",
  },
  kakaopay: {
    label: "카카오페이 앱 열기",
    url: "https://link.kakaopay.com/_/fMLguKC",
  },
  shinhan: {
    label: "신한쏠페이 앱 열기",
    url: "https://spa.shinhan.com/app_link.html?pr_id=ACXCZ10010010",
  },
  hanabank: {
    label: "하나원큐 앱 열기",
    url: "https://mbp.hanabank.com/oneqplus.jsp?MENUM/mbp/resource/html/LLFN/LLFN11/LLFN1101001.html",
  },
  hpoint: {
    label: "에이치포인트 앱 열기",
    url: "https://www.h-point.co.kr/cma/invite.nhd?scheme=quizMain",
  },
  kbstar: {
    label: "KB스타 KBPAY 앱 열기",
    url: "https://m.liivmate.com/katsv4/kbpay/share.do?appId=https://m.liivmate.com/katsv4/kbpay/share.do/goEv?F000070",
  },
};
