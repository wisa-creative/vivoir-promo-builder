import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, persistDoc } from "./store";
import { BLOCKS, blockOrder } from "./blocks/registry";
import { renderPreviewDoc } from "./blocks/render";
import { buildExportHtml, copyToClipboard, downloadHtml, exportImage } from "./export";
import { Inspector } from "./components/Inspector";
import { TemplateModal } from "./components/TemplateModal";
import { ImportModal } from "./components/ImportModal";

interface EditMsg {
  __promoEdit?: true;
  __promoScroll?: number;
  __promoSelect?: true;
  id?: string;
  field?: string;
  value?: string;
  index?: number;
  subfield?: string;
}

const MIN_W = 320;
const MAX_W = 1200;

export function App() {
  const blocks = useStore((s) => s.blocks);
  const selectedId = useStore((s) => s.selectedId);
  const savedAt = useStore((s) => s.savedAt);
  const { addBlock, removeBlock, moveBlockTo, select, toggleEnabled, resetDoc, markSaved, setBlockMeta } =
    useStore();

  function startRename(id: string, current: string) {
    setRenamingId(id);
    setRenameText(current);
  }
  function commitRename() {
    if (renamingId) {
      const v = renameText.trim();
      setBlockMeta(renamingId, { name: v || undefined });
    }
    setRenamingId(null);
  }
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [pvW, setPvW] = useState(430); // 프리뷰 폭(px)
  const [resizing, setResizing] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const resizeRef = useRef<{ startX: number; startW: number; dir: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 왼쪽 목록에서 블록을 고르면 미리보기도 그 섹션으로 부드럽게 내려가요
  function selectAndScroll(id: string) {
    select(id);
    iframeRef.current?.contentWindow?.postMessage({ __promoScrollTo: id }, "*");
  }

  // 프리뷰 iframe에서 오는 메시지 수신: 인라인 편집 · 스크롤 · 블록선택
  useEffect(() => {
    function onMessage(e: MessageEvent<EditMsg>) {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (typeof d.__promoScroll === "number") {
        scrollRef.current = d.__promoScroll;
        return;
      }
      if (d.__promoSelect && d.id) {
        select(d.id);
        return;
      }
      if (!d.__promoEdit || !d.id || !d.field) return;
      const { updateData } = useStore.getState();
      const blk = useStore.getState().blocks.find((b) => b.id === d.id);
      if (!blk) return;
      const value = d.value ?? "";
      const field = d.field;
      if (d.index !== undefined) {
        // 배열 필드 (nav items, coupons, grid items …)
        const src = (blk.data as unknown as Record<string, unknown>)[field];
        const arr = Array.isArray(src) ? src.slice() : [];
        if (d.subfield) {
          arr[d.index] = { ...(arr[d.index] as object), [d.subfield]: value };
        } else {
          arr[d.index] = value;
        }
        updateData(d.id, { [field]: arr });
      } else {
        updateData(d.id, { [field]: value });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [select]);

  // 프리뷰 폭 마우스 드래그 리사이즈
  useEffect(() => {
    function move(e: PointerEvent) {
      const st = resizeRef.current;
      if (!st) return;
      const next = st.startW + (e.clientX - st.startX) * 2 * st.dir; // 가운데 정렬이라 양쪽 동시 증감
      setPvW(Math.max(MIN_W, Math.min(MAX_W, Math.round(next))));
    }
    function up() {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      setResizing(false);
      document.body.style.cursor = "";
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // 자동 저장: 바뀌면 바로바로 localStorage에 저장하고, 혹시 놓칠까 봐 창을 닫기 전에도 한 번 더 저장해요
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return; // 초기 로드는 저장 스킵
    }
    const t = window.setTimeout(() => {
      if (persistDoc(useStore.getState().blocks)) markSaved();
    }, 150);
    return () => window.clearTimeout(t);
  }, [blocks, markSaved]);

  // 창을 닫거나 새로고침하기 직전에도 마지막 상태를 확실히 저장
  useEffect(() => {
    function flush() {
      persistDoc(useStore.getState().blocks);
    }
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  // 상단 '더보기' 메뉴 바깥을 누르면 닫기
  useEffect(() => {
    if (!moreOpen) return;
    function onDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const doc = useMemo(
    () => renderPreviewDoc(blocks, { edit: true, scrollY: scrollRef.current }),
    [blocks],
  );
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }

  async function onCopy() {
    const html = buildExportHtml(blocks);
    const ok = await copyToClipboard(html);
    flash(ok ? "HTML을 클립보드에 복사했어요" : "복사하지 못했어요 — 내보내기를 눌러주세요");
  }

  function onReset() {
    if (window.confirm("모든 섹션을 처음 상태로 되돌릴까요? 저장된 내용이 사라져요.")) {
      resetDoc();
      flash("처음 상태로 되돌렸어요");
    }
  }

  async function onExportImage() {
    setExporting(true);
    flash("이미지를 만들고 있어요…");
    const ok = await exportImage(blocks, "vivoir-promo.png", Math.round(pvW));
    setExporting(false);
    flash(ok ? "미리보기를 이미지로 저장했어요" : "이미지를 만들지 못했어요");
  }

  const savedLabel = savedAt
    ? `저장됨 ${new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
    : "자동 저장돼요";

  function onDrop(targetId: string) {
    if (dragId && dragId !== targetId) {
      // 드래그 중인 블록을 뺀 배열 기준으로 넣을 위치를 계산해요
      const rest = blocks.filter((x) => x.id !== dragId);
      const targetPos = rest.findIndex((x) => x.id === targetId);
      const insertAt = overPos === "after" ? targetPos + 1 : targetPos;
      moveBlockTo(dragId, insertAt);
    }
    setDragId(null);
    setOverId(null);
  }

  const device = pvW <= 480 ? "mobile" : "pc";

  return (
    <div className="app">
      <header className="topbar">
        <div className="lockup">
          <span className="logo-mark">V</span>
          <span className="brand">
            VIVOIR <span>프로모션 빌더</span>
          </span>
        </div>
        <div className="top-actions">
          <span className="save-ind" title="변경하면 자동으로 저장돼요">
            <span className="save-dot" /> {savedLabel}
          </span>
          <div className="more-wrap" ref={moreRef}>
            <button
              className={"btn btn-outline btn-icon" + (moreOpen ? " on" : "")}
              onClick={() => setMoreOpen((o) => !o)}
              title="더보기"
              aria-label="더보기"
            >
              ⋯
            </button>
            {moreOpen && (
              <div className="more-menu">
                <button onClick={() => { setTplOpen(true); setMoreOpen(false); }}>
                  템플릿 저장·불러오기
                </button>
                <button onClick={() => { setImportOpen(true); setMoreOpen(false); }}>
                  블록 JSON 가져오기
                </button>
                <button
                  disabled={exporting}
                  onClick={() => { onExportImage(); setMoreOpen(false); }}
                >
                  {exporting ? "이미지 만드는 중…" : "이미지로 저장"}
                </button>
                <div className="more-sep" />
                <button
                  className="danger"
                  onClick={() => { onReset(); setMoreOpen(false); }}
                >
                  처음 상태로 되돌리기
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-outline" onClick={onCopy} title="내보내기용 HTML을 클립보드에 복사">
            HTML 복사
          </button>
          <button
            className="btn btn-primary"
            onClick={() => downloadHtml(buildExportHtml(blocks))}
          >
            Cafe24로 내보내기
          </button>
          <button
            className="theme-toggle"
            title={dark ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기"}
            onClick={toggleTheme}
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <div className="workspace">
        {/* 좌: 블록 패널 */}
        <aside className="panel left">
          <div className="panel-title">블록 · 드래그로 순서 바꾸기</div>
          <div className="block-list">
            {blocks.map((b) => (
              <div
                key={b.id}
                className={
                  "block-item" +
                  (b.id === selectedId ? " sel" : "") +
                  (b.id === dragId ? " dragging" : "") +
                  (b.enabled === false ? " off" : "") +
                  (b.id === overId && dragId && dragId !== b.id
                    ? overPos === "after"
                      ? " drop-after"
                      : " drop-before"
                    : "")
                }
                draggable={renamingId !== b.id}
                onDragStart={(e) => {
                  setDragId(b.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const r = e.currentTarget.getBoundingClientRect();
                  const pos = e.clientY < r.top + r.height / 2 ? "before" : "after";
                  if (overId !== b.id) setOverId(b.id);
                  if (overPos !== pos) setOverPos(pos);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(b.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onClick={() => selectAndScroll(b.id)}
              >
                <span className="grip" title="드래그해서 옮기기">⠿</span>
                {renamingId === b.id ? (
                  <input
                    className="name-edit"
                    value={renameText}
                    autoFocus
                    onChange={(e) => setRenameText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span
                    className="name"
                    title="더블클릭해서 이름 바꾸기"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(b.id, b.name || BLOCKS[b.type].label);
                    }}
                  >
                    {b.name || BLOCKS[b.type].label}
                  </span>
                )}
                <button
                  className={"row-ic vis" + (b.enabled !== false ? "" : " off")}
                  title={b.enabled !== false ? "섹션 숨기기" : "섹션 보이기"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEnabled(b.id);
                  }}
                >
                  {b.enabled !== false ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.44M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
                      <path d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
                <button
                  className="row-ic del"
                  title="블록 지우기"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(b.id);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="panel-title">블록 추가</div>
          <div className="add-grid">
            {blockOrder.map((t) => (
              <button key={t} className="add-btn" onClick={() => addBlock(t)}>
                <span className="add-btn-ic" style={{ color: BLOCKS[t].accent }}>{BLOCKS[t].icon}</span>
                {BLOCKS[t].label}
              </button>
            ))}
          </div>
        </aside>

        {/* 중: 프리뷰 (본문 문구는 여기서 바로 클릭해 고칠 수 있어요) */}
        <main className="preview-wrap">
          <div className="preview-toolbar">
            <div className="device-seg">
              <button
                className={"device-btn" + (device === "pc" ? " on" : "")}
                onClick={() => setPvW(1024)}
                title="PC 폭으로 보기"
              >
                PC
              </button>
              <button
                className={"device-btn" + (device === "mobile" ? " on" : "")}
                onClick={() => setPvW(390)}
                title="모바일 폭으로 보기"
              >
                모바일
              </button>
            </div>
            <span className="pv-size">{pvW}px · 가장자리를 드래그해 폭 조절</span>
          </div>
          <div className="preview-stage">
            <div className="preview-frame" style={{ width: pvW, maxWidth: "none" }}>
              <iframe
                ref={iframeRef}
                title="preview"
                srcDoc={doc}
                style={{ pointerEvents: resizing ? "none" : "auto" }}
              />
              <span
                className="resize-handle left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  resizeRef.current = { startX: e.clientX, startW: pvW, dir: -1 };
                  setResizing(true);
                  document.body.style.cursor = "ew-resize";
                }}
                title="드래그해서 폭 조절"
              />
              <span
                className="resize-handle right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  resizeRef.current = { startX: e.clientX, startW: pvW, dir: 1 };
                  setResizing(true);
                  document.body.style.cursor = "ew-resize";
                }}
                title="드래그해서 폭 조절"
              />
            </div>
          </div>
        </main>

        {/* 우: 인스펙터 */}
        <aside className="panel right">
          {selected ? (
            <Inspector key={selected.id} block={selected} />
          ) : (
            <div className="empty">가운데 화면에서 문구를 바로 고치거나,
              <br />왼쪽에서 블록을 골라 편집할 수 있어요.</div>
          )}
        </aside>
      </div>

      {tplOpen && <TemplateModal onClose={() => setTplOpen(false)} flash={flash} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} flash={flash} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
