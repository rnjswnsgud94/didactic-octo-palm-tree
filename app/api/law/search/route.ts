import { NextResponse } from "next/server";
import { z } from "zod";

import { searchLawApi } from "@/lib/law-api/client.server";
import { lawTargetSchema } from "@/lib/law-api/types";

const requestSchema = z.object({
  query: z.string().trim().max(80),
  target: lawTargetSchema.default("eflaw"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    query: url.searchParams.get("query") ?? "",
    target: url.searchParams.get("target") ?? "eflaw",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "검색어 또는 조회대상이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  const result = await searchLawApi(parsed.data);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
