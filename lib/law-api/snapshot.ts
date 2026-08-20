import documentsJson from "@/data/snapshots/law-api/documents.json";
import manifestJson from "@/data/snapshots/law-api/manifest.json";
import {
  normalizedLawDocumentSchema,
  snapshotManifestSchema,
  type LawDataResult,
  type LawTarget,
} from "@/lib/law-api/types";
import { z } from "zod";

const manifest = snapshotManifestSchema.parse(manifestJson);
const documents = z.array(normalizedLawDocumentSchema).parse(documentsJson);

export function getSnapshotResult(query = "", target?: LawTarget): LawDataResult {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filtered = documents.filter(
    (document) =>
      (!target || document.target === target) &&
      (!normalizedQuery || document.title.toLocaleLowerCase("ko-KR").includes(normalizedQuery)),
  );
  return {
    mode: "SNAPSHOT",
    documents: filtered,
    collectedAt: manifest.collectedAt,
    verifiedAt: manifest.verifiedAt,
    stale: Date.now() >= Date.parse(manifest.nextReviewDueAt),
    warnings: [manifest.note, "실시간 API 결과가 아니므로 최신 법령 여부를 공식 링크에서 다시 확인하십시오."],
  };
}

export { manifest as lawSnapshotManifest };
