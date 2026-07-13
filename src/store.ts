import { create } from "zustand";
import type { Block, BlockType } from "./types";
import { BLOCKS } from "./blocks/registry";

const LS_KEY = "vivoir-promo-doc-v1";

interface State {
  blocks: Block[];
  selectedId: string | null;
  savedAt: number | null; // 마지막 자동저장 시각(ms). null = 아직 저장 안 됨.
  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  moveBlockTo: (id: string, toIndex: number) => void;
  select: (id: string | null) => void;
  updateData: (id: string, patch: Record<string, unknown>) => void;
  setBlockMeta: (
    id: string,
    patch: Partial<Pick<Block, "enabled" | "space" | "bg" | "bgImage" | "navShow" | "navLabel">>,
  ) => void;
  toggleEnabled: (id: string) => void;
  replaceAll: (blocks: Block[]) => void;
  appendBlocks: (blocks: Block[]) => void;
  resetDoc: () => void;
  markSaved: () => void;
}

// 초기 상태: 결산 기획안 구조를 그대로 시드
export function seed(): Block[] {
  return [
    BLOCKS.hero.create(),
    BLOCKS.nav.create(),
    BLOCKS.coupon.create(),
    BLOCKS.header.create(),
    BLOCKS.product.create(),
    BLOCKS.grid.create(),
    BLOCKS.review.create(),
  ];
}

// localStorage에서 초기 문서 불러오기(없거나 깨졌으면 시드)
function loadInitial(): Block[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as { blocks?: Block[] };
    if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length) {
      return parsed.blocks;
    }
  } catch {
    /* 무시하고 시드 */
  }
  return seed();
}

export const useStore = create<State>((set) => ({
  blocks: loadInitial(),
  selectedId: null,
  savedAt: null,
  addBlock: (type) =>
    set((s) => {
      const block = BLOCKS[type].create();
      return { blocks: [...s.blocks, block], selectedId: block.id };
    }),
  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  moveBlockTo: (id, toIndex) =>
    set((s) => {
      const from = s.blocks.findIndex((b) => b.id === id);
      if (from < 0) return s;
      const next = s.blocks.slice();
      const [item] = next.splice(from, 1);
      const to = Math.max(0, Math.min(toIndex, next.length));
      next.splice(to, 0, item);
      return { blocks: next };
    }),
  select: (id) => set({ selectedId: id }),
  updateData: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, data: { ...b.data, ...patch } } : b,
      ),
    })),
  setBlockMeta: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
  toggleEnabled: (id) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, enabled: b.enabled === false } : b,
      ),
    })),
  replaceAll: (blocks) => set({ blocks, selectedId: blocks[0]?.id ?? null }),
  appendBlocks: (blocks) =>
    set((s) => ({ blocks: [...s.blocks, ...blocks], selectedId: blocks[0]?.id ?? s.selectedId })),
  resetDoc: () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* 무시 */
    }
    set({ blocks: seed(), selectedId: null, savedAt: null });
  },
  markSaved: () => set({ savedAt: Date.now() }),
}));

// 문서 저장(디바운스는 App에서 처리)
export function persistDoc(blocks: Block[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ blocks }));
    return true;
  } catch {
    return false;
  }
}
