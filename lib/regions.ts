export const nonCapitalRegions = [
  "부산광역시",
  "대구광역시",
  "전남광주통합특별시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
] as const;

export function isSupportedNonCapitalProvince(value: string) {
  return (nonCapitalRegions as readonly string[]).includes(value);
}
