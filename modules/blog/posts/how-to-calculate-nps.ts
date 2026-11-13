import type { Post } from "../types";

export const howToCalculateNps: Post = {
  slug: "how-to-calculate-nps",
  category: "nps",
  date: "2026-11-12",
  readMinutes: 6,
  cover: "ink",
  badge: "+45",
  content: {
    ar: {
      title: "كيف تحسب صافي نقاط الترويج (NPS) لمتجرك، خطوة بخطوة",
      excerpt: "السؤال الواحد الذي يكشف هل سيعود عميلك ويُوصي بك. نشرح المعادلة، ومتى تسأله، وماذا تفعل بالنتيجة.",
      mark: "NPS",
      blocks: [
        { type: "h2", id: "what", text: "ما هو NPS؟" },
        {
          type: "p",
          text: "صافي نقاط الترويج مقياس يعتمد على سؤال واحد: «ما مدى احتمال أن تُوصي بنا لصديق أو زميل؟» يُجيب العميل بدرجة من [[0]] إلى [[10]]، ومن هذه الإجابات تعرف كم عميلًا سيتحدث عنك بإيجابية، وكم عميلًا قد يبتعد عنك.",
        },
        { type: "h2", id: "groups", text: "قسّم عملاءك إلى ثلاث فئات" },
        {
          type: "groups",
          items: [
            { value: "9–10", label: "المروّجون", text: "يعودون ويُوصون بك.", tone: "mint" },
            { value: "7–8", label: "المحايدون", text: "راضون، لكن قد يجرّبون غيرك.", tone: "neutral" },
            { value: "0–6", label: "المنتقدون", text: "غير راضين وقد يتحدثون عن ذلك.", tone: "ember" },
          ],
        },
        { type: "h2", id: "formula", text: "المعادلة" },
        {
          type: "callout",
          title: "NPS = نسبة المروّجين − نسبة المنتقدين",
          text: "مثال: من [[200]] إجابة، [[120]] مروّجًا ([[60%]]) و[[30]] منتقدًا ([[15%]]). النتيجة: [[60 − 15 = 45]].",
        },
        {
          type: "p",
          text: "النتيجة رقم بين [[−100]] و[[+100]]، وليست نسبة مئوية. المحايدون لا يدخلون في الحساب مباشرة، لكنهم يقلّلون النتيجة لأنهم ليسوا مروّجين.",
        },
        { type: "quote", text: "الرقم وحده لا يكفي. السؤال التالي «لماذا اخترت هذه الدرجة؟» هو ما يخبرك بما يجب إصلاحه." },
        { type: "h2", id: "when", text: "متى تسأل عملاءك؟" },
        {
          type: "p",
          text: "اسأل بعد التجربة مباشرة، حين تكون الزيارة حاضرة في ذهن العميل. أبسط الطرق في المتاجر والمطاعم:",
        },
        {
          type: "list",
          items: ["رمز QR على الفاتورة أو الطاولة.", "رسالة قصيرة بعد الدفع أو بعد استلام الطلب.", "شاشة صغيرة عند الكاشير."],
        },
        { type: "cta" },
        { type: "h2", id: "next", text: "ماذا تفعل بالنتيجة؟" },
        {
          type: "list",
          items: [
            "تواصل مع المنتقدين خلال يوم واحد، واسألهم ماذا كان يمكن أن تفعل أفضل.",
            "اشكر المروّجين، واطلب منهم تقييمك على خرائط Google.",
            "راقب النتيجة شهريًا لا يوميًا، فالأيام الفردية تتقلّب كثيرًا.",
            "قارن بين فروعك، لا بين متجرك ومتوسطات عامة لا تشبه نشاطك.",
          ],
        },
      ],
    },
    en: {
      title: "How to calculate your store's Net Promoter Score (NPS), step by step",
      excerpt: "The one question that tells you whether customers will come back and recommend you. The formula, when to ask, and what to do with the result.",
      mark: "NPS",
      blocks: [
        { type: "h2", id: "what", text: "What is NPS?" },
        {
          type: "p",
          text: "Net Promoter Score is built on one question: “How likely are you to recommend us to a friend or colleague?” Customers answer from 0 to 10, and the answers show how many will speak well of you and how many may drift away.",
        },
        { type: "h2", id: "groups", text: "Sort customers into three groups" },
        {
          type: "groups",
          items: [
            { value: "9–10", label: "Promoters", text: "They come back and recommend you.", tone: "mint" },
            { value: "7–8", label: "Passives", text: "Satisfied, but open to trying others.", tone: "neutral" },
            { value: "0–6", label: "Detractors", text: "Unhappy, and they may say so.", tone: "ember" },
          ],
        },
        { type: "h2", id: "formula", text: "The formula" },
        {
          type: "callout",
          title: "NPS = % promoters − % detractors",
          text: "Example: out of 200 answers, 120 promoters (60%) and 30 detractors (15%). The result: 60 − 15 = 45.",
        },
        {
          type: "p",
          text: "The result is a number from −100 to +100, not a percentage. Passives aren't counted directly, but they lower the score because they aren't promoters.",
        },
        { type: "quote", text: "The number alone isn't enough. The follow-up, “Why did you choose that score?”, tells you what to fix." },
        { type: "h2", id: "when", text: "When should you ask?" },
        { type: "p", text: "Ask right after the visit, while it's fresh. The simplest ways for stores and restaurants:" },
        { type: "list", items: ["A QR code on the receipt or the table.", "A short message after payment or delivery.", "A small screen at the till."] },
        { type: "cta" },
        { type: "h2", id: "next", text: "What to do with the result" },
        {
          type: "list",
          items: [
            "Contact detractors within a day and ask what you could have done better.",
            "Thank promoters and ask them to review you on Google Maps.",
            "Watch the score monthly, not daily: single days swing a lot.",
            "Compare your own branches, not your store against general averages that don't match your business.",
          ],
        },
      ],
    },
  },
};
