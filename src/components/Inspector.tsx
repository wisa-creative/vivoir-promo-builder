import { Fragment, useRef, useState } from "react";
import { useStore } from "../store";
import { BLOCKS, type Field } from "../blocks/registry";
import { Select } from "./Select";
import type {
  Block,
  CouponData,
  CouponItem,
  FreeData,
  FreeItem,
  GridData,
  GridItem,
  NavData,
  NavItem,
} from "../types";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// 드래그&드롭 + 버튼 + URL 붙여넣기를 모두 지원하는 이미지 업로더
function ImageUploader({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!value.trim();
  const isData = value.startsWith("data:");
  const takeFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onChange(await readFileAsDataUrl(file));
  };
  return (
    <div className="img-up">
      <div
        className={"img-drop" + (over ? " over" : "") + (has ? " has" : "")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          takeFile(e.dataTransfer.files);
        }}
      >
        {has ? (
          <>
            <img src={value} alt="" />
            <button
              className="img-clear"
              title="이미지 지우기"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <span className="img-drop-hint">
            이미지를 끌어다 놓거나
            <br />
            눌러서 올려요
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => takeFile(e.target.files)}
      />
      <input
        type="text"
        className="img-up-url"
        placeholder={isData ? "업로드한 이미지를 쓰는 중" : "또는 이미지 URL 붙여넣기"}
        value={isData ? "" : value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <div className="img-up-hint">{hint}</div>}
    </div>
  );
}

// 접었다 펼치는 설정 묶음
function Group({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"insp-group" + (open ? " open" : "")}>
      <button className="insp-group-head" onClick={() => setOpen((o) => !o)}>
        <span className="insp-group-title">{title}</span>
        {meta && <span className="insp-group-meta">{meta}</span>}
        <span className="insp-group-caret" aria-hidden />
      </button>
      {open && <div className="insp-group-body">{children}</div>}
    </div>
  );
}

// 스칼라 필드 하나 렌더
// 색상 한 줄(칩 + 텍스트 + 지우기). 여러 곳에서 재사용해요.
function ColorField({
  label,
  value,
  dft,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  dft: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const shown = value.trim() || dft;
  return (
    <label className="field field-color">
      <span>{label}</span>
      <div className="color-row">
        <input
          type="color"
          className="color-chip"
          value={/^#[0-9a-fA-F]{6}$/.test(shown) ? shown : dft}
          onChange={(e) => onChange(e.target.value)}
        />
        <input type="text" value={shown} onChange={(e) => onChange(e.target.value)} />
        {value.trim() && (
          <button className="mini-clear" title="기본값으로" onClick={onClear}>
            ✕
          </button>
        )}
      </div>
    </label>
  );
}

function FieldRow({ block, f }: { block: Block; f: Field }) {
  const update = useStore((s) => s.updateData);
  const data = block.data as unknown as Record<string, unknown>;
  const val = (data[f.key] as string) ?? "";

  if (f.kind === "textarea") {
    return (
      <label className="field">
        <span>{f.label}</span>
        <textarea
          rows={3}
          value={val}
          placeholder={f.placeholder}
          onChange={(e) => update(block.id, { [f.key]: e.target.value })}
        />
      </label>
    );
  }
  if (f.kind === "cta-style") {
    const show = data.ctaShow !== false; // 기본 노출
    const style = (data.ctaStyle as string) || "dark";
    const ctaBg = (data.ctaBg as string) ?? "";
    const ctaFg = (data.ctaFg as string) ?? "";
    return (
      <>
        <div className="field-row-inline">
          <span className="field-inline-label">버튼 노출</span>
          <button
            className={"onoff" + (show ? " on" : "")}
            onClick={() => update(block.id, { ctaShow: !show })}
          >
            <span className="onoff-knob" />
            <span className="onoff-text">{show ? "ON" : "OFF"}</span>
          </button>
        </div>
        {show && (
          <>
            <label className="field">
              <span>{f.label}</span>
              <div className="seg">
                {(["dark", "outline"] as const).map((opt) => (
                  <button
                    key={opt}
                    className={"seg-btn" + (style === opt ? " on" : "")}
                    onClick={() => update(block.id, { ctaStyle: opt })}
                  >
                    {opt === "dark" ? "채움(다크)" : "외곽선"}
                  </button>
                ))}
              </div>
            </label>
            <ColorField
              label={style === "outline" ? "버튼 선/글씨 색" : "버튼 색상"}
              value={ctaBg}
              dft={style === "outline" ? "#14161C" : "#14161C"}
              onChange={(v) => update(block.id, { ctaBg: v })}
              onClear={() => update(block.id, { ctaBg: "" })}
            />
            <ColorField
              label="버튼 글씨색"
              value={ctaFg}
              dft={style === "outline" ? "#14161C" : "#ffffff"}
              onChange={(v) => update(block.id, { ctaFg: v })}
              onClear={() => update(block.id, { ctaFg: "" })}
            />
          </>
        )}
      </>
    );
  }
  if (f.kind === "image") {
    return (
      <label className="field">
        <span>{f.label}</span>
        <ImageUploader
          value={val}
          onChange={(url) => update(block.id, { [f.key]: url })}
          hint={f.hint}
        />
      </label>
    );
  }
  if (f.kind === "color") {
    // 글씨색 계열(fg)은 검은색, 그 외(배경 등)는 흰색을 기본으로 보여줘요.
    const dft = f.key.toLowerCase().includes("fg") ? "#000000" : "#ffffff";
    const shown = val.trim() || dft;
    return (
      <label className="field field-color">
        <span>{f.label}</span>
        <div className="color-row">
          <input
            type="color"
            className="color-chip"
            value={/^#[0-9a-fA-F]{6}$/.test(shown) ? shown : dft}
            onChange={(e) => update(block.id, { [f.key]: e.target.value })}
          />
          <input
            type="text"
            value={shown}
            onChange={(e) => update(block.id, { [f.key]: e.target.value })}
          />
          {val.trim() && (
            <button
              className="mini-clear"
              title="기본값으로"
              onClick={() => update(block.id, { [f.key]: "" })}
            >
              ✕
            </button>
          )}
        </div>
      </label>
    );
  }
  return (
    <label className="field">
      <span>{f.label}</span>
      <input
        type="text"
        value={val}
        placeholder={f.placeholder}
        onChange={(e) => update(block.id, { [f.key]: e.target.value })}
      />
    </label>
  );
}

const SPACE_OPTS = [
  { value: "-16", label: "좁게" },
  { value: "0", label: "기본" },
  { value: "24", label: "넓게" },
  { value: "48", label: "아주 넓게" },
];

export function Inspector({ block }: { block: Block }) {
  const meta = BLOCKS[block.type];
  const setBlockMeta = useStore((s) => s.setBlockMeta);
  const enabled = block.enabled !== false;
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState("");

  function startEditName() {
    setNameText(block.name || meta.label);
    setEditingName(true);
  }
  function commitName() {
    const v = nameText.trim();
    setBlockMeta(block.id, { name: v || undefined });
    setEditingName(false);
  }

  // 필드를 group 기준으로 묶기(순서 유지)
  const groups: { name: string; fields: Field[] }[] = [];
  for (const f of meta.fields) {
    const name = f.group ?? "내용";
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, fields: [] };
      groups.push(g);
    }
    g.fields.push(f);
  }

  const idx = useStore((s) => s.blocks.findIndex((b) => b.id === block.id));

  // 리스트 편집 그룹(쿠폰 카드·그리드 상품·콘텐츠 블록·탭 항목)을 어느 일반 그룹 바로 뒤에 끼울지
  const listAnchor: Partial<Record<Block["type"], string>> = {
    coupon: "타이틀 / 문구",
    grid: "타이틀",
    free: "타이틀 / 서브 문구",
  };
  const listEditor =
    block.type === "nav" ? (
      <Group title="탭 항목" defaultOpen>
        <NavEditor block={block} />
      </Group>
    ) : block.type === "coupon" ? (
      <Group title="쿠폰 카드" meta={`${(block.data as CouponData).coupons.length}개`}>
        <CouponEditor block={block} />
      </Group>
    ) : block.type === "grid" ? (
      <Group title="그리드 상품" meta={`${(block.data as GridData).items.length}개`}>
        <GridEditor block={block} />
      </Group>
    ) : block.type === "free" ? (
      <Group title="콘텐츠 블록" meta={`${(block.data as FreeData).items.length}개`} defaultOpen>
        <FreeEditor block={block} />
      </Group>
    ) : null;
  const anchor = listAnchor[block.type];
  const anchorExists = anchor != null && groups.some((g) => g.name === anchor);

  return (
    <div className="inspector">
      <div className="insp-head">
        <div className="insp-head-code">
          <span className="insp-head-dot" style={{ background: meta.accent }} />
          {`${meta.code} · S${idx + 1}`}
        </div>
        {editingName ? (
          <input
            className="insp-head-name-edit"
            value={nameText}
            autoFocus
            onChange={(e) => setNameText(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setEditingName(false);
            }}
          />
        ) : (
          <div className="insp-head-title" onClick={startEditName} title="눌러서 이름 바꾸기">
            <span>{block.name || meta.label}</span>
            <span className="insp-head-edit-ic" aria-hidden>✎</span>
          </div>
        )}
      </div>

      <Group title="섹션 설정" defaultOpen>
        <div className="field-row-inline">
          <span className="field-inline-label">섹션 표시</span>
          <button
            className={"onoff" + (enabled ? " on" : "")}
            onClick={() => setBlockMeta(block.id, { enabled: !enabled })}
          >
            <span className="onoff-knob" />
            <span className="onoff-text">{enabled ? "ON" : "OFF"}</span>
          </button>
        </div>
        <label className="field">
          <span>위·아래 여백</span>
          <Select
            value={String(block.space ?? 0)}
            options={SPACE_OPTS}
            onChange={(v) => setBlockMeta(block.id, { space: parseInt(v, 10) })}
          />
        </label>
        <label className="field field-color">
          <span>섹션 배경색</span>
          <div className="color-row">
            <input
              type="color"
              className="color-chip"
              value={block.bg && /^#[0-9a-fA-F]{6}$/.test(block.bg) ? block.bg : "#ffffff"}
              onChange={(e) => setBlockMeta(block.id, { bg: e.target.value })}
            />
            <input
              type="text"
              value={block.bg && block.bg.trim() ? block.bg : "#ffffff"}
              onChange={(e) => setBlockMeta(block.id, { bg: e.target.value })}
            />
            {block.bg && (
              <button
                className="mini-clear"
                title="기본 배경으로"
                onClick={() => setBlockMeta(block.id, { bg: "" })}
              >
                ✕
              </button>
            )}
          </div>
        </label>
        <label className="field field-color">
          <span>글자색</span>
          <div className="color-row">
            <input
              type="color"
              className="color-chip"
              value={block.fg && /^#[0-9a-fA-F]{6}$/.test(block.fg) ? block.fg : "#000000"}
              onChange={(e) => setBlockMeta(block.id, { fg: e.target.value })}
            />
            <input
              type="text"
              value={block.fg && block.fg.trim() ? block.fg : "#000000"}
              onChange={(e) => setBlockMeta(block.id, { fg: e.target.value })}
            />
            {block.fg && (
              <button
                className="mini-clear"
                title="기본 글자색으로"
                onClick={() => setBlockMeta(block.id, { fg: "" })}
              >
                ✕
              </button>
            )}
          </div>
        </label>
        <label className="field">
          <span>섹션 배경 이미지</span>
          <ImageUploader
            value={block.bgImage ?? ""}
            onChange={(url) => setBlockMeta(block.id, { bgImage: url })}
            hint={
              block.bgImageFull
                ? "화면 전체 폭으로 깔려요. 가로로 넓고 가운데가 안전한 이미지 권장 (폭 1600px 이상 · JPG·PNG)"
                : "본문 폭(420px)에 맞춰 표시돼요. 권장 폭 840px 이상 · JPG·PNG"
            }
          />
        </label>
        {(block.bgImage ?? "").trim() !== "" && (
          <div className="field-row-inline">
            <span className="field-inline-label">배경 이미지 화면 전체 폭</span>
            <button
              className={"onoff" + (block.bgImageFull ? " on" : "")}
              onClick={() => setBlockMeta(block.id, { bgImageFull: !block.bgImageFull })}
            >
              <span className="onoff-knob" />
              <span className="onoff-text">{block.bgImageFull ? "ON" : "OFF"}</span>
            </button>
          </div>
        )}
        {block.type !== "nav" && (
          <>
            <div className="field-row-inline">
              <span className="field-inline-label">내비 탭에 표시</span>
              <button
                className={"onoff" + (block.navShow ? " on" : "")}
                onClick={() => setBlockMeta(block.id, { navShow: !block.navShow })}
              >
                <span className="onoff-knob" />
                <span className="onoff-text">{block.navShow ? "ON" : "OFF"}</span>
              </button>
            </div>
            {block.navShow && (
              <label className="field">
                <span>탭 이름</span>
                <input
                  type="text"
                  value={block.navLabel ?? ""}
                  placeholder={`비우면 "${meta.label}"`}
                  onChange={(e) => setBlockMeta(block.id, { navLabel: e.target.value })}
                />
              </label>
            )}
          </>
        )}
      </Group>

      {groups.map((g, i) => (
        <Fragment key={g.name}>
          <Group title={g.name} defaultOpen={i === 0}>
            {g.fields.map((f) => (
              <FieldRow key={f.key} block={block} f={f} />
            ))}
          </Group>
          {anchorExists && g.name === anchor && listEditor}
        </Fragment>
      ))}

      {/* 끼울 앵커 그룹이 없으면(예: 탭 내비) 맨 뒤에 붙임 */}
      {!anchorExists && listEditor}
    </div>
  );
}

function NavEditor({ block }: { block: Block }) {
  const update = useStore((s) => s.updateData);
  const blocks = useStore((s) => s.blocks);
  const data = block.data as NavData;
  const items = data.items;
  const auto = !!data.auto;
  const set = (next: NavItem[]) => update(block.id, { items: next });
  const patch = (i: number, p: Partial<NavItem>) =>
    set(items.map((v, k) => (k === i ? { ...v, ...p } : v)));
  // 이동 대상 후보: 내비 자신을 제외한 모든 블록
  const targets = blocks.filter((b) => b.id !== block.id);
  // 자동 구성 시 노출될 섹션들(미리보기)
  const autoSecs = blocks.filter((b) => b.enabled !== false && b.navShow && b.type !== "nav");
  return (
    <div className="sub">
      <div className="field-row-inline">
        <span className="field-inline-label">섹션에서 자동 구성</span>
        <button
          className={"onoff" + (auto ? " on" : "")}
          onClick={() => update(block.id, { auto: !auto })}
        >
          <span className="onoff-knob" />
          <span className="onoff-text">{auto ? "ON" : "OFF"}</span>
        </button>
      </div>
      {auto ? (
        <div className="nav-auto-hint">
          {autoSecs.length > 0 ? (
            <>
              각 섹션의 <b>"내비 탭에 표시"</b>를 켜면 탭이 돼요. 지금 탭:
              <div className="nav-auto-tags">
                {autoSecs.map((b) => (
                  <span className="nav-auto-tag" key={b.id}>
                    {(b.navLabel && b.navLabel.trim()) || b.name || BLOCKS[b.type].label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>아직 표시할 섹션이 없어요. 각 섹션의 <b>"내비 탭에 표시"</b>를 켜보세요.</>
          )}
        </div>
      ) : (
        <>
      {items.map((it, i) => (
        <div className="card-edit" key={i}>
          <div className="row">
            <input
              placeholder="탭 이름"
              value={it.label}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            <button onClick={() => set(items.filter((_, k) => k !== i))}>✕</button>
          </div>
          <Select
            value={it.target}
            placeholder="이동 안 함"
            onChange={(v) => patch(i, { target: v })}
            options={[
              { value: "", label: "이동 안 함" },
              ...targets.map((b) => ({
                value: b.id,
                label: `${blocks.findIndex((x) => x.id === b.id) + 1}. ${b.name || BLOCKS[b.type].label}`,
              })),
            ]}
          />
        </div>
      ))}
      <button
        className="add-mini"
        onClick={() => set([...items, { label: "새 탭", target: "" }])}
      >
        + 항목 추가
      </button>
        </>
      )}
    </div>
  );
}

function FreeEditor({ block }: { block: Block }) {
  const update = useStore((s) => s.updateData);
  const items = (block.data as FreeData).items;
  const set = (next: FreeItem[]) => update(block.id, { items: next });
  const patch = (i: number, p: Partial<FreeItem>) =>
    set(items.map((v, k) => (k === i ? { ...v, ...p } : v)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  return (
    <div className="sub">
      {items.map((it, i) => (
        <div className="card-edit" key={i}>
          <div className="free-item-head">
            <span className={"free-kind " + it.type}>
              {it.type === "image" ? "이미지" : "글"}
            </span>
            <div className="free-item-tools">
              <button title="위로" disabled={i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button title="아래로" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button title="삭제" onClick={() => set(items.filter((_, k) => k !== i))}>
                ✕
              </button>
            </div>
          </div>
          {it.type === "image" ? (
            <>
              <ImageUploader
                value={it.imageUrl ?? ""}
                onChange={(url) => patch(i, { imageUrl: url })}
              />
              <input
                type="text"
                placeholder="이미지 라벨(비었을 때 표시)"
                value={it.imageLabel ?? ""}
                onChange={(e) => patch(i, { imageLabel: e.target.value })}
              />
            </>
          ) : (
            <textarea
              rows={3}
              placeholder="문구를 적어요"
              value={it.text ?? ""}
              onChange={(e) => patch(i, { text: e.target.value })}
            />
          )}
        </div>
      ))}
      <div className="free-add-row">
        <button
          className="add-mini"
          onClick={() => set([...items, { type: "image", imageUrl: "", imageLabel: "이미지" }])}
        >
          + 이미지 블록
        </button>
        <button
          className="add-mini"
          onClick={() => set([...items, { type: "text", text: "" }])}
        >
          + 글 블록
        </button>
      </div>
    </div>
  );
}

function CouponEditor({ block }: { block: Block }) {
  const update = useStore((s) => s.updateData);
  const coupons = (block.data as CouponData).coupons;
  const set = (next: CouponItem[]) => update(block.id, { coupons: next });
  const patch = (i: number, p: Partial<CouponItem>) =>
    set(coupons.map((c, k) => (k === i ? { ...c, ...p } : c)));
  return (
    <div className="sub">
      {coupons.map((c, i) => (
        <div className="card-edit" key={i}>
          <div className="row">
            <input
              placeholder="할인 쿠폰 이름"
              value={c.amount}
              onChange={(e) => patch(i, { amount: e.target.value })}
            />
            <button onClick={() => set(coupons.filter((_, k) => k !== i))}>✕</button>
          </div>
          <input
            placeholder="구매 조건"
            value={c.condition}
            onChange={(e) => patch(i, { condition: e.target.value })}
          />
          <input
            placeholder="받기 버튼 문구"
            value={c.buttonText || "쿠폰받기"}
            onChange={(e) => patch(i, { buttonText: e.target.value })}
          />
          <div className="row grid-link-row">
            <input
              placeholder="다운로드 링크 붙여넣기 (https://…)"
              value={c.link ?? ""}
              onChange={(e) => patch(i, { link: e.target.value })}
            />
            {(c.link ?? "").trim() && (
              <span className="grid-link-on" title="이 쿠폰의 '쿠폰받기'가 링크로 연결돼요">
                연결됨
              </span>
            )}
          </div>
          <div className="color-row">
            <input
              type="color"
              className="color-chip"
              value={c.bg && /^#[0-9a-fA-F]{6}$/.test(c.bg) ? c.bg : "#ffffff"}
              onChange={(e) => patch(i, { bg: e.target.value })}
            />
            <input
              type="text"
              value={c.bg && c.bg.trim() ? c.bg : "#ffffff"}
              onChange={(e) => patch(i, { bg: e.target.value })}
            />
            {(c.bg ?? "").trim() && (
              <button className="mini-clear" title="흰색으로" onClick={() => patch(i, { bg: "" })}>
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        className="add-mini"
        onClick={() =>
          set([...coupons, { amount: "최대 O원 할인 쿠폰", condition: "OO원 이상 구매 시", buttonText: "쿠폰받기", link: "" }])
        }
      >
        + 쿠폰 추가
      </button>
    </div>
  );
}

function GridEditor({ block }: { block: Block }) {
  const update = useStore((s) => s.updateData);
  const items = (block.data as GridData).items;
  const set = (next: GridItem[]) => update(block.id, { items: next });
  const patch = (i: number, p: Partial<GridItem>) =>
    set(items.map((c, k) => (k === i ? { ...c, ...p } : c)));
  return (
    <div className="sub">
      {items.map((it, i) => (
        <div className="card-edit" key={i}>
          <div className="row">
            <input
              placeholder="상품명"
              value={it.name}
              onChange={(e) => patch(i, { name: e.target.value })}
            />
            <button onClick={() => set(items.filter((_, k) => k !== i))}>✕</button>
          </div>
          <ImageUploader value={it.imageUrl ?? ""} onChange={(url) => patch(i, { imageUrl: url })} />
          <div className="row">
            <input
              placeholder="할인율 (48%)"
              value={it.percent}
              onChange={(e) => patch(i, { percent: e.target.value })}
            />
            <input
              placeholder="소비자가"
              value={it.consumerPrice}
              onChange={(e) => patch(i, { consumerPrice: e.target.value })}
            />
            <input
              placeholder="할인가"
              value={it.salePrice}
              onChange={(e) => patch(i, { salePrice: e.target.value })}
            />
          </div>
          <div className="row grid-link-row">
            <input
              placeholder="상품 링크 붙여넣기 (https://…)"
              value={it.link ?? ""}
              onChange={(e) => patch(i, { link: e.target.value })}
            />
            {(it.link ?? "").trim() && (
              <span className="grid-link-on" title="이 상품 칸이 링크로 연결돼요">
                연결됨
              </span>
            )}
          </div>
        </div>
      ))}
      <button
        className="add-mini"
        onClick={() =>
          set([
            ...items,
            { imageUrl: "", name: "새 상품", percent: "0%", consumerPrice: "0", salePrice: "0", link: "" },
          ])
        }
      >
        + 상품 추가
      </button>
    </div>
  );
}
