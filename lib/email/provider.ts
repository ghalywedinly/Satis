import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env/server";

export type EmailMessage = { to: string; subject: string; html: string; text: string; locale: "ar" | "en" };

/** Transactional email transport. Swap the implementation without touching callers. */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ResendProvider implements EmailProvider {
  constructor(
    private readonly client: Resend,
    private readonly from: string,
  ) {}

  async send({ to, subject, html, text }: EmailMessage) {
    const { error } = await this.client.emails.send({ from: this.from, to, subject, html, text });
    if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
  }
}

/**
 * DEVELOPMENT ONLY: prints emails to the server log, and writes them to EMAIL_OUTBOX_DIR
 * when set (used by end-to-end tests to open verification links).
 */
class DevOutboxProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.info(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
    const dir = serverEnv.EMAIL_OUTBOX_DIR;
    if (!dir) return;
    await mkdir(dir, { recursive: true });
    const file = `${Date.now()}-${message.to.replace(/[^a-z0-9@.]/gi, "_")}.json`;
    await writeFile(path.join(dir, file), JSON.stringify(message, null, 2));
  }
}

export function getEmailProvider(): EmailProvider {
  if (serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM) {
    return new ResendProvider(new Resend(serverEnv.RESEND_API_KEY), serverEnv.EMAIL_FROM);
  }
  if (serverEnv.APP_ENV !== "development") throw new Error("Email is not configured (RESEND_API_KEY, EMAIL_FROM).");
  return new DevOutboxProvider();
}
