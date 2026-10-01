export type Locale = "en" | "ar";
export type Answer = "improve" | "good" | "excellent";
export type Topic = "speed" | "staff" | "waiting";

export const LOCALES: Locale[] = ["en", "ar"];

export const isLocale = (value: string): value is Locale => (LOCALES as string[]).includes(value);

export const TOPICS: Topic[] = ["speed", "staff", "waiting"];
export const ANSWERS: Answer[] = ["improve", "good", "excellent"];

export const COPY = {
  en: {
    initials: "LH",
    store: "Nora Café",
    eyebrow: (store: string) => `Rate your visit · ${store}`,
    question: "How was your visit today?",
    poor: "Poor",
    excellent: "Excellent",
    ratingLabel: "Your rating",
    stoodOut: "What stood out?",
    choose: "Rate",
    topics: { speed: "Speed of service", staff: "Staff friendliness", waiting: "Waiting time" },
    answers: { improve: "Could improve", good: "Good", excellent: "Excellent" },
    submit: "Send feedback",
    thanksTitle: "Thanks for your feedback",
    thanksBody: "Your answers go straight to the store team.",
    edit: "Edit answers",
  },
  ar: {
    initials: "ل ح",
    store: "مقهى نورة",
    eyebrow: (store: string) => `قيّم زيارتك · ${store}`,
    question: "كيف كانت زيارتك اليوم؟",
    poor: "ضعيف",
    excellent: "ممتاز",
    ratingLabel: "تقييمك",
    stoodOut: "ما الذي لفت انتباهك؟",
    choose: "قيّم",
    topics: { speed: "سرعة الخدمة", staff: "تعامل الموظفين", waiting: "وقت الانتظار" },
    answers: { improve: "يحتاج تحسين", good: "جيد", excellent: "ممتاز" },
    submit: "أرسل رأيك",
    thanksTitle: "شكرًا على رأيك",
    thanksBody: "تصل إجاباتك مباشرة إلى فريق المتجر.",
    edit: "عدّل إجاباتك",
  },
} as const;
