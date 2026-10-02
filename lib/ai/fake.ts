import "server-only";
import { AIOutputError, type AIProvider, type GenerateRequest, type GenerateResult } from "./provider";

/**
 * Development and test stand-in: recognises a few Arabic and English keywords instead of
 * calling an AI service, so the whole flow can run locally and in CI without an API key.
 * Never used outside development (see getAIProvider).
 */
const KEYWORDS: Record<string, { praise: RegExp; complaint: RegExp }> = {
  speed: { praise: /سريع|fast|quick/i, complaint: /انتظار|بطيء|طويل|slow|wait/i },
  staff: { praise: /لطف|لطيف|ودود|friendly|kind/i, complaint: /وقح|سيء التعامل|rude/i },
  cleanliness: { praise: /نظيف|clean/i, complaint: /وسخ|غير نظيف|dirty/i },
  quality: { praise: /لذيذ|ممتاز|رائع|great|delicious/i, complaint: /بارد|سيئ|bad|cold/i },
  price: { praise: /رخيص|cheap/i, complaint: /غالي|expensive/i },
};

function analyze(text: string) {
  const praise: string[] = [];
  const complaints: string[] = [];
  for (const [theme, k] of Object.entries(KEYWORDS)) {
    // A theme is a complaint when a complaint word is present, otherwise praise.
    if (k.complaint.test(text)) complaints.push(theme);
    else if (k.praise.test(text)) praise.push(theme);
  }
  const sentiment = praise.length && complaints.length ? "mixed" : complaints.length ? "negative" : praise.length ? "positive" : "neutral";
  return { sentiment, praise, complaints, language: /[؀-ۿ]/.test(text) ? "ar" : "en" };
}

export class FakeProvider implements AIProvider {
  readonly name = "fake";

  async generate<T>(request: GenerateRequest<T>): Promise<GenerateResult<T>> {
    const comments = [...request.prompt.matchAll(/<comment index="(\d+)">([\s\S]*?)<\/comment>/g)].map((m) => ({ index: Number(m[1]), text: m[2] }));
    let output: unknown;
    if (request.task === "analyze_comments") {
      output = { results: comments.map((c) => ({ index: c.index, ...analyze(c.text) })) };
    } else {
      const observed = JSON.parse(request.prompt.split("\n")[1]) as { comments: number; complaints: { theme: string; mentions: number }[] };
      const top = observed.complaints[0];
      output = {
        ar: {
          headline: top ? `أكثر ما اشتكى منه العملاء: ${top.theme}` : "عملاؤك راضون هذا الأسبوع",
          summary: `حللنا ${observed.comments} تعليقًا هذا الأسبوع.`,
          actions: top ? [`راجع ${top.theme} مع فريقك.`] : [],
        },
        en: {
          headline: top ? `Top complaint: ${top.theme}` : "Customers were happy this week",
          summary: `We analysed ${observed.comments} comments this week.`,
          actions: top ? [`Review ${top.theme} with your team.`] : [],
        },
        evidence: comments.slice(0, 2).map((c) => c.index),
      };
    }
    const parsed = request.schema.safeParse(output);
    if (!parsed.success) throw new AIOutputError("Fake output didn't match the schema");
    return { data: parsed.data, model: "fake" };
  }
}
