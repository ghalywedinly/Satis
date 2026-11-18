import { describe, expect, it } from "vitest";
import { publicEnvSchema } from "@/lib/env/schema";

describe("env schema", () => {
  it("ignores whitespace and quotes pasted around values", () => {
    const env = publicEnvSchema.parse({
      NEXT_PUBLIC_SITE_URL: " https://example.com\n",
      NEXT_PUBLIC_SUPABASE_URL: '"https://abc.supabase.co"',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_abc \n",
      NEXT_PUBLIC_POSTHOG_KEY: "  ",
    });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://example.com");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_abc");
    expect(env.NEXT_PUBLIC_POSTHOG_KEY).toBeUndefined();
  });

  it("accepts a Tag Manager container id, treats empty as off, rejects anything else", () => {
    const base = { NEXT_PUBLIC_SITE_URL: "https://example.com" };
    expect(publicEnvSchema.parse({ ...base, NEXT_PUBLIC_GTM_ID: "GTM-MLQV8C9D" }).NEXT_PUBLIC_GTM_ID).toBe("GTM-MLQV8C9D");
    expect(publicEnvSchema.parse({ ...base, NEXT_PUBLIC_GTM_ID: "" }).NEXT_PUBLIC_GTM_ID).toBeUndefined();
    expect(() => publicEnvSchema.parse({ ...base, NEXT_PUBLIC_GTM_ID: "');alert(1);('" })).toThrow();
  });
});
