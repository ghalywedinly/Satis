import type { Post } from "../types";

export const beforeAndAfterStudies: Post = {
  slug: "before-and-after-studies",
  category: "product",
  date: "2026-11-01",
  readMinutes: 3,
  cover: "grape",
  content: {
    ar: {
      title: "جديد Satis: دراسات قبل وبعد في تقرير واحد",
      excerpt: "قِس أثر أي تغيير في متجرك أو بحثك بمقارنة الإجابات قبله وبعده، في تقرير واحد.",
      mark: "قبل وبعد",
      blocks: [
        { type: "h2", id: "what", text: "ما الجديد؟" },
        {
          type: "p",
          text: "يمكنك الآن إنشاء «دراسة» تضم استبيانين: واحد قبل التغيير وآخر بعده. يجمع Satis الإجابات في تقرير واحد يوضح الفرق لكل سؤال.",
        },
        { type: "h2", id: "uses", text: "متى تستخدمها؟" },
        {
          type: "list",
          items: ["قبل تغيير قائمة الطعام وبعده.", "قبل تدريب فريق الخدمة وبعده.", "في الأبحاث التي تقيس أثر برنامج أو تجربة على المشاركين أنفسهم."],
        },
        {
          type: "callout",
          title: "رمز المشارك يربط الإجابتين",
          text: "يُدخل كل مشارك رمزًا قصيرًا (مثل [[P-014]]) في الاستبيانين، فتُقارن إجابته قبل وبعد دون جمع اسمه أو رقمه. ويمكنك إيقاف الربط للدراسات المجهولة.",
        },
        { type: "h2", id: "how", text: "كيف تبدأ؟" },
        {
          type: "list",
          ordered: true,
          items: ["من القائمة، افتح «الدراسات» واختر «دراسة جديدة».", "اختر الأسئلة الأولية، فتصل إلى الاستبيانين، ويمكنك تعديلهما بعد ذلك.", "شارك رابط «قبل»، ثم رابط «بعد» حين يحين وقته."],
        },
        { type: "cta" },
      ],
    },
    en: {
      title: "New in Satis: before-and-after studies in one report",
      excerpt: "Measure the effect of any change in your store or research by comparing answers before and after it, in one report.",
      mark: "Before/after",
      blocks: [
        { type: "h2", id: "what", text: "What's new" },
        {
          type: "p",
          text: "You can now create a “study” with two surveys: one before a change and one after it. Satis puts the answers in one report that shows the difference for each question.",
        },
        { type: "h2", id: "uses", text: "When to use it" },
        {
          type: "list",
          items: ["Before and after a menu change.", "Before and after training your service team.", "In research that measures a programme's effect on the same participants."],
        },
        {
          type: "callout",
          title: "A participant code links the two answers",
          text: "Each participant enters a short code (for example P-014) in both surveys, so their before and after answers are compared without collecting a name or number. Turn matching off for anonymous studies.",
        },
        { type: "h2", id: "how", text: "How to start" },
        {
          type: "list",
          ordered: true,
          items: ["Open Studies in the menu and choose New study.", "Choose the starting questions; both surveys get them, and you can edit them afterwards.", "Share the “before” link, then the “after” link when it's time."],
        },
        { type: "cta" },
      ],
    },
  },
};
