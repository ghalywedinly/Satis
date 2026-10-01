import { SatisLogo } from "@/components/brand/satis-mark";
import { RatingSlices, SliceHighlight, SpeedLines } from "@/components/brand/slice";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <SatisLogo size={40} tone="ink-ultra" />
      <div className="flex flex-col gap-4">
        <p className="eyebrow">Customer satisfaction platform</p>
        <h1 className="text-[clamp(52px,7vw,96px)] font-extrabold leading-[0.92] tracking-[var(--tracking-display)]">
          Satisfaction, <SliceHighlight>measured.</SliceHighlight>
        </h1>
        <p lang="ar" dir="rtl" className="text-[clamp(28px,3.4vw,40px)] font-bold">
          رضا عملائك، بالأرقام.
        </p>
      </div>
      <div className="max-w-xs">
        <RatingSlices value={4} />
      </div>
      <SpeedLines className="max-w-md" />
    </main>
  );
}
