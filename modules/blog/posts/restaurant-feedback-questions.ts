import type { Post } from "../types";

export const restaurantFeedbackQuestions: Post = {
  slug: "restaurant-feedback-questions",
  category: "restaurants",
  date: "2026-11-05",
  readMinutes: 4,
  cover: "ember",
  content: {
    ar: {
      title: "5 أسئلة يجب أن يسألها كل مطعم بعد الطلب",
      excerpt: "أسئلة قصيرة يُجيب عنها الضيف في أقل من دقيقة، وتكشف أين تخسر عملاءك قبل أن يكتبوا تقييمًا.",
      mark: "مطاعم",
      blocks: [
        { type: "h2", id: "why", text: "لماذا خمسة أسئلة فقط؟" },
        {
          type: "p",
          text: "الضيف يمسح رمز QR وهو على الطاولة أو في طريقه للخروج. كل سؤال إضافي يقلّل عدد من يُكملون الاستبيان، لذلك اختر الأسئلة التي تقودك إلى قرار.",
        },
        { type: "h2", id: "questions", text: "الأسئلة الخمسة" },
        {
          type: "list",
          ordered: true,
          items: [
            "ما مدى رضاك عن زيارتك اليوم؟ (من [[1]] إلى [[5]])",
            "كيف تقيّم جودة الطعام؟",
            "كيف تقيّم سرعة الخدمة؟",
            "ما مدى احتمال أن تُوصي بنا لصديق؟ (من [[0]] إلى [[10]])",
            "ما الشيء الوحيد الذي لو غيّرناه لجعل زيارتك أفضل؟ (سؤال مفتوح)",
          ],
        },
        {
          type: "callout",
          title: "السؤال المفتوح هو الأهم",
          text: "التقييمات تخبرك أين المشكلة، أما إجابة «ما الشيء الوحيد…» فتخبرك ماذا تفعل. اقرأها كل يوم.",
        },
        { type: "h2", id: "where", text: "أين تضع رمز QR؟" },
        {
          type: "list",
          items: ["على الفاتورة، فهي آخر ما يراه الضيف.", "على الطاولة بجانب قائمة الطعام.", "على كيس الطلبات الخارجية والتوصيل."],
        },
        { type: "quote", text: "اسأل باللغة التي يتحدث بها ضيفك. استبيان بالعربية والإنجليزية يرفع عدد الإجابات." },
        { type: "cta" },
      ],
    },
    en: {
      title: "5 questions every restaurant should ask after the order",
      excerpt: "Short questions guests answer in under a minute, which show where you lose customers before they write a review.",
      mark: "Restaurants",
      blocks: [
        { type: "h2", id: "why", text: "Why only five questions?" },
        {
          type: "p",
          text: "Guests scan the QR code at the table or on their way out. Every extra question means fewer people finish, so keep the ones that lead to a decision.",
        },
        { type: "h2", id: "questions", text: "The five questions" },
        {
          type: "list",
          ordered: true,
          items: [
            "How satisfied are you with your visit today? (1 to 5)",
            "How would you rate the food?",
            "How would you rate the speed of service?",
            "How likely are you to recommend us to a friend? (0 to 10)",
            "What is the one thing we could change to make your visit better? (open question)",
          ],
        },
        {
          type: "callout",
          title: "The open question matters most",
          text: "Ratings tell you where the problem is; the answer to “the one thing…” tells you what to do. Read them every day.",
        },
        { type: "h2", id: "where", text: "Where to put the QR code" },
        { type: "list", items: ["On the receipt: it's the last thing guests see.", "On the table, next to the menu.", "On takeaway and delivery bags."] },
        { type: "quote", text: "Ask in your guest's language. A survey in Arabic and English gets more answers." },
        { type: "cta" },
      ],
    },
  },
};
