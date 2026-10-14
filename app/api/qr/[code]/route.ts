import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/observability/analytics";
import { qrPng, qrSvg } from "@/lib/qr";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { surveyUrl } from "@/modules/surveys/links";

/**
 * QR image for a survey link, for members of its business only (RLS on survey_links).
 * ?format=svg|png, &download=1 to save it as a file.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/qr/[code]">) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user || !/^[A-Za-z0-9]{8,16}$/.test(code)) return new NextResponse(null, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: link } = await supabase.from("survey_links").select("organization_id").eq("public_code", code).maybeSingle();
  if (!link) return new NextResponse(null, { status: 404 });

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const download = request.nextUrl.searchParams.get("download") === "1";
  const url = surveyUrl(code);
  const headers: Record<string, string> = {
    "Content-Type": format === "png" ? "image/png" : "image/svg+xml",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="satis-qr-${code}.${format}"`;
    captureServerEvent("qr_downloaded", user.id, { organization_id: link.organization_id, format });
  }

  const body = format === "png" ? new Uint8Array(await qrPng(url)) : await qrSvg(url);
  return new NextResponse(body, { headers });
}
