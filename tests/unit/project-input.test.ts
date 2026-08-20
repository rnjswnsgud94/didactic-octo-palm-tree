import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { scenarioAnswersToProjectInput } from "@/lib/domain/project-input";

describe("project input normalization", () => {
  it("keeps an unselected province and choice sentinels unknown", () => {
    const input = scenarioAnswersToProjectInput({
      ...catalog.scenarios[0].answers,
      province: "",
      city: "",
      investmentType: "UNKNOWN",
      industryCategory: "UNKNOWN",
      buildingAction: "UNKNOWN",
    });

    expect(input.location.province).toEqual({ status: "UNKNOWN" });
    expect(input.location.city).toEqual({ status: "UNKNOWN" });
    expect(input.investmentType).toEqual({ status: "UNKNOWN" });
    expect(input.industry.category).toEqual({ status: "UNKNOWN" });
    expect(input.building.action).toEqual({ status: "UNKNOWN" });
    expect(input.existingApprovalIds).toEqual({ status: "UNKNOWN" });
  });
});
