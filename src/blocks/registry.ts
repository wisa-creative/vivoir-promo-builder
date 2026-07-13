import type { Block, BlockType } from "../types";

let counter = 0;
export const newId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

export type FieldKind = "text" | "textarea" | "image" | "cta-style" | "color";
export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  group?: string; // 인스펙터 아코디언 묶음 이름 (없으면 "내용")
}

export interface BlockMeta {
  type: BlockType;
  label: string;
  icon: string;
  accent: string; // 인스펙터 섹션 헤더 색 (에디터 크롬용)
  code: string; // 섹션 코드 접두어 (COUPON·PRODUCT …)
  fields: Field[]; // 스칼라 필드 (list류는 Inspector에서 특수 처리)
  create: () => Block;
}

export const BLOCKS: Record<BlockType, BlockMeta> = {
  hero: {
    type: "hero",
    label: "히어로",
    icon: "◆",
    accent: "#1f2937",
    code: "HERO",
    fields: [
      { key: "imageUrl", label: "배너 이미지", kind: "image", group: "배너 이미지" },
    ],
    create: () => ({
      id: newId(),
      type: "hero",
      data: { imageUrl: "" },
    }),
  },
  nav: {
    type: "nav",
    label: "탭 내비",
    icon: "≡",
    accent: "#6b7280",
    code: "NAV",
    fields: [], // items는 Inspector에서 리스트로 편집
    create: () => ({
      id: newId(),
      type: "nav",
      data: {
        items: [
          { label: "결산 쿠폰팩", target: "" },
          { label: "NEW 딥슬립", target: "" },
          { label: "상반기 1위템", target: "" },
          { label: "꿀조합 세트", target: "" },
          { label: "상반기 결산", target: "" },
        ],
      },
    }),
  },
  coupon: {
    type: "coupon",
    label: "쿠폰팩",
    icon: "▤",
    accent: "#d6173a",
    code: "COUPON",
    fields: [
      { key: "badge", label: "뱃지", kind: "text", placeholder: "결산 쿠폰", group: "타이틀 / 문구" },
      { key: "title", label: "헤드라인", kind: "textarea", placeholder: "역대급 장바구니 쿠폰팩", group: "타이틀 / 문구" },
      { key: "subtitle", label: "서브카피", kind: "textarea", group: "타이틀 / 문구" },
      { key: "downloadText", label: "다운로드 버튼", kind: "text", placeholder: "한 번에 다운받기", group: "다운로드 버튼" },
      { key: "downloadLink", label: "다운로드 버튼 링크", kind: "text", placeholder: "https://… (쿠폰 전체 받기)", group: "다운로드 버튼" },
      { key: "downloadBg", label: "버튼 색상", kind: "color", group: "다운로드 버튼" },
      { key: "downloadFg", label: "버튼 글씨색", kind: "color", group: "다운로드 버튼" },
    ],
    create: () => ({
      id: newId(),
      type: "coupon",
      data: {
        badge: "결산 쿠폰",
        title: "역대급 장바구니 쿠폰팩",
        subtitle:
          "상반기 결산 기간 한정! 최대 33,000원 장바구니 할인 혜택을 놓치지 마세요.",
        coupons: [
          { amount: "최대 3,000원 할인 쿠폰", condition: "5만원 이상 구매 시", buttonText: "쿠폰받기", link: "" },
          { amount: "최대 10,000원 할인 쿠폰", condition: "12만원 이상 구매 시", buttonText: "쿠폰받기", link: "" },
          { amount: "최대 18,000원 할인 쿠폰", condition: "20만원 이상 구매 시", buttonText: "쿠폰받기", link: "" },
          { amount: "최대 33,000원 할인 쿠폰", condition: "30만원 이상 구매 시", buttonText: "쿠폰받기", link: "" },
        ],
        downloadText: "한 번에 다운받기",
        downloadLink: "",
      },
    }),
  },
  header: {
    type: "header",
    label: "섹션 헤더",
    icon: "—",
    accent: "#0f52ba",
    code: "HEADER",
    fields: [
      { key: "title", label: "헤드라인", kind: "textarea", placeholder: "역대급 할인율!\n꿀조합 세트", group: "문구" },
      { key: "subtitle", label: "서브카피", kind: "textarea", group: "문구" },
    ],
    create: () => ({
      id: newId(),
      type: "header",
      data: {
        title: "역대급 할인율!\n꿀조합 세트",
        subtitle: "따로 사면 무조건 손해!\n가장 사랑받은 조합을 할인가에",
      },
    }),
  },
  product: {
    type: "product",
    label: "제품 오퍼",
    icon: "■",
    accent: "#2e7d32",
    code: "PRODUCT",
    fields: [
      { key: "badge", label: "뱃지", kind: "text", placeholder: "NEW LAUNCH", group: "타이틀 / 문구" },
      { key: "title", label: "헤드라인", kind: "textarea", placeholder: "마사지 베개 1위", group: "타이틀 / 문구" },
      { key: "subtitle", label: "서브카피", kind: "textarea", group: "타이틀 / 문구" },
      { key: "imageUrl", label: "제품 이미지", kind: "image", group: "이미지" },
      { key: "imageLabel", label: "이미지 라벨", kind: "text", placeholder: "딥슬립 마사지 베개", group: "이미지" },
      { key: "consumerPrice", label: "소비자가", kind: "text", placeholder: "89,000", group: "가격" },
      { key: "salePrice", label: "할인가", kind: "text", placeholder: "54,900", group: "가격" },
      { key: "ctaText", label: "버튼 문구", kind: "text", placeholder: "바로 구매하기", group: "버튼" },
      { key: "ctaLink", label: "버튼 링크", kind: "text", placeholder: "https://...", group: "버튼" },
      { key: "ctaStyle", label: "버튼 스타일", kind: "cta-style", group: "버튼" },
    ],
    create: () => ({
      id: newId(),
      type: "product",
      data: {
        badge: "NEW LAUNCH",
        title: "마사지 베개 1위 '수면루틴'의\n완벽한 진화",
        subtitle: "오직 공식몰에서만! 역대급 리뉴얼 출시 기념 단독 런칭 특가",
        imageUrl: "",
        imageLabel: "딥슬립 마사지 베개",
        consumerPrice: "89,000",
        salePrice: "54,900",
        ctaText: "바로 구매하기",
        ctaLink: "#",
        ctaStyle: "dark",
      },
    }),
  },
  grid: {
    type: "grid",
    label: "모듈",
    icon: "▦",
    accent: "#7c3aed",
    code: "MODULE",
    fields: [
      { key: "title", label: "섹션 제목", kind: "textarea", placeholder: "함께하면 더 좋은\n소모품 & 악세서리", group: "타이틀" },
      { key: "ctaText", label: "버튼 문구", kind: "text", placeholder: "바로 구매하기", group: "버튼" },
      { key: "ctaLink", label: "버튼 링크", kind: "text", placeholder: "https://...", group: "버튼" },
      { key: "ctaStyle", label: "버튼 스타일", kind: "cta-style", group: "버튼" },
    ],
    create: () => ({
      id: newId(),
      type: "grid",
      data: {
        title: "함께하면 더 좋은\n소모품 & 악세서리",
        items: [
          { imageUrl: "", name: "전용 소모품 / 악세서리 1", percent: "48%", consumerPrice: "89,000", salePrice: "54,900", link: "" },
          { imageUrl: "", name: "전용 소모품 / 악세서리 2", percent: "48%", consumerPrice: "89,000", salePrice: "54,900", link: "" },
          { imageUrl: "", name: "전용 소모품 / 악세서리 3", percent: "48%", consumerPrice: "89,000", salePrice: "54,900", link: "" },
          { imageUrl: "", name: "전용 소모품 / 악세서리 4", percent: "48%", consumerPrice: "89,000", salePrice: "54,900", link: "" },
        ],
        ctaText: "바로 구매하기",
        ctaLink: "#",
        ctaStyle: "outline",
      },
    }),
  },
  review: {
    type: "review",
    label: "리뷰 혜택",
    icon: "★",
    accent: "#d97706",
    code: "REVIEW",
    fields: [
      { key: "badge", label: "뱃지", kind: "text", placeholder: "상반기 결산 특별혜택", group: "타이틀 / 문구" },
      { key: "title", label: "헤드라인", kind: "textarea", placeholder: "전 고객 5,000P 감사 적립금", group: "타이틀 / 문구" },
      { key: "subtitle", label: "서브카피", kind: "textarea", group: "타이틀 / 문구" },
      { key: "bannerUrl", label: "배너 이미지", kind: "image", group: "이미지" },
      { key: "bannerLabel", label: "배너 라벨", kind: "text", placeholder: "이벤트 배너", group: "이미지" },
      { key: "ctaText", label: "버튼 문구", kind: "text", placeholder: "리뷰 참여하기", group: "버튼" },
      { key: "ctaLink", label: "버튼 링크", kind: "text", group: "버튼" },
      { key: "ctaStyle", label: "버튼 스타일", kind: "cta-style", group: "버튼" },
    ],
    create: () => ({
      id: newId(),
      type: "review",
      data: {
        badge: "상반기 결산 특별혜택",
        title: "전 고객 5,000P 감사 적립금",
        subtitle:
          "사진 혹은 동영상 후기를 남겨주시는\n모든 고객님께 적립금 5,000원을 드려요!",
        bannerUrl: "",
        bannerLabel: "이벤트 배너",
        ctaText: "리뷰 참여하기",
        ctaLink: "#",
        ctaStyle: "dark",
      },
    }),
  },
  free: {
    type: "free",
    label: "자유 섹션",
    icon: "✦",
    accent: "#0891b2",
    code: "FREE",
    fields: [
      { key: "badge", label: "뱃지", kind: "text", placeholder: "예: 이벤트 안내", group: "기본 정보" },
      { key: "title", label: "헤드라인", kind: "textarea", placeholder: "자유롭게 제목을 적어요", group: "타이틀 / 서브 문구" },
      { key: "subtitle", label: "서브카피", kind: "textarea", group: "타이틀 / 서브 문구" },
      { key: "ctaText", label: "버튼 문구", kind: "text", placeholder: "자세히 보기 (비우면 숨김)", group: "버튼 CTA" },
      { key: "ctaLink", label: "버튼 링크", kind: "text", placeholder: "https://...", group: "버튼 CTA" },
      { key: "ctaStyle", label: "버튼 스타일", kind: "cta-style", group: "버튼 CTA" },
    ],
    create: () => ({
      id: newId(),
      type: "free",
      data: {
        badge: "",
        title: "자유 섹션 제목",
        subtitle: "이미지와 글을 자유롭게 쌓아 원하는 구성을 만들어요.",
        items: [
          { type: "image", imageUrl: "", imageLabel: "이미지를 끌어다 놓으세요" },
          { type: "text", text: "여기에 원하는 설명을 적어요.\n줄바꿈도 그대로 반영돼요." },
        ],
        ctaText: "",
        ctaLink: "#",
        ctaStyle: "dark",
      },
    }),
  },
  note: {
    type: "note",
    label: "유의사항",
    icon: "⌄",
    accent: "#6b7280",
    code: "NOTE",
    fields: [
      { key: "title", label: "제목(접힌 상태)", kind: "text", placeholder: "유의사항", group: "문구" },
      { key: "text", label: "안내 문구", kind: "textarea", placeholder: "· 안내할 내용을 적어요.", group: "문구" },
    ],
    create: () => ({
      id: newId(),
      type: "note",
      data: {
        title: "유의사항",
        text: "· 쿠폰 유효기간 내 사용분에 한해 적용됩니다.\n· 일부 상품 및 행사 상품은 적용 대상에서 제외됩니다.",
      },
    }),
  },
};

export const blockOrder: BlockType[] = [
  "hero",
  "nav",
  "coupon",
  "header",
  "product",
  "grid",
  "review",
  "free",
  "note",
];
