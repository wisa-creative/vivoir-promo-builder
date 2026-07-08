// VIVOIR 디자인 토큰 — 25년 프로모션 아카이브 + 26 상반기 결산 기획안에서 추출.
// 이 값들이 모든 블록 렌더링의 단일 원천이다. 편집으로 바뀌지 않는 "잠긴" 브랜드 시스템.

export const tokens = {
  color: {
    // 브랜드 코어 (시안 기준 모노톤 + 포인트)
    navBlue: "#004084", // (레거시)
    accentBlue: "#0C60DF", // pill·링크 강조 파랑
    accentGreen: "#2E7D32", // (레거시)
    orange: "#FF6B2C", // 할인율·쿠폰 조건 강조
    heroBg: "#0B0E14", // 다크 히어로 배경
    page: "#F5F6F8", // 본문 섹션 연회색 배경
    imgBox: "#E9EBEF", // 이미지 플레이스홀더 박스
    ink: "#17181C", // 제목/본문 기본
    inkSub: "#8A8F98", // 서브카피
    muted: "#B0B4BB", // 소비자가(취소선)
    line: "#E7E8EB", // 카드/구분선
    cta: "#14161C", // 다크 버튼
    ctaText: "#FFFFFF",
    white: "#FFFFFF",
  },
  // 섹션 배경 테마 프리셋 (배경색 + 그 위 포인트/텍스트 색)
  themes: {
    ivory: { bg: "#FFF5EE", accent: "#0C60DF", text: "#1A1A1A", name: "아이보리" },
    lime: { bg: "#D4FF9E", accent: "#0C60DF", text: "#1A1A1A", name: "라임" },
    navy: { bg: "#0D1B2A", accent: "#5B9BFF", text: "#FFFFFF", name: "네이비" },
    lightblue: { bg: "#F7FAFF", accent: "#0C60DF", text: "#1A1A1A", name: "라이트블루" },
    gray: { bg: "#E2E2E2", accent: "#0C60DF", text: "#1A1A1A", name: "그레이" },
    white: { bg: "#FFFFFF", accent: "#0C60DF", text: "#1A1A1A", name: "화이트" },
  },
  font: {
    family:
      "'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif",
  },
  layout: {
    maxWidth: 420, // 모바일 우선 — PC에서도 폰 폭 컬럼으로 가운데 정렬
    pad: 20,
  },
} as const;

export type ThemeKey = keyof typeof tokens.themes;
export const themeKeys = Object.keys(tokens.themes) as ThemeKey[];
