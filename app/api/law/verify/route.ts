import { NextResponse } from "next/server";
import { z } from "zod";

import { searchLawApi } from "@/lib/law-api/client.server";
import { fetchLawBody } from "@/lib/law-api/service.server";

const requestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  mst: z.string().trim().max(40).optional(),
  jo: z.string().trim().regex(/^\d{1,10}$/).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    title: url.searchParams.get("title") ?? "",
    mst: url.searchParams.get("mst") || undefined,
    jo: url.searchParams.get("jo") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "법령명 또는 조문 식별자가 올바르지 않습니다." }, { status: 400 });
  }

  const search = await searchLawApi({ target: "eflaw", query: parsed.data.title });
  const exact = search.documents.find((document) => document.title === parsed.data.title)
    ?? search.documents[0]
    ?? null;
  const identifier = parsed.data.mst ?? exact?.mst ?? undefined;
  const body = search.mode === "LIVE" && identifier
    ? await fetchLawBody({ target: parsed.data.jo ? "eflawjosub" : "eflaw", mst: identifier, jo: parsed.data.jo })
    : null;

  return NextResponse.json({
    mode: body?.mode ?? search.mode,
    document: exact,
    search: {
      mode: search.mode,
      collectedAt: search.collectedAt,
      verifiedAt: search.verifiedAt,
      stale: search.stale,
    },
    body: body ? {
      mode: body.mode,
      rootName: body.rootName,
      contentHash: body.contentHash,
      collectedAt: body.collectedAt,
    } : null,
    warnings: [...search.warnings, ...(body?.warnings ?? [])],
  }, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
