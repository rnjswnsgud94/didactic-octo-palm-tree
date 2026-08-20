import generatedSnapshot from "@/lib/regions/elis-reviewed-snapshot.generated.json";
import type { OfficialOrdinanceRecord } from "@/lib/regions/ordinance-resolution";
import {
  isElisOrdinanceDetailUrl,
  type OrdinanceGovernmentLevel,
} from "@/lib/regions/local-ordinances";

export const reviewedElisSnapshotCheckedAt = generatedSnapshot.checkedAt;
export const reviewedElisSnapshotJurisdictionCount =
  generatedSnapshot.jurisdictionCount;
export const reviewedElisSnapshotCoveredJurisdictionCount =
  generatedSnapshot.coveredJurisdictionCount;

type ReviewedElisOrdinanceRecord = OfficialOrdinanceRecord & {
  provinceName: string;
};

function isReviewedRecord(
  value: (typeof generatedSnapshot.records)[number],
): value is (typeof generatedSnapshot.records)[number] & ReviewedElisOrdinanceRecord {
  return (
    Boolean(value.provinceName.trim()) &&
    Boolean(value.jurisdictionName.trim()) &&
    (value.level === "PROVINCE" || value.level === "MUNICIPALITY") &&
    Boolean(value.name.trim()) &&
    isElisOrdinanceDetailUrl(value.url)
  );
}

/**
 * Last-known-good exact ELIS links generated from each jurisdiction's official
 * current-ordinance table. Invalid, broad-list and unscoped records are never
 * exposed to the UI.
 */
const reviewedRecords: readonly ReviewedElisOrdinanceRecord[] =
  generatedSnapshot.records.filter(isReviewedRecord);

export function getReviewedElisOrdinanceRecords(
  provinceName: string,
  jurisdictionName: string,
  level: OrdinanceGovernmentLevel,
): OfficialOrdinanceRecord[] {
  return reviewedRecords
    .filter(
      (record) =>
        record.provinceName === provinceName &&
        record.jurisdictionName === jurisdictionName &&
        record.level === level,
    )
    .map((record) => ({
      name: record.name,
      level: record.level,
      jurisdictionName: record.jurisdictionName,
      amendmentDate: record.amendmentDate,
      url: record.url,
    }));
}
