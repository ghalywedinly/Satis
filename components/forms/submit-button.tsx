"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submit button that disables itself and shows progress while its form's action runs. */
export function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending || undefined} {...props}>
      {pending && <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" />}
      {children}
    </Button>
  );
}
