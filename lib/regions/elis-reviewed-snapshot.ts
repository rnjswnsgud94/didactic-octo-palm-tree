import type { OfficialOrdinanceRecord } from "@/lib/regions/ordinance-resolution";
import {
  buildElisOrdinanceDetailUrl,
  type OrdinanceGovernmentLevel,
} from "@/lib/regions/local-ordinances";

export const reviewedElisSnapshotCheckedAt = "2026-08-21T00:00:00.000Z";

type ReviewedElisOrdinanceRecord = OfficialOrdinanceRecord & {
  provinceName: string;
};

/**
 * Exact ELIS links manually verified for static builds that cannot call the
 * server route. Broad jurisdiction-list links deliberately do not belong here.
 */
const reviewedRecords: readonly ReviewedElisOrdinanceRecord[] = [
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 군계획 조례",
    amendmentDate: "2025-12-10",
    url: buildElisOrdinanceDetailUrl(
      "무주군 군계획 조례",
      "52730112237002",
      "018",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 건축 조례",
    amendmentDate: "2025-11-05",
    url: buildElisOrdinanceDetailUrl(
      "무주군 건축 조례",
      "52730107323003",
      "016",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 주차장 설치 및 관리 조례",
    amendmentDate: "2025-12-10",
    url: buildElisOrdinanceDetailUrl(
      "무주군 주차장 설치 및 관리 조례",
      "52730111299005",
      "006",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 폐기물관리 및 수수료 부과ㆍ징수에 관한 조례",
    amendmentDate: "2024-07-01",
    url: buildElisOrdinanceDetailUrl(
      "무주군 폐기물관리 및 수수료 부과ㆍ징수에 관한 조례",
      "52730124297007",
      "008",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 상수도 급수 조례",
    amendmentDate: "2024-07-01",
    url: buildElisOrdinanceDetailUrl(
      "무주군 상수도 급수 조례",
      "52730129345001",
      "012",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 상수도 원인자부담금 산정ㆍ징수 등에 관한 조례",
    amendmentDate: "2015-07-03",
    url: buildElisOrdinanceDetailUrl(
      "무주군 상수도 원인자부담금 산정ㆍ징수 등에 관한 조례",
      "52730129345008",
      "001",
    ),
  },
  {
    provinceName: "전북특별자치도",
    jurisdictionName: "무주군",
    level: "MUNICIPALITY",
    name: "무주군 하수도 사용 조례",
    amendmentDate: "2025-03-12",
    url: buildElisOrdinanceDetailUrl(
      "무주군 하수도 사용 조례",
      "52730129348001",
      "006",
    ),
  },
] as const;

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
