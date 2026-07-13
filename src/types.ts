export type BlockType =
  | "hero"
  | "nav"
  | "coupon"
  | "header"
  | "product"
  | "grid"
  | "review"
  | "free"
  | "note";

export interface HeroData {
  imageUrl: string; // 히어로 배너 이미지 (전체 폭)
  title?: string; // (구버전 호환용, 더 이상 편집·표시 안 함)
  period?: string;
}
export interface NavItem {
  label: string;
  target: string; // 이동할 블록 id ("" = 지정 안 함)
}
export interface NavData {
  items: NavItem[];
  auto?: boolean; // true = 섹션의 "내비 노출" 토글로 탭을 자동 구성. 기본 false(수동).
}
export interface CouponItem {
  amount: string; // "최대 3,000원 할인 쿠폰"
  condition: string; // "5만원 이상 구매 시"
  buttonText?: string; // 받기 버튼 문구 (기본 "쿠폰받기")
  link?: string; // 이 쿠폰의 다운로드 링크 (비우면 '한 번에 다운받기' 버튼만 동작)
  bg?: string; // 이 쿠폰 카드의 배경색 (비우면 흰색)
}
export interface CouponData {
  badge: string;
  title: string;
  subtitle: string;
  coupons: CouponItem[];
  downloadText: string; // "한 번에 다운받기"
  downloadLink?: string; // '한 번에 다운받기' 버튼 링크 (쿠폰 전체 받기)
}
// 섹션 구분 헤더 (가운데 큰 제목 + 서브)
export interface HeaderData {
  title: string;
  subtitle: string;
}
export interface ProductData {
  badge: string;
  title: string;
  subtitle: string;
  imageUrl: string; // 누끼/제품 이미지
  imageLabel: string; // 플레이스홀더 라벨
  consumerPrice: string; // "89,000"
  salePrice: string; // "54,900"
  ctaText: string;
  ctaLink: string;
  ctaStyle: "dark" | "outline";
}
export interface GridItem {
  imageUrl: string;
  name: string; // "전용 소모품 / 악세서리 1"
  percent: string; // "48%"
  consumerPrice: string; // "89,000"
  salePrice: string; // "54,900"
  link?: string; // 상품 상세 링크 (붙여넣으면 이 칸이 그 상품으로 연결돼요)
}
export interface GridData {
  title: string; // "함께하면 더 좋은\n소모품 & 악세서리"
  items: GridItem[];
  ctaText: string;
  ctaLink: string;
}
export interface ReviewData {
  badge: string;
  title: string;
  subtitle: string;
  bannerUrl: string;
  bannerLabel: string;
  ctaText: string;
  ctaLink: string;
}

// 자유 섹션: 이미지·글 콘텐츠 블록을 자유롭게 쌓는 범용 섹션
export interface FreeItem {
  type: "image" | "text";
  imageUrl?: string;
  imageLabel?: string;
  text?: string;
}
export interface FreeData {
  badge: string;
  title: string;
  subtitle: string;
  items: FreeItem[];
  ctaText: string;
  ctaLink: string;
  ctaStyle: "dark" | "outline";
}

// 유의사항: 어느 블록에도 속하지 않는 독립 아코디언 섹션
export interface NoteData {
  title: string; // 접힌 상태에 보이는 제목 (기본 "유의사항")
  text: string; // 펼치면 나오는 안내 문구
}

export type BlockData =
  | HeroData
  | NavData
  | CouponData
  | HeaderData
  | ProductData
  | GridData
  | ReviewData
  | FreeData
  | NoteData;

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
  enabled?: boolean; // false = 섹션 끔(미리보기·내보내기에서 제외). 기본 true.
  space?: number; // 섹션 위·아래 추가 여백(px). 기본 0.
  bg?: string; // 섹션 배경색 덮어쓰기(빈 값 = 기본).
  bgImage?: string; // 섹션 배경 이미지(URL 또는 data URL, 빈 값 = 없음).
  fg?: string; // 섹션 글자색 덮어쓰기(빈 값 = 기본 텍스트색). 뱃지·가격·버튼 등 강조색은 유지.
  navShow?: boolean; // true = 내비 자동 구성에서 이 섹션을 탭으로 노출.
  navLabel?: string; // 자동 내비 탭 이름(비면 섹션 라벨 사용).
}

export interface PageDoc {
  title: string;
  blocks: Block[];
}
