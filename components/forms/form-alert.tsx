import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Form-level message. Errors are announced immediately; success politely. */
export function FormAlert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-control px-3 py-2.5 text-sm",
        tone === "error" ? "bg-ember-50 text-ember-700" : "bg-mint-50 text-mint-700",
      )}
    >
      <Icon aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
