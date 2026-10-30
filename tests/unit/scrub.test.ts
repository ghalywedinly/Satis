import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { scrubEvent } from "@/lib/observability/scrub";

describe("scrubEvent", () => {
  it("removes personal data and credentials", () => {
    const event = scrubEvent({
      type: undefined,
      request: {
        url: "https://satis.example/login?email=a@b.co",
        query_string: "email=a@b.co",
        cookies: { "sb-access-token": "secret" },
        data: { password: "x" },
        headers: { authorization: "Bearer x", "user-agent": "UA", cookie: "a=b" },
      },
      user: { id: "user-1", email: "a@b.co", ip_address: "1.2.3.4" },
      extra: { form: { email: "a@b.co", plan: "starter" } },
    } as ErrorEvent);

    expect(event.request).toEqual({ url: "https://satis.example/login", headers: { "user-agent": "UA" } });
    expect(event.user).toEqual({ id: "user-1" });
    expect(event.extra).toEqual({ form: { email: "[redacted]", plan: "starter" } });
  });
});
