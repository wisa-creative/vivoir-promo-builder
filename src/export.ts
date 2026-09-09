import html2canvas from "html2canvas";
import type { Block } from "./types";
import { renderPageBody } from "./blocks/render";

export function buildExportHtml(blocks: Block[]): string {
  // Cafe24 스마트디자인 편집기는 태그 사이의 줄바꿈·공백을 <br>·<p>&nbsp;</p>로
  // 바꿔 넣어 섹션 간격을 망가뜨려요. 태그와 태그 사이의 공백만 제거해 한 줄로 내보냅니다.
  // (텍스트 안의 줄바꿈 = white-space:pre-line 은 '>...<' 사이가 아니라 건드리지 않아요.)
  return renderPageBody(blocks).replace(/>\s+</g, "><");
}

// 미리보기 결과를 PNG 이미지로 저장. width는 렌더 폭(px).
export async function exportImage(
  blocks: Block[],
  filename = "vivoir-promo.png",
  width = 420,
): Promise<boolean> {
  // 화면 밖에 실제 폭으로 임시 렌더 후 캡처(iframe 밖이라 캡처가 안정적)
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;background:#fff;z-index:-1;`;
  holder.innerHTML = renderPageBody(blocks);
  document.body.appendChild(holder);
  try {
    const canvas = await html2canvas(holder, {
      width,
      windowWidth: width,
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(holder);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadHtml(html: string, filename = "vivoir-promo.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 현재 블록 문서를 JSON 파일로 저장. { blocks: [...] } 형태라 '가져오기'로 그대로 다시 불러올 수 있어요.
export function downloadDocJson(blocks: Block[], filename?: string) {
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const name = filename ?? `vivoir-promo-${stamp}.json`;
  const json = JSON.stringify({ blocks }, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
