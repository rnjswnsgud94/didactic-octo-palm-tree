import { describe, expect, it } from "vitest";

import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import {
  applyIndustryProfile,
  getIndustryProfile,
  getIndustryProfilePatch,
  industryProfiles,
  industryReviewFieldLabels,
} from "@/lib/data/industry-profiles";

function answers(overrides: Partial<ScenarioAnswers> = {}): ScenarioAnswers {
  return {
    ...catalog.scenarios[0].answers,
    industryCategory: "UNKNOWN",
    chemicalsHandled: null,
    chemicalManufactureOrImport: null,
    hazardousMaterials: null,
    ...overrides,
  };
}

describe("industry profiles", () => {
  it("covers every manufacturing division from KSIC 10 through 34", () => {
    const covered = new Set<number>(
      industryProfiles.flatMap((profile) => profile.ksicDivisions),
    );

    for (let division = 10; division <= 34; division += 1) {
      expect(covered.has(division), `KSIC ${division}`).toBe(true);
    }
  });

  it("uses unique IDs and only declared review fields", () => {
    expect(new Set(industryProfiles.map((profile) => profile.id)).size).toBe(
      industryProfiles.length,
    );

    for (const profile of industryProfiles) {
      expect(profile.reviewKeys.length).toBeGreaterThan(0);
      expect(new Set(profile.reviewKeys).size).toBe(profile.reviewKeys.length);
      for (const key of profile.reviewKeys) {
        expect(industryReviewFieldLabels[key]).toBeTruthy();
      }
    }
  });

  it("keeps automatic values deliberately sparse and never infers a negative", () => {
    for (const profile of industryProfiles) {
      const values = Object.values(profile.initialValues);
      expect(values.length).toBeLessThanOrEqual(2);
      expect(values.every((value) => value === true)).toBe(true);
    }
  });

  it("does not infer permit facts from a chemical industry label", () => {
    const current = answers({ airEmissionFacility: null });
    const applied = applyIndustryProfile(current, "CHEMICAL_PRODUCTS");

    expect(applied.industryCategory).toBe("CHEMICAL_PRODUCTS");
    expect(applied.chemicalsHandled).toBeNull();
    expect(applied.chemicalManufactureOrImport).toBeNull();
    expect(applied.airEmissionFacility).toBeNull();
    expect(applied.hazardousMaterials).toBeNull();
  });

  it("does not overwrite an answer the user has already changed", () => {
    const current = answers({
      chemicalsHandled: false,
      chemicalManufactureOrImport: false,
    });
    const applied = applyIndustryProfile(current, "CHEMICAL_PRODUCTS");

    expect(applied.chemicalsHandled).toBe(false);
    expect(applied.chemicalManufactureOrImport).toBe(false);
  });

  it("returns a minimal patch for UI application", () => {
    const current = answers();

    expect(getIndustryProfilePatch(current, "SEMICONDUCTOR_ELECTRONICS")).toEqual({
      industryCategory: "SEMICONDUCTOR_ELECTRONICS",
    });
    expect(getIndustryProfile("SEMICONDUCTOR_ELECTRONICS")?.reviewKeys).toContain(
      "waterDischargeFacility",
    );
  });

  it("accepts an unknown category without manufacturing permit assumptions", () => {
    const current = answers();
    const applied = applyIndustryProfile(current, "UNKNOWN");

    expect(applied.industryCategory).toBe("UNKNOWN");
    expect(applied.chemicalsHandled).toBeNull();
    expect(applied.hazardousMaterials).toBeNull();
  });
});
