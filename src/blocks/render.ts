import { tokens } from "../tokens";
import { BLOCKS } from "./registry";
import type {
  Block,
  CouponData,
  FreeData,
  GridData,
  HeaderData,
  HeroData,
  NavData,
  NoteData,
  ProductData,
  ReviewData,
} from "../types";

const C = tokens.color;

// 프리뷰 인라인 편집 컨텍스트. edit=true일 때만 편집 속성이 붙어요(내보내기는 항상 clean).
// id는 항상 채워요 — 섹션 앵커(#id)로 쓰이기 때문(내보내기 포함).
interface Ctx {
  edit?: boolean;
  id?: string;
  space?: number; // 섹션 위·아래 추가 여백(px)
  bg?: string; // 섹션 배경색 덮어쓰기
  bgImage?: string; // 섹션 배경 이미지
  fg?: string; // 섹션 글자색 덮어쓰기
  allBlocks?: Block[]; // 자동 내비 구성을 위한 전체 블록 목록
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// 줄바꿈(\n) → <br>, 나머지는 이스케이프
function multiline(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

// 편집 속성 문자열: 프리뷰 편집 모드에서만 contenteditable + 매핑용 data-* 부여
function ea(
  ctx: Ctx | undefined,
  field: string,
  extra?: { index?: number; subfield?: string },
): string {
  if (!ctx?.edit || !ctx.id) return "";
  let s = ` contenteditable="true" data-bid="${esc(ctx.id)}" data-field="${field}" spellcheck="false"`;
  if (extra?.index !== undefined) s += ` data-index="${extra.index}"`;
  if (extra?.subfield) s += ` data-subfield="${extra.subfield}"`;
  return s;
}

// 이미지 드롭 대상 속성 (프리뷰 편집 모드 전용)
function da(
  ctx: Ctx | undefined,
  field: string,
  extra?: { index?: number; subfield?: string },
): string {
  if (!ctx?.edit || !ctx.id) return "";
  let s = ` data-drop-bid="${esc(ctx.id)}" data-drop-field="${field}"`;
  if (extra?.index !== undefined) s += ` data-drop-index="${extra.index}"`;
  if (extra?.subfield) s += ` data-drop-subfield="${extra.subfield}"`;
  return s;
}

// 섹션 글자색(fg)이 지정되면 그 색을, 아니면 기본 텍스트색을 반환
function inkOf(ctx?: Ctx): string {
  return ctx?.fg && ctx.fg.trim() ? ctx.fg : C.ink;
}
function subOf(ctx?: Ctx): string {
  return ctx?.fg && ctx.fg.trim() ? ctx.fg : C.inkSub;
}

// 파랑 아웃라인 pill
function pill(text: string, ctx?: Ctx, field?: string): string {
  // 섹션 글자색을 지정하면(예: 컬러 배경) 뱃지도 그 색을 따라가 대비를 유지해요.
  const accent = ctx?.fg && ctx.fg.trim() ? ctx.fg : C.accentBlue;
  return `<span${field ? ea(ctx, field) : ""} style="display:inline-block;border:1px solid ${accent};color:${accent};font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;letter-spacing:-0.02em;">${esc(
    text,
  )}</span>`;
}

interface ImgOpts {
  ratio?: string;
  ctx?: Ctx;
  labelField?: string;
  dropField?: string;
  dropIndex?: number;
  dropSubfield?: string;
}
function imageBox(url: string, label: string, opts: ImgOpts = {}): string {
  const { ratio = "100%", ctx, labelField, dropField, dropIndex, dropSubfield } = opts;
  const drop = dropField ? da(ctx, dropField, { index: dropIndex, subfield: dropSubfield }) : "";
  if (url && url.trim()) {
    return `<img src="${esc(url)}" alt="${esc(label)}"${drop} style="display:block;width:100%;height:auto;border:0;border-radius:8px;" />`;
  }
  // 편집 프리뷰: 문구 대신 '이미지 업로드' 아이콘(라인·라운드)만 보여줘요.
  // 내보내기(export): 기존처럼 라벨 문구 유지.
  const center = ctx?.edit
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:${subOf(ctx)};pointer-events:none;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 16V9"/><path d="M9 12l3-3 3 3"/></svg>
      </div>`
    : `<span${labelField ? ea(ctx, labelField) : ""} style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:${subOf(ctx)};font-weight:500;font-size:15px;white-space:nowrap;">${esc(label)}</span>`;
  return `<div${drop} style="width:100%;padding-top:${ratio};position:relative;background:${C.imgBox};border-radius:8px;">
    ${center}
  </div>`;
}

// 좌측 정렬 가격 블록
function priceBlock(consumer: string, sale: string, ctx?: Ctx): string {
  return `<div style="margin-top:18px;">
    <div style="color:${C.muted};font-size:13px;font-weight:500;">소비자가 <span style="text-decoration:line-through;"><span${ea(ctx, "consumerPrice")}>${esc(consumer)}</span>원</span></div>
    <div style="margin-top:5px;">
      <span style="color:${inkOf(ctx)};font-size:15px;font-weight:800;">할인가</span>
      <span style="color:${inkOf(ctx)};font-size:24px;font-weight:800;margin-left:8px;"><span${ea(ctx, "salePrice")}>${esc(sale)}</span>원</span>
    </div>
  </div>`;
}

function ctaButton(
  text: string,
  link: string,
  style: "dark" | "outline",
  ctx?: Ctx,
): string {
  const s =
    style === "outline"
      ? `background:${C.white};color:${inkOf(ctx)};border:1.5px solid ${C.cta};`
      : `background:${C.cta};color:${C.ctaText};border:1.5px solid ${C.cta};`;
  return `<div style="margin-top:22px;">
    <a href="${esc(link || "#")}" style="display:block;width:100%;box-sizing:border-box;text-align:center;${s}font-size:16px;font-weight:700;text-decoration:none;padding:16px 0;border-radius:8px;"><span${ea(ctx, "ctaText")}>${esc(text)}</span></a>
  </div>`;
}

// pad 문자열(px 기준)에 위·아래 추가 여백을 더해요
function padWithExtra(pad: string, extra: number): string {
  if (!extra) return pad;
  const p = pad.trim().split(/\s+/).map((x) => parseInt(x, 10) || 0);
  let t: number, r: number, b: number, l: number;
  if (p.length === 1) [t, r, b, l] = [p[0], p[0], p[0], p[0]];
  else if (p.length === 2) [t, r, b, l] = [p[0], p[1], p[0], p[1]];
  else if (p.length === 3) [t, r, b, l] = [p[0], p[1], p[2], p[1]];
  else [t, r, b, l] = [p[0], p[1], p[2], p[3]];
  return `${Math.max(0, t + extra)}px ${r}px ${Math.max(0, b + extra)}px ${l}px`;
}

function section(
  inner: string,
  bg: string,
  pad = "40px 22px",
  id?: string,
  ctx?: Ctx,
): string {
  const anchor = id ? ` id="${esc(id)}"` : "";
  const finalBg = ctx?.bg && ctx.bg.trim() ? ctx.bg : bg;
  const finalPad = padWithExtra(pad, ctx?.space ?? 0);
  const img = (ctx?.bgImage ?? "").trim();
  // 배경색을 fallback으로 두고 그 위에 이미지를 cover로 깐다.
  const bgImgCss = img
    ? `background-image:url(&quot;${esc(img)}&quot;);background-size:cover;background-position:center;background-repeat:no-repeat;`
    : "";
  const fgCss = ctx?.fg && ctx.fg.trim() ? `color:${ctx.fg};` : "";
  // 배경(색·이미지)은 화면 좌우 끝까지 꽉 채우고, 콘텐츠는 max-width 컬럼으로 가운데 정렬해요.
  // → PC 폭에서도 지정한 배경색·이미지는 좌우로 넓어지고, 본문은 폰 폭을 유지.
  return `<section${anchor} style="background-color:${finalBg};${bgImgCss}${fgCss}scroll-margin-top:8px;"><div style="max-width:${tokens.layout.maxWidth}px;margin:0 auto;padding:${finalPad};box-sizing:border-box;">${inner}</div></section>`;
}

// ---- 블록별 렌더 ----

function renderHero(d: HeroData, ctx?: Ctx): string {
  const url = (d.imageUrl ?? "").trim();
  // 이미지가 있으면 전체 폭 배너, 없으면 편집 프리뷰에서 업로드 박스(내보내기에선 빈 섹션)
  if (!url && !ctx?.edit) {
    return section("", C.heroBg, "0", ctx?.id, ctx);
  }
  const banner = imageBox(url, "", { ratio: "58%", ctx, dropField: "imageUrl" });
  return section(banner, C.heroBg, "0", ctx?.id, ctx);
}

function renderNav(d: NavData, ctx?: Ctx): string {
  let items: string;
  if (d.auto) {
    // 자동 구성: "내비 노출"이 켜진 섹션들로 탭을 만들어요(자동 탭은 편집 불가).
    const secs = (ctx?.allBlocks ?? []).filter(
      (b) => b.enabled !== false && b.navShow && b.type !== "nav",
    );
    items = secs
      .map((b, i) => {
        const active = i === 0;
        const label = (b.navLabel && b.navLabel.trim()) || BLOCKS[b.type].label;
        return `<a href="#${esc(b.id)}" style="display:inline-block;padding:15px 13px;font-size:14px;font-weight:${active ? 700 : 600};text-decoration:none;color:${active ? C.ink : C.inkSub};border-bottom:2px solid ${active ? C.ink : "transparent"};letter-spacing:-0.02em;">${esc(label)}</a>`;
      })
      .join("");
  } else {
    const list = d.items
      .map((it, i) => ({ it, i }))
      .filter((x) => ctx?.edit || x.it.label.trim());
    items = list
      .map(({ it, i }) => {
        const active = i === 0;
        const href = it.target ? `#${esc(it.target)}` : "#";
        return `<a href="${href}"${ea(ctx, "items", { index: i, subfield: "label" })} style="display:inline-block;padding:15px 13px;font-size:14px;font-weight:${active ? 700 : 600};text-decoration:none;color:${active ? C.ink : C.inkSub};border-bottom:2px solid ${active ? C.ink : "transparent"};letter-spacing:-0.02em;">${esc(it.label)}</a>`;
      })
      .join("");
  }
  const anchor = ctx?.id ? ` id="${esc(ctx.id)}"` : "";
  const navBg = ctx?.bg && ctx.bg.trim() ? ctx.bg : C.white;
  // 배경·구분선은 좌우 끝까지, 탭은 max-width 컬럼 안에서 가로 스크롤
  return `<nav${anchor} style="background:${navBg};border-bottom:1px solid ${C.line};"><div style="max-width:${tokens.layout.maxWidth}px;margin:0 auto;padding:0 8px;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none;">${items}</div></nav>`;
}

// 쿠폰팩 '한 번에 다운받기' 버튼. 색을 지정하면 채움 버튼, 비우면 흰 배경 외곽선 기본.
function downloadButton(d: CouponData, ctx?: Ctx): string {
  const bgSet = (d.downloadBg ?? "").trim();
  const fgSet = (d.downloadFg ?? "").trim();
  const bg = bgSet || C.white;
  const fg = fgSet || inkOf(ctx);
  const border = bgSet || C.cta; // 배경색을 지정하면 테두리도 같은 색(채움), 아니면 기본 외곽선
  return `<div style="margin-top:22px;">
    <a href="${esc(d.downloadLink || "#")}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:${bg};color:${fg};border:1.5px solid ${border};font-size:16px;font-weight:700;text-decoration:none;padding:16px 0;border-radius:8px;"><span${ea(ctx, "downloadText")}>${esc(d.downloadText)}</span></a>
  </div>`;
}

function renderCoupon(d: CouponData, ctx?: Ctx): string {
  const rows = d.coupons
    .map((cp, i) => {
      const link = (cp.link ?? "").trim();
      const cardBg = (cp.bg ?? "").trim() || C.white;
      const btnLabel = esc(`↓ ${cp.buttonText?.trim() || "쿠폰받기"}`);
      // 개별 다운로드 링크가 있으면 받기 버튼을 그 링크로 연결해요 (미리보기에선 이동 안 함, 내보낸 HTML에서 이동)
      const getBtn = link
        ? `<a href="${esc(link)}" style="font-size:13px;color:${inkOf(ctx)};white-space:nowrap;margin-left:12px;text-decoration:none;font-weight:600;">${btnLabel}</a>`
        : `<div style="font-size:13px;color:${inkOf(ctx)};white-space:nowrap;margin-left:12px;">${btnLabel}</div>`;
      return `<div style="border:1px solid ${C.line};border-radius:12px;background:${cardBg};padding:17px 18px;display:flex;justify-content:space-between;align-items:center;">
        <div style="min-width:0;">
          <div${ea(ctx, "coupons", { index: i, subfield: "amount" })} style="font-size:15px;font-weight:700;color:${inkOf(ctx)};">${esc(cp.amount)}</div>
          <div${ea(ctx, "coupons", { index: i, subfield: "condition" })} style="margin-top:6px;font-size:12px;font-weight:600;color:${C.orange};">${esc(cp.condition)}</div>
        </div>
        ${getBtn}
      </div>`;
    })
    .join("");
  const inner = `<div style="text-align:left;">
      ${pill(d.badge, ctx, "badge")}
      <h2${ea(ctx, "title")} style="margin:14px 0 0;font-size:24px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;">${esc(d.title)}</h2>
      <p${ea(ctx, "subtitle")} style="margin:12px 0 0;font-size:14px;line-height:1.65;color:${subOf(ctx)};white-space:pre-line;">${esc(d.subtitle)}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px;">${rows}</div>
    ${downloadButton(d, ctx)}`;
  return section(inner, C.white, "40px 22px 44px", ctx?.id, ctx);
}

function renderHeader(d: HeaderData, ctx?: Ctx): string {
  const inner = `<div style="text-align:center;">
      <h2${ea(ctx, "title")} style="margin:0;font-size:26px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;">${esc(d.title)}</h2>
      <p${ea(ctx, "subtitle")} style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${subOf(ctx)};white-space:pre-line;">${esc(d.subtitle)}</p>
    </div>`;
  return section(inner, C.page, "44px 22px 4px", ctx?.id, ctx);
}

function renderProduct(d: ProductData, ctx?: Ctx): string {
  const inner = `<div style="text-align:left;">
      ${d.badge ? pill(d.badge, ctx, "badge") : ""}
      <h2${ea(ctx, "title")} style="margin:${d.badge ? "14px" : "0"} 0 0;font-size:24px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;letter-spacing:-0.02em;">${esc(d.title)}</h2>
      <p${ea(ctx, "subtitle")} style="margin:12px 0 0;font-size:14px;line-height:1.65;color:${subOf(ctx)};white-space:pre-line;">${esc(d.subtitle)}</p>
    </div>
    <div style="margin-top:20px;">${imageBox(d.imageUrl, d.imageLabel, { ratio: "100%", ctx, labelField: "imageLabel", dropField: "imageUrl" })}</div>
    ${priceBlock(d.consumerPrice, d.salePrice, ctx)}
    ${ctaButton(d.ctaText, d.ctaLink, d.ctaStyle === "outline" ? "outline" : "dark", ctx)}`;
  return section(inner, C.page, "20px 22px 44px", ctx?.id, ctx);
}

function renderGrid(d: GridData, ctx?: Ctx): string {
  const cells = d.items
    .map((it, idx) => {
      const link = (it.link ?? "").trim();
      // 링크가 있으면 칸 전체를 <a>로 감싸 그 상품으로 연결해요 (미리보기에선 이동 안 하고, 내보낸 HTML에서 클릭 시 이동)
      const openTag = link
        ? `<a href="${esc(link)}" style="display:block;text-decoration:none;color:inherit;flex:0 0 calc(50% - 6px);max-width:calc(50% - 6px);">`
        : `<div style="flex:0 0 calc(50% - 6px);max-width:calc(50% - 6px);">`;
      const closeTag = link ? `</a>` : `</div>`;
      return `${openTag}
        ${imageBox(it.imageUrl, "소모품 이미지", { ratio: "100%", ctx, dropField: "items", dropIndex: idx, dropSubfield: "imageUrl" })}
        <div style="margin-top:10px;font-size:13px;font-weight:600;color:${inkOf(ctx)};line-height:1.4;">${esc(it.name)}</div>
        <div style="margin-top:5px;">
          <span style="color:${C.orange};font-size:13px;font-weight:800;">${esc(it.percent)}</span>
          <span style="color:${C.muted};font-size:12px;text-decoration:line-through;margin-left:6px;">${esc(it.consumerPrice)}원</span>
        </div>
        <div style="margin-top:2px;font-size:16px;font-weight:800;color:${inkOf(ctx)};">${esc(it.salePrice)}원</div>
      ${closeTag}`;
    })
    .join("");
  const inner = `<h2${ea(ctx, "title")} style="margin:0 0 20px;font-size:22px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;">${esc(d.title)}</h2>
    <div style="display:flex;flex-wrap:wrap;gap:12px;">${cells}</div>
    ${ctaButton(d.ctaText, d.ctaLink, "outline", ctx)}`;
  return section(inner, C.page, "40px 22px 44px", ctx?.id, ctx);
}

function renderReview(d: ReviewData, ctx?: Ctx): string {
  const inner = `<div style="text-align:left;">
      ${d.badge ? pill(d.badge, ctx, "badge") : ""}
      <h2${ea(ctx, "title")} style="margin:${d.badge ? "14px" : "0"} 0 0;font-size:24px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;">${esc(d.title)}</h2>
      <p${ea(ctx, "subtitle")} style="margin:12px 0 0;font-size:14px;line-height:1.65;color:${subOf(ctx)};white-space:pre-line;">${esc(d.subtitle)}</p>
    </div>
    <div style="margin-top:20px;">${imageBox(d.bannerUrl, d.bannerLabel, { ratio: "62%", ctx, labelField: "bannerLabel", dropField: "bannerUrl" })}</div>
    ${ctaButton(d.ctaText, d.ctaLink, "dark", ctx)}`;
  return section(inner, C.page, "40px 22px 48px", ctx?.id, ctx);
}

function renderFree(d: FreeData, ctx?: Ctx): string {
  const head =
    d.badge || d.title || d.subtitle || ctx?.edit
      ? `<div style="text-align:left;margin-bottom:${d.items.length ? "20px" : "0"};">
      ${d.badge ? pill(d.badge, ctx, "badge") : ""}
      <h2${ea(ctx, "title")} style="margin:${d.badge ? "14px" : "0"} 0 0;font-size:24px;font-weight:500;color:${inkOf(ctx)};line-height:1.3;white-space:pre-line;letter-spacing:-0.02em;">${esc(d.title)}</h2>
      <p${ea(ctx, "subtitle")} style="margin:12px 0 0;font-size:14px;line-height:1.65;color:${subOf(ctx)};white-space:pre-line;">${esc(d.subtitle)}</p>
    </div>`
      : "";
  const body = d.items
    .map((it, i) => {
      if (it.type === "image") {
        return `<div style="margin:${i ? "14px" : "0"} 0 0;">${imageBox(it.imageUrl ?? "", it.imageLabel ?? "이미지", { ratio: "62%", ctx, labelField: undefined, dropField: "items", dropIndex: i, dropSubfield: "imageUrl" })}</div>`;
      }
      return `<div${ea(ctx, "items", { index: i, subfield: "text" })} style="margin:${i ? "14px" : "0"} 0 0;font-size:15px;line-height:1.7;color:${inkOf(ctx)};white-space:pre-line;min-height:1.5em;">${multiline(it.text ?? "")}</div>`;
    })
    .join("");
  const cta = d.ctaText && d.ctaText.trim() ? ctaButton(d.ctaText, d.ctaLink, d.ctaStyle === "outline" ? "outline" : "dark", ctx) : "";
  const inner = `${head}${body}${cta}`;
  return section(inner, C.page, "40px 22px 44px", ctx?.id, ctx);
}

// 유의사항: 어느 블록에도 속하지 않는 독립 아코디언 섹션
function renderNote(d: NoteData, ctx?: Ctx): string {
  const title = (d.title && d.title.trim()) || "유의사항";
  const caret = `<span class="promo-caret" style="display:inline-flex;flex:none;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>`;
  const inner = `<details style="text-align:center;">
      <summary style="cursor:pointer;color:${subOf(ctx)};font-size:14px;display:inline-flex;align-items:center;gap:6px;list-style:none;"><span${ea(ctx, "title")}>${esc(title)}</span>${caret}</summary>
      <div${ea(ctx, "text")} style="margin-top:12px;text-align:left;font-size:13px;line-height:1.7;color:${subOf(ctx)};white-space:pre-line;min-height:1.7em;">${multiline(d.text)}</div>
    </details>`;
  return section(inner, C.white, "22px 22px", ctx?.id, ctx);
}

export function renderBlock(block: Block, ctx?: Ctx): string {
  // id는 앵커용으로 항상 전달. 편집 속성은 ea()가 ctx.edit로 다시 거른다.
  const c: Ctx = {
    edit: !!ctx?.edit,
    id: block.id,
    space: block.space,
    bg: block.bg,
    bgImage: block.bgImage,
    fg: block.fg,
    allBlocks: ctx?.allBlocks,
  };
  switch (block.type) {
    case "hero":
      return renderHero(block.data as HeroData, c);
    case "nav":
      return renderNav(block.data as NavData, c);
    case "coupon":
      return renderCoupon(block.data as CouponData, c);
    case "header":
      return renderHeader(block.data as HeaderData, c);
    case "product":
      return renderProduct(block.data as ProductData, c);
    case "grid":
      return renderGrid(block.data as GridData, c);
    case "review":
      return renderReview(block.data as ReviewData, c);
    case "free":
      return renderFree(block.data as FreeData, c);
    case "note":
      return renderNote(block.data as NoteData, c);
    default:
      return "";
  }
}

// Cafe24에 붙이는 본문 스니펫 (폰 폭 컬럼 + 폰트 래핑)
export function renderPageBody(blocks: Block[], opts?: { edit?: boolean }): string {
  const body = blocks
    .filter((b) => b.enabled !== false)
    .map((b) => renderBlock(b, { edit: opts?.edit, allBlocks: blocks }))
    .join("\n");
  // 편집(프리뷰) 모드에서는 scroll-behavior:smooth를 넣지 않아요.
  // 편집할 때마다 iframe이 리로드되며 스크롤을 복원하는데, smooth가 있으면 "위로 갔다 내려오는" 애니메이션이 보여요.
  const scrollBehavior = opts?.edit ? "" : "html{scroll-behavior:smooth;}";
  // 바깥 래퍼는 폭 제한 없이 전체 폭 — 각 섹션이 스스로 배경을 좌우 끝까지 깔고, 콘텐츠만 가운데 정렬해요.
  return `<div style="font-family:${tokens.font.family};background:${C.white};color:${C.ink};">
<style>details>summary{list-style:none;}details>summary::-webkit-details-marker{display:none;}.promo-caret{transition:transform .18s ease;}details[open] .promo-caret{transform:rotate(180deg);}${scrollBehavior}nav::-webkit-scrollbar{display:none;}</style>
${body}
</div>`;
}

// 프리뷰용 전체 문서 (edit 모드: 인라인 편집 + 스크롤 복원 + 블록선택 + 이미지드롭 스크립트)
export function renderPreviewDoc(blocks: Block[], opts?: { edit?: boolean; scrollY?: number }): string {
  const edit = !!opts?.edit;
  const body = renderPageBody(blocks, { edit });
  const editStyle = edit
    ? `[contenteditable]{cursor:text;border-radius:3px;transition:box-shadow .1s;} [contenteditable]:hover{box-shadow:0 0 0 2px rgba(21,119,204,.28);} [contenteditable]:focus{outline:none;box-shadow:0 0 0 2px rgba(21,119,204,.75);} [data-drop-field]{cursor:copy;transition:box-shadow .1s;} .promo-drop-over{box-shadow:0 0 0 3px rgba(21,119,204,.85) inset!important;}`
    : "";
  const sy = Math.max(0, Math.round(opts?.scrollY ?? 0));
  const script = edit
    ? `<script>(function(){
  var sy=${sy};
  // 편집 시 iframe이 리로드돼도 스크롤 위치를 "즉시(애니메이션 없이)·페인트 전"에 복원
  try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(e){}
  function restore(){try{window.scrollTo({top:sy,left:0,behavior:'instant'});}catch(e){window.scrollTo(0,sy);}}
  restore();
  document.addEventListener('DOMContentLoaded',restore,{once:true});
  function post(m){parent.postMessage(m,'*');}
  // 부모(왼쪽 블록 목록)에서 섹션으로 스크롤하라는 요청 받기
  window.addEventListener('message',function(e){
    var d=e.data; if(!d||typeof d!=='object'||!d.__promoScrollTo)return;
    var t=document.getElementById(d.__promoScrollTo); if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  });
  // 링크 클릭: 페이지 이동 대신 앵커로 스크롤(내비 탭 미리보기)
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a'); if(!a)return; e.preventDefault();
    var href=a.getAttribute('href')||'';
    if(href.charAt(0)==='#'&&href.length>1){var t=document.getElementById(href.slice(1)); if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}
  },true);
  // 편집 요소를 클릭/포커스하면 해당 블록 선택
  function selFrom(el){var n=el&&el.closest&&el.closest('[data-bid],[data-drop-bid]'); if(!n)return; var id=n.getAttribute('data-bid')||n.getAttribute('data-drop-bid'); if(id)post({__promoSelect:true,id:id});}
  document.addEventListener('mousedown',function(e){selFrom(e.target);},true);
  document.addEventListener('focusin',function(e){selFrom(e.target);},true);
  // 인라인 편집: blur 시 커밋
  document.addEventListener('blur',function(e){
    var el=e.target; if(!el||!el.getAttribute)return;
    var f=el.getAttribute('data-field'); if(!f)return;
    var msg={__promoEdit:true,id:el.getAttribute('data-bid'),field:f,value:el.innerText.replace(/\\n$/,'')};
    var idx=el.getAttribute('data-index'); if(idx!==null)msg.index=parseInt(idx,10);
    var sub=el.getAttribute('data-subfield'); if(sub)msg.subfield=sub;
    post(msg);
  },true);
  // 이미지 업로드 공용: 대상 박스(t)에 이미지 파일을 읽어 부모로 전송
  function sendImg(t,file){
    if(!file||!/^image\\//.test(file.type))return;
    var r=new FileReader();
    r.onload=function(){
      var msg={__promoEdit:true,id:t.getAttribute('data-drop-bid'),field:t.getAttribute('data-drop-field'),value:r.result};
      var idx=t.getAttribute('data-drop-index'); if(idx!==null)msg.index=parseInt(idx,10);
      var sub=t.getAttribute('data-drop-subfield'); if(sub)msg.subfield=sub;
      post(msg);
    };
    r.readAsDataURL(file);
  }
  // 이미지 드래그&드롭
  function dropTarget(el){return el&&el.closest&&el.closest('[data-drop-field]');}
  document.addEventListener('dragover',function(e){var t=dropTarget(e.target); if(!t)return; e.preventDefault(); t.classList.add('promo-drop-over');},true);
  document.addEventListener('dragleave',function(e){var t=dropTarget(e.target); if(t)t.classList.remove('promo-drop-over');},true);
  document.addEventListener('drop',function(e){
    var t=dropTarget(e.target); if(!t)return; e.preventDefault(); t.classList.remove('promo-drop-over');
    sendImg(t, e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]);
  },true);
  // 이미지 박스 클릭 → 파일 선택창으로 업로드(교체)
  document.addEventListener('click',function(e){
    var t=dropTarget(e.target); if(!t)return; e.preventDefault();
    var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange=function(){ sendImg(t, inp.files&&inp.files[0]); };
    inp.click();
  },true);
  var t2; window.addEventListener('scroll',function(){clearTimeout(t2);t2=setTimeout(function(){post({__promoScroll:window.scrollY||window.pageYOffset||0});},120);});
})();</script>`
    : "";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;background:${C.page};}img{max-width:100%;}details>summary{list-style:none;}details>summary::-webkit-details-marker{display:none;}.promo-caret{transition:transform .18s ease;}details[open] .promo-caret{transform:rotate(180deg);}nav::-webkit-scrollbar{display:none;}${editStyle}</style>
</head><body>${body}${script}</body></html>`;
}
