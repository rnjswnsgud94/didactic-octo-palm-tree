import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLawHistory } from "@/lib/law-api/service.server";
import { lawHistoryTargetSchema } from "@/lib/law-api/types";

const requestSchema = z.object({ target: lawHistoryTargetSchema, date: z.string().regex(/^\d{8}$/) });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({ target: url.searchParams.get("target") ?? "lsHstInf", date: url.searchParams.get("date") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "변경이력 조회대상 또는 날짜가 올바르지 않습니다." }, { status: 400 });
  return NextResponse.json(await fetchLawHistory(parsed.data), { headers: { "Cache-Control": "private, max-age=60", "X-Content-Type-Options": "nosniff" } });
}
