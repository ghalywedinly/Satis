import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { CoverTone, Post } from "../types";

const TONES: Record<CoverTone, { bg: string; mark: string; a: string; b: string }> = {
  ink: { bg: "bg-ink", mark: "text-sand", a: "bg-ember", b: "bg-ultramarine" },
  ultra: { bg: "bg-ultra-50", mark: "text-ink", a: "bg-ultramarine", b: "bg-ember" },
  ember: { bg: "bg-ember-50", mark: "text-ink", a: "bg-ember", b: "bg-ink" },
  mint: { bg: "bg-mint-50", mark: "text-ink", a: "bg-mint-600", b: "bg-ink" },
  sand: { bg: "bg-sand-200", mark: "text-ink", a: "bg-ink", b: "bg-ultramarine" },
  grape: { bg: "bg-grape-50", mark: "text-ink", a: "bg-grape", b: "bg-ember" },
};

/**
 * A post's cover: its mark word over two slanted slices, in the post's tone. Decorative (the title
 * is always next to it), so it is hidden from screen readers. `large` also shows the post's badge
 * on a Zest plate; keep large covers to one per page so Zest stays the single delight element.
 */
export function PostCover({ post, locale, large = false, className }: { post: Post; locale: Locale; large?: boolean; className?: string }) {
  const tone = TONES[post.cover];
  return (
    <div aria-hidden className={cn("relative flex items-center justify-center overflow-hidden", tone.bg, className)}>
      <span className={cn("slice absolute", tone.a, large ? "-end-10 top-[12%] h-[22%] w-[45%]" : "-end-6 top-[14%] h-[26%] w-[55%]")} />
      <span className={cn("slice absolute", tone.b, large ? "-start-8 bottom-[14%] h-[18%] w-[36%]" : "-start-5 bottom-[12%] h-[20%] w-[40%]")} />
      <span className="relative flex items-center gap-[0.25em]" dir={locale === "ar" && /[؀-ۿ]/.test(post.content[locale].mark) ? "rtl" : "ltr"}>
        <span
          className={cn(
            "font-display leading-none font-extrabold tracking-[-0.05em]",
            tone.mark,
            large ? "text-[clamp(56px,9vw,140px)]" : "text-[clamp(28px,3vw,40px)]",
          )}
        >
          {post.content[locale].mark}
        </span>
        {large && post.badge ? (
          <span dir="ltr" className="slice-lg bg-zest px-[0.4em] py-[0.05em] font-display text-[clamp(32px,5vw,76px)] leading-tight font-extrabold text-ink">
            {post.badge}
          </span>
        ) : null}
      </span>
    </div>
  );
}
