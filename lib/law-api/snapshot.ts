import documentsJson from "@/data/snapshots/law-api/documents.json";
import manifestJson from "@/data/snapshots/law-api/manifest.json";
import legalSourcesJson from "@/data/catalog/legal-sources.json";
import { expandedLegalSources } from "@/lib/data/expanded-catalog";
import { legalSourceSchema } from "@/lib/domain/schemas";
import {
  normalizedLawDocumentSchema,
  snapshotManifestSchema,
  type LawDataResult,
  type LawTarget,
} from "@/lib/law-api/types";
import { z } from "zod";

const manifest = snapshotManifestSchema.parse(manifestJson);
const storedDocuments = z.array(normalizedLawDocumentSchema).parse(documentsJson);
const catalogSources = z.array(legalSourceSchema).parse([
  ...legalSourcesJson,
  ...expandedLegalSources,
]);
const generatedDocuments = catalogSources
  .filter((source) => ["ACT", "ENFORCEMENT_DECREE", "ENFORCEMENT_RULE"].includes(source.documentType))
  .map((source) => normalizedLawDocumentSchema.parse({
    target: "eflaw",
    id: source.lawId,
    mst: source.mst,
    title: source.title,
    promulgationDate: source.proclamationDate?.replaceAll("-", "") ?? null,
    proclamationNumber: source.proclamationNumber,
    effectiveDate: source.effectiveDate?.replaceAll("-", "") ?? null,
    contentHash: source.contentHash,
    publicUrl: source.officialUrl,
    sourceId: source.id,
  }));
const documents = [...new Map([...storedDocuments, ...generatedDocuments].map((document) => [document.sourceId ?? `${document.target}:${document.title}`, document])).values()];

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
