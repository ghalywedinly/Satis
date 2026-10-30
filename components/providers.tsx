"use client";

import { Direction } from "radix-ui";

/** Client-side context shared by every page: text direction for Radix primitives (menus, keyboard navigation). */
export function Providers({ dir, children }: { dir: "rtl" | "ltr"; children: React.ReactNode }) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}
