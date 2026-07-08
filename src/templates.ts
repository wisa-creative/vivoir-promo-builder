import type { Block } from "./types";
import { newId } from "./blocks/registry";

const LS_KEY = "vivoir-promo-templates-v1";

export interface Template {
  id: string;
  name: string;
  kind: "full" | "section"; // 전체 프로모션 / 단일 섹션
  blocks: Block[];
  createdAt: number;
}

export function listTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Template[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: Template[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* 저장 실패 무시 */
  }
}

export function saveTemplate(name: string, kind: "full" | "section", blocks: Block[]): Template {
  const t: Template = {
    id: `t${Date.now().toString(36)}`,
    name: name.trim() || (kind === "full" ? "이름 없는 프로모션" : "이름 없는 섹션"),
    kind,
    blocks: JSON.parse(JSON.stringify(blocks)), // 깊은 복사
    createdAt: Date.now(),
  };
  writeAll([t, ...listTemplates()]);
  return t;
}

export function deleteTemplate(id: string) {
  writeAll(listTemplates().filter((t) => t.id !== id));
}

// 템플릿 블록을 새 id로 복제(현재 문서에 붙여넣을 때 id 충돌 방지)
export function cloneBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: newId() }));
}
