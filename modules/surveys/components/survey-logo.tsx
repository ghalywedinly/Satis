import { cn } from "@/lib/utils";
import type { SurveyLogo } from "../definition";

const POSITION: Record<SurveyLogo["position"], string> = { start: "justify-start", center: "justify-center", end: "justify-end" };
const SIZE: Record<SurveyLogo["size"], string> = { sm: "h-8 max-w-[45%]", md: "h-12 max-w-[60%]", lg: "h-16 max-w-[75%]" };

/** The business's logo at the top of its survey, where and as big as it chose. */
export function SurveyLogoImage({ logo, alt, className }: { logo: SurveyLogo; alt: string; className?: string }) {
  return (
    <div className={cn("flex", POSITION[logo.position], className)}>
      {/* A small embedded image (data URL), so there is nothing for next/image to optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.src} alt={alt} className={cn("w-auto object-contain", SIZE[logo.size])} />
    </div>
  );
}
