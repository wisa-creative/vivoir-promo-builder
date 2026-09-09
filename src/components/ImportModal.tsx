import { useState } from "react";
import { useStore } from "../store";
import { BLOCKS } from "../blocks/registry";
import { cloneBlocks } from "../templates";
import type { Block, BlockType } from "../types";

// AI가 준 초안은 보통 코드펜스(```json)·앞뒤 설명·트레일링 콤마·스마트 따옴표가
// 섞여 있어 그대로는 JSON.parse가 실패해요. 순수 JSON만 뽑아내 정리합니다.
function coerceJsonText(input: string): string {
  let t = input.trim();
  // 스마트 따옴표 → 일반 따옴표
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // ```json ... ``` 또는 ``` ... ``` 코드펜스 안쪽만 사용
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // 앞뒤 설명 문장 제거: 첫 여는 괄호부터 마지막 닫는 괄호까지만
  const first = [t.indexOf("["), t.indexOf("{")].filter((i) => i >= 0);
  const start = first.length ? Math.min(...first) : -1;
  const end = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  // 트레일링 콤마 제거: , ] / , }
  t = t.replace(/,(\s*[\]}])/g, "$1");
  return t;
}

// 붙여넣은 JSON을 블록 배열로 파싱·검증. 배열이거나 {blocks:[...]} 형태 모두 허용.
function parseBlocks(text: string): { blocks: Block[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(coerceJsonText(text));
  } catch {
    return { error: "JSON 형식이 아니에요. 중괄호·따옴표가 빠지지 않았는지 확인해요." };
  }
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { blocks?: unknown }).blocks)
      ? (raw as { blocks: unknown[] }).blocks
      : null;
  if (!arr) return { error: "블록 배열을 찾지 못했어요. [ ... ] 또는 { \"blocks\": [ ... ] } 형태여야 해요." };
  if (arr.length === 0) return { error: "블록이 하나도 없어요." };

  const valid: Block[] = [];
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i] as { type?: unknown; data?: unknown };
    if (!b || typeof b !== "object") return { error: `${i + 1}번째 항목이 블록 객체가 아니에요.` };
    if (typeof b.type !== "string" || !(b.type in BLOCKS)) {
      return { error: `${i + 1}번째 블록의 종류(type)가 올바르지 않아요: "${String(b.type)}"` };
    }
    const type = b.type as BlockType;
    // data가 없으면 기본값으로 채워요(부분 입력 허용)
    const base = BLOCKS[type].create();
    const data = b.data && typeof b.data === "object" ? (b.data as Record<string, unknown>) : {};
    valid.push({ ...base, ...(b as object), type, data: { ...base.data, ...data } } as Block);
  }
  return { blocks: valid };
}

export function ImportModal({ onClose, flash }: { onClose: () => void; flash: (m: string) => void }) {
  const replaceAll = useStore((s) => s.replaceAll);
  const appendBlocks = useStore((s) => s.appendBlocks);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [count, setCount] = useState<number | null>(null);

  function check(): Block[] | null {
    const res = parseBlocks(text.trim());
    if ("error" in res) {
      setError(res.error);
      setCount(null);
      return null;
    }
    setError("");
    setCount(res.blocks.length);
    return res.blocks;
  }

  function onReplace() {
    const blocks = check();
    if (!blocks) return;
    if (!window.confirm(`현재 내용을 지우고 ${blocks.length}개 섹션으로 바꿀까요?`)) return;
    replaceAll(cloneBlocks(blocks));
    flash(`${blocks.length}개 섹션을 불러왔어요`);
    onClose();
  }
  function onAppend() {
    const blocks = check();
    if (!blocks) return;
    appendBlocks(cloneBlocks(blocks));
    flash(`${blocks.length}개 섹션을 이어 붙였어요`);
    onClose();
  }

  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <div className="modal tpl-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>JSON으로 가져오기</h3>
          <button className="modal-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="import-help">
            블록 배열(JSON)을 붙여넣으면 페이지를 한 번에 세팅해요. 시안 이미지로 만든 초안을
            여기에 붙여넣어요.
          </p>
          <textarea
            className="import-area"
            placeholder={'[\n  { "type": "hero", "data": { "imageUrl": "" } },\n  { "type": "coupon", "data": { ... } }\n]'}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
            spellCheck={false}
          />
          {error && <div className="import-error">{error}</div>}
          {!error && count !== null && (
            <div className="import-ok">블록 {count}개를 확인했어요. 아래 버튼으로 반영해요.</div>
          )}
          <div className="import-btns">
            <button className="btn btn-outline" onClick={check} disabled={!text.trim()}>
              검사하기
            </button>
            <button className="btn btn-outline" onClick={onAppend} disabled={!text.trim()}>
              이어 붙이기
            </button>
            <button className="btn btn-primary" onClick={onReplace} disabled={!text.trim()}>
              전체 교체
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
