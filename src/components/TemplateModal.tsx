import { useState } from "react";
import { useStore } from "../store";
import { BLOCKS } from "../blocks/registry";
import {
  cloneBlocks,
  deleteTemplate,
  listTemplates,
  saveTemplate,
  type Template,
} from "../templates";

export function TemplateModal({ onClose, flash }: { onClose: () => void; flash: (m: string) => void }) {
  const blocks = useStore((s) => s.blocks);
  const selectedId = useStore((s) => s.selectedId);
  const replaceAll = useStore((s) => s.replaceAll);
  const appendBlocks = useStore((s) => s.appendBlocks);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const [items, setItems] = useState<Template[]>(() => listTemplates());
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<"all" | "full" | "section">("all");

  function refresh() {
    setItems(listTemplates());
  }

  function onSaveFull() {
    saveTemplate(name, "full", blocks);
    setName("");
    refresh();
    flash("전체 프로모션을 템플릿으로 저장했어요");
  }
  function onSaveSection() {
    if (!selected) return;
    saveTemplate(name || BLOCKS[selected.type].label, "section", [selected]);
    setName("");
    refresh();
    flash("현재 섹션을 템플릿으로 저장했어요");
  }
  function onLoad(t: Template) {
    const fresh = cloneBlocks(t.blocks);
    if (t.kind === "full") {
      if (!window.confirm("현재 내용을 이 템플릿으로 바꿀까요?")) return;
      replaceAll(fresh);
      flash("템플릿을 불러왔어요");
    } else {
      appendBlocks(fresh);
      flash("섹션을 추가했어요");
    }
    onClose();
  }
  function onDelete(id: string) {
    deleteTemplate(id);
    refresh();
  }

  const shown = items.filter((t) => filter === "all" || t.kind === filter);

  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <div className="modal tpl-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>템플릿 라이브러리</h3>
          <button className="modal-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="tpl-save">
            <input
              type="text"
              placeholder="템플릿 이름 (예: 여름 시즌 기본형)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="tpl-save-btns">
              <button className="btn btn-outline" onClick={onSaveFull}>
                전체 저장
              </button>
              <button className="btn btn-outline" onClick={onSaveSection} disabled={!selected}>
                {selected ? `현재 섹션 저장 (${BLOCKS[selected.type].label})` : "현재 섹션 저장"}
              </button>
            </div>
          </div>

          <div className="tpl-filter">
            {(["all", "full", "section"] as const).map((f) => (
              <button
                key={f}
                className={"chip-btn" + (filter === f ? " on" : "")}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "전체" : f === "full" ? "프로모션" : "섹션"}
              </button>
            ))}
          </div>

          <div className="tpl-list">
            {shown.length === 0 && (
              <div className="tpl-empty">아직 저장한 템플릿이 없어요. 위에서 저장해 보세요.</div>
            )}
            {shown.map((t) => (
              <div className="tpl-item" key={t.id}>
                <div className="tpl-meta">
                  <span className={"tpl-kind " + t.kind}>
                    {t.kind === "full" ? "프로모션" : "섹션"}
                  </span>
                  <span className="tpl-name">{t.name}</span>
                  <span className="tpl-sub">
                    {t.kind === "full"
                      ? `${t.blocks.length}개 섹션`
                      : BLOCKS[t.blocks[0]?.type]?.label ?? "섹션"}
                  </span>
                </div>
                <div className="tpl-actions">
                  <button className="btn btn-primary sm" onClick={() => onLoad(t)}>
                    {t.kind === "full" ? "불러오기" : "추가"}
                  </button>
                  <button className="tpl-del" title="삭제" onClick={() => onDelete(t.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
