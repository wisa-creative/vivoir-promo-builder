import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCHEMA = `
반환 형식은 오직 JSON 하나. 최상위: { "blocks": Block[] }.
Block.type ∈ "hero" | "nav" | "coupon" | "product" | "review".
각 type의 data 형태:
- hero:    { title, period }
- nav:     { items: string[] }
- coupon:  { badge, title, subtitle, coupons: [{condition, amount, sub, highlight?}], note }
- product: { theme("ivory"|"lime"|"navy"|"lightblue"|"gray"|"white"), badge, title, subtitle, imageUrl:"", consumerPrice, salePrice, ctaText:"바로 구매하기", ctaLink:"#", note }
- review:  { title, subtitle, bannerUrl:"", ctaText:"리뷰 참여하기", ctaLink:"#", note }
`;

const SYSTEM = `너는 비브아(VIVOIR) 프로모션 페이지 카피라이터다.
브랜드 톤: 하이테크·에너제틱, 간결하고 자신감 있는 한국어. 과장광고·허위표현 금지.
기획 메모를 읽고 Cafe24 이벤트/상세페이지용 블록 구조로 변환한다.
- 보통 순서: hero → nav → coupon → product(제품마다 1개) → review.
- 제품이 여러 개면 product 블록을 여러 개 만들고 theme 색을 번갈아(ivory/lime/navy/lightblue) 배치.
- imageUrl/bannerUrl은 빈 문자열("")로 둔다(디자이너가 실사 누끼를 채움).
- 가격은 메모의 숫자를 그대로(콤마 포함, "원" 제외).
- 각 블록 헤드라인/서브카피는 비브아 톤으로 매력적으로 작성.
${SCHEMA}
JSON 외 어떤 텍스트도 출력하지 마라.`;

function extractJson(text) {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("JSON 파싱 실패");
  return JSON.parse(text.slice(s, e + 1));
}

app.post("/api/draft", async (req, res) => {
  try {
    const memo = (req.body?.memo ?? "").toString().slice(0, 6000);
    if (!memo.trim()) return res.status(400).json({ error: "메모가 비었습니다." });
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: "ANTHROPIC_API_KEY 미설정 (.env 확인)" });

    const msg = await client.messages.create({
      model: process.env.DRAFT_MODEL || "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [
        { role: "user", content: `기획 메모:\n${memo}` },
        { role: "assistant", content: "{" }, // JSON 프리필
      ],
    });
    const raw = "{" + (msg.content[0]?.type === "text" ? msg.content[0].text : "");
    const json = extractJson(raw);
    res.json({ blocks: json.blocks ?? [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "생성 실패" });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`[vivoir-draft] http://localhost:${port}`));
