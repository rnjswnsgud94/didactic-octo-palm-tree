import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLawBody } from "@/lib/law-api/service.server";
import { lawBodyTargetSchema } from "@/lib/law-api/types";

const requestSchema = z.object({
  target: lawBodyTargetSchema,
  mst: z.string().trim().max(40).optional(),
  id: z.string().trim().max(40).optional(),
  jo: z.string().trim().regex(/^\d{1,10}$/).optional(),
}).refine((value) => Boolean(value.mst || value.id), { message: "MST 또는 ID가 필요합니다." });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({ target: url.searchParams.get("target") ?? "eflaw", mst: url.searchParams.get("mst") || undefined, id: url.searchParams.get("id") || undefined, jo: url.searchParams.get("jo") || undefined });
  if (!parsed.success) return NextResponse.json({ error: "본문 조회대상 또는 식별자가 올바르지 않습니다." }, { status: 400 });
  return NextResponse.json(await fetchLawBody(parsed.data), { headers: { "Cache-Control": "private, max-age=60", "X-Content-Type-Options": "nosniff" } });
}
