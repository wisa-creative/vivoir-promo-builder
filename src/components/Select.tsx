import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 디자인 가이드에 맞춘 커스텀 드롭다운.
 * 네이티브 <select>의 열린 목록은 OS가 그려서 스타일이 안 먹으므로 직접 만든 컴포넌트예요.
 */
export function Select({
  value,
  options,
  placeholder = "선택",
  onChange,
}: {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);

  // 바깥 클릭 · ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 열릴 때 현재 선택 항목으로 포커스 이동
  useEffect(() => {
    if (open) {
      const i = options.findIndex((o) => o.value === value);
      setActive(i < 0 ? 0 : i);
    }
  }, [open, value, options]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.value);
    }
  }

  return (
    <div className="cs-select" ref={rootRef}>
      <button
        type="button"
        className={"cs-trigger" + (open ? " open" : "")}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={"cs-value" + (current ? "" : " ph")}>
          {current ? current.label : placeholder}
        </span>
        <span className="cs-caret" aria-hidden />
      </button>
      {open && (
        <div className="cs-list" role="listbox" ref={listRef}>
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={
                "cs-option" +
                (o.value === value ? " sel" : "") +
                (i === active ? " active" : "")
              }
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.value);
              }}
            >
              <span className="cs-opt-label">{o.label}</span>
              {o.value === value && <span className="cs-check" aria-hidden />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
