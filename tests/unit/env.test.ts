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
});
