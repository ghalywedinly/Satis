import { Check, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { SatisMark } from "@/components/brand/satis-mark";
import { MiniRating } from "./mockups";

/** The customer survey, as customers see it on their phone. */
export function SurveyScreen({ rating = 5 }: { rating?: number }) {
  const t = useTranslations("home.mock");
  return (
    <div className="flex flex-1 flex-col gap-3 p-3 pt-10">
      <div className="relative flex flex-col gap-3 overflow-hidden rounded-[18px] bg-ink p-4 text-sand">
        <span aria-hidden className="slice-md absolute -end-3 -top-1 h-6 w-[30%] bg-ultramarine" />
        <span className="text-[10px] text-ink-300">{t("rateVisit")}</span>
        <span className="font-display text-lg leading-tight font-extrabold">{t("question")}</span>
        <MiniRating value={rating} dark />
        <div className="flex justify-between text-[10px] text-ink-300">
          <span>{t("poor")}</span>
          <span>{t("excellent")}</span>
        </div>
      </div>
      <div className="flex flex-col rounded-[18px] bg-white text-[11px] font-medium">
        <span className="px-3 pt-3 pb-1 text-[10px] text-muted-foreground">{t("standOut")}</span>
        {[t("speed"), t("staff"), t("wait")].map((item, i) => (
          <span key={item} className="flex items-center justify-between border-t border-sand-100 px-3 py-2">
            {item}
            <span
              className={
                i < 2 ? "flex size-3.5 items-center justify-center rounded-[4px] bg-ultramarine text-white" : "size-3.5 rounded-[4px] border border-ink-200"
              }
            >
              {i < 2 && <Check strokeWidth={3} className="size-2.5" />}
            </span>
          </span>
        ))}
      </div>
      <span className="mt-auto flex h-9 items-center justify-center rounded-[10px] bg-ultramarine text-xs font-semibold text-white">{t("send")}</span>
    </div>
  );
}

/** The thank-you screen after submitting. */
export function ThanksScreen() {
  const t = useTranslations("home.mock");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint-50 text-mint-600">
        <Check strokeWidth={2.5} className="size-7" />
      </span>
      <span className="font-display text-lg leading-tight font-extrabold">{t("thanks")}</span>
      <span className="text-xs text-muted-foreground">{t("thanksBody")}</span>
      <SatisMark tone="ink-ultra" className="mt-4 h-5 w-auto opacity-60" />
    </div>
  );
}

/** A camera viewfinder over a QR code. */
export function ScanScreen({ qrSvg }: { qrSvg: string }) {
  const t = useTranslations("home.mock");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-ink-800 p-5 text-center text-sand">
      <div className="relative rounded-[14px] bg-white p-2">
        <div className="size-28 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <span className="absolute -inset-3 rounded-[20px] border-[3px] border-dashed border-zest" />
      </div>
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        <ScanLine strokeWidth={1.75} className="size-4" />
        {t("scanMe")}
      </span>
    </div>
  );
}
