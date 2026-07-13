import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);

  // 드롭다운을 화면 기준(fixed)으로 띄워 패널 스크롤에 잘리지 않게, 아래 공간이 좁으면 위로 펼쳐요
  const place = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const maxH = 240;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < Math.min(maxH, 160) && spaceAbove > spaceBelow;
    const style: React.CSSProperties = {
      position: "fixed",
      left: r.left,
      width: r.width,
      right: "auto",
      zIndex: 1000,
    };
    if (openUp) {
      style.bottom = window.innerHeight - r.top + gap;
      style.top = "auto";
      style.maxHeight = Math.min(maxH, spaceAbove - gap - 8);
    } else {
      style.top = r.bottom + gap;
      style.maxHeight = Math.min(maxH, spaceBelow - gap - 8);
    }
    setMenuStyle(style);
  }, []);

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

  // 열릴 때 위치 계산 + 스크롤·리사이즈에 맞춰 재배치
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, options.length]);
  useEffect(() => {
    if (!open) return;
    const on = () => place();
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [open, place]);

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
        <div className="cs-list" role="listbox" ref={listRef} style={menuStyle}>
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
