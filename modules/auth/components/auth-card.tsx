import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared frame for auth pages: white card, title, optional subtitle and footer. */
export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-6 px-0 py-8">
      <CardHeader className="gap-2 px-6 sm:px-8">
        <CardTitle>
          <h1 className="text-[28px] leading-tight font-extrabold">{title}</h1>
        </CardTitle>
        {subtitle && <CardDescription className="text-[15px] text-muted-foreground">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="px-6 sm:px-8">{children}</CardContent>
      {footer && <div className="border-t border-border px-6 pt-6 text-sm text-muted-foreground sm:px-8">{footer}</div>}
    </Card>
  );
}
