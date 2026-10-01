import { describe, expect, it } from "vitest";
import { loadMessages } from "@/locales";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...out, [path]: value } : { ...out, ...flatten(value, path) };
  }, {});
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)[^}]*\}|<(\w+)>/g)].map((m) => m[1] ?? m[2]).sort();

describe("translations", async () => {
  const ar = flatten((await loadMessages("ar")) as unknown as Tree);
  const en = flatten((await loadMessages("en")) as unknown as Tree);

  it("Arabic and English define exactly the same keys", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("no message is empty", () => {
    for (const [key, value] of Object.entries({ ...ar, ...en })) expect(value.trim(), key).not.toBe("");
  });

  it("placeholders and rich-text tags match between languages", () => {
    for (const key of Object.keys(en)) expect(placeholders(ar[key] ?? ""), key).toEqual(placeholders(en[key]));
  });

  it("Arabic messages are actually Arabic", () => {
    const latinOnly = Object.entries(ar).filter(([key, value]) => !/[؀-ۿ]/.test(value) && !key.startsWith("common.language."));
    expect(latinOnly).toEqual([]);
  });
});
