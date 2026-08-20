import { z } from "zod";

export const lawTargetSchema = z.enum(["eflaw", "law", "admrul", "ordin"]);

export const lawBodyTargetSchema = z.enum([
  "eflaw",
  "eflawjosub",
  "law",
  "lawjosub",
  "admrul",
  "ordin",
]);

export const lawHistoryTargetSchema = z.enum(["lsHstInf", "lsJoHstInf", "delHst"]);

export const normalizedLawDocumentSchema = z.object({
  target: lawTargetSchema,
  id: z.string().nullable(),
  mst: z.string().nullable(),
  title: z.string(),
  promulgationDate: z.string().nullable(),
  proclamationNumber: z.string().nullable(),
  effectiveDate: z.string().nullable(),
  jurisdictionName: z.string().nullable().optional(),
  contentHash: z.string().optional(),
  publicUrl: z.string().url(),
  sourceId: z.string().optional(),
});

export const snapshotManifestSchema = z.object({
  schemaVersion: z.string(),
  mode: z.literal("SNAPSHOT_ONLY"),
  collectedAt: z.string().nullable(),
  verifiedAt: z.string(),
  nextReviewDueAt: z.string(),
  collector: z.string(),
  note: z.string(),
});

export type LawTarget = z.infer<typeof lawTargetSchema>;
export type LawBodyTarget = z.infer<typeof lawBodyTargetSchema>;
export type LawHistoryTarget = z.infer<typeof lawHistoryTargetSchema>;
export type NormalizedLawDocument = z.infer<typeof normalizedLawDocumentSchema>;

export type LawDataResult = {
  mode: "LIVE" | "SNAPSHOT";
  documents: NormalizedLawDocument[];
  collectedAt: string | null;
  verifiedAt: string;
  stale: boolean;
  warnings: string[];
};

export type LawServiceResult = {
  mode: "LIVE" | "SNAPSHOT";
  target: LawBodyTarget;
  rootName: string | null;
  payload: Record<string, unknown> | null;
  contentHash: string | null;
  collectedAt: string;
  warnings: string[];
};

export type LawHistoryResult = {
  mode: "LIVE" | "SNAPSHOT";
  target: LawHistoryTarget;
  rootName: string | null;
  items: Record<string, unknown>[];
  contentHash: string | null;
  collectedAt: string;
  warnings: string[];
};
