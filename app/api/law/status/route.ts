import { NextResponse } from "next/server";

import { lawSnapshotManifest } from "@/lib/law-api/snapshot";

export async function GET() {
  return NextResponse.json({
    mode: process.env.LAW_API_OC ? "LIVE_AVAILABLE" : "SNAPSHOT_ONLY",
    verifiedAt: lawSnapshotManifest.verifiedAt,
    collectedAt: lawSnapshotManifest.collectedAt,
    nextReviewDueAt: lawSnapshotManifest.nextReviewDueAt,
    source: "법제처 국가법령정보센터",
  });
}
