import type { Post } from "../types";

export const csatVsNps: Post = {
  slug: "csat-vs-nps",
  category: "experience",
  date: "2026-10-29",
  readMinutes: 5,
  cover: "ultra",
  content: {
    ar: {
      title: "الفرق بين CSAT وNPS، ومتى تستخدم كلًّا منهما",
      excerpt: "مقياسان مختلفان لسؤالين مختلفين. اعرف ماذا يقيس كل واحد منهما، واختر الصحيح لهدفك.",
      mark: "CSAT",
      blocks: [
        { type: "h2", id: "short", text: "الجواب المختصر" },
        {
          type: "p",
          text: "مؤشر رضا العملاء ([[CSAT]]) يقيس رضا العميل عن تجربة واحدة: هذه الزيارة، هذا الطلب. أما صافي نقاط الترويج ([[NPS]]) فيقيس ولاءه لعلامتك كلها: هل سيُوصي بك؟",
        },
        { type: "h2", id: "csat", text: "كيف يُحسب CSAT؟" },
        {
          type: "p",
          text: "تسأل «ما مدى رضاك عن تجربتك اليوم؟» على مقياس من [[1]] إلى [[5]]. النتيجة هي نسبة من اختاروا [[4]] أو [[5]] من مجموع الإجابات.",
        },
        {
          type: "callout",
          title: "CSAT = (عدد إجابات ٤ و٥ ÷ عدد الإجابات) × ١٠٠",
          text: "مثال: [[80]] إجابة، منها [[68]] اختارت [[4]] أو [[5]]. النتيجة: [[68 ÷ 80 = 85%]].",
        },
        { type: "h2", id: "nps", text: "كيف يُحسب NPS؟" },
        {
          type: "p",
          text: "تسأل «ما مدى احتمال أن تُوصي بنا؟» من [[0]] إلى [[10]]، ثم تطرح نسبة المنتقدين ([[0–6]]) من نسبة المروّجين ([[9–10]]). النتيجة رقم بين [[−100]] و[[+100]].",
        },
        { type: "h2", id: "which", text: "أيهما تستخدم؟" },
        {
          type: "list",
          items: [
            "استخدم [[CSAT]] بعد كل زيارة أو طلب، لتعرف أين تتعثّر التجربة اليومية: فرع، وردية، منتج.",
            "استخدم [[NPS]] مرة كل شهر أو ربع سنة، لتعرف اتجاه ولاء عملائك مع الوقت.",
            "معًا يكملان الصورة: [[CSAT]] يخبرك بما حدث اليوم، و[[NPS]] بما سيحدث غدًا.",
          ],
        },
        { type: "quote", text: "لا تُكثر الأسئلة. سؤال تقييم واحد، وسؤال مفتوح «لماذا؟»، يكفيان في معظم الزيارات." },
        { type: "cta" },
      ],
    },
    en: {
      title: "CSAT vs NPS: what each one measures and when to use it",
      excerpt: "Two different scores for two different questions. Learn what each one measures and pick the right one for your goal.",
      mark: "CSAT",
      blocks: [
        { type: "h2", id: "short", text: "The short answer" },
        {
          type: "p",
          text: "Customer satisfaction (CSAT) measures how happy a customer is with one experience: this visit, this order. Net Promoter Score (NPS) measures loyalty to your whole brand: will they recommend you?",
        },
        { type: "h2", id: "csat", text: "How CSAT is calculated" },
        {
          type: "p",
          text: "Ask “How satisfied are you with your visit today?” on a 1 to 5 scale. The score is the share of answers that chose 4 or 5.",
        },
        {
          type: "callout",
          title: "CSAT = (answers of 4 or 5 ÷ all answers) × 100",
          text: "Example: 80 answers, 68 of them chose 4 or 5. The result: 68 ÷ 80 = 85%.",
        },
        { type: "h2", id: "nps", text: "How NPS is calculated" },
        {
          type: "p",
          text: "Ask “How likely are you to recommend us?” from 0 to 10, then subtract the share of detractors (0–6) from the share of promoters (9–10). The result is a number from −100 to +100.",
        },
        { type: "h2", id: "which", text: "Which one should you use?" },
        {
          type: "list",
          items: [
            "Use CSAT after every visit or order, to see where the day-to-day experience slips: a branch, a shift, a product.",
            "Use NPS monthly or quarterly, to follow how loyalty changes over time.",
            "Together they complete the picture: CSAT tells you what happened today, NPS what will happen next.",
          ],
        },
        { type: "quote", text: "Don't ask too much. One rating and one open “why?” are enough for most visits." },
        { type: "cta" },
      ],
    },
  },
};
