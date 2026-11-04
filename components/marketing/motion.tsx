"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades and lifts its content in when it scrolls into view, once. `index` staggers siblings.
 * Only content that starts below the fold is hidden first, so nothing above the fold flickers,
 * and everything stays visible without JavaScript or with reduced motion (see globals.css).
 */
export function Reveal({ children, index = 0, className }: { children: React.ReactNode; index?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.armed = "";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.shown = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ "--i": index } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Cycles through short lines with a soft cross-fade, like new feedback arriving. */
export function Rotating({ items, interval = 3200, className }: { items: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % items.length), interval);
    return () => window.clearInterval(id);
  }, [items.length, interval]);
  return (
    <span className={cn("relative block", className)}>
      {items.map((item, n) => (
        <span
          key={item}
          className={cn(
            "block truncate transition-[opacity,transform] duration-[320ms] ease-[var(--ease-standard)]",
            n === i ? "opacity-100" : "absolute inset-0 translate-y-1 opacity-0",
          )}
        >
          {item}
        </span>
      ))}
    </span>
  );
}
