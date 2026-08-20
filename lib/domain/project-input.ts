import type { Fact, ProjectInput } from "@/lib/domain/schemas";
import type { ScenarioAnswers } from "@/lib/data/catalog";

export function known(value: NonNullable<Fact["value"]>, unit?: string): Fact {
  return {
    status: "KNOWN",
    value,
    ...(unit ? { unit } : {}),
    source: "사용자 입력",
  };
}

export function unknown(): Fact {
  return { status: "UNKNOWN" };
}

export function notApplicable(): Fact {
  return { status: "NOT_APPLICABLE" };
}

function nullableFact(
  value: string | number | boolean | string[] | null,
  unit?: string,
): Fact {
  return value === null ? unknown() : known(value, unit);
}

export function scenarioAnswersToProjectInput(answers: ScenarioAnswers): ProjectInput {
  const inside = nullableFact(answers.insideIndustrialComplex);
  const hasBuildingWork = answers.buildingAction !== "NONE";
  return {
    assessmentDate: answers.assessmentDate,
    investmentType: known(answers.investmentType),
    location: {
      province: known(answers.province),
      city: known(answers.city),
      address: unknown(),
      capitalRegionControlArea: unknown(),
    },
    industrialComplex: {
      inside,
      type:
        answers.insideIndustrialComplex === true ? unknown() : notApplicable(),
      identifier:
        answers.insideIndustrialComplex === true ? unknown() : notApplicable(),
      occupancyContractHeld:
        answers.insideIndustrialComplex === true ? unknown() : notApplicable(),
      managingAuthority:
        answers.insideIndustrialComplex === true ? unknown() : notApplicable(),
    },
    industry: {
      category: known(answers.industryCategory),
      ksic: unknown(),
      products: unknown(),
      coreProcesses: unknown(),
    },
    site: {
      zoning: unknown(),
      landCategory: unknown(),
      ownership: unknown(),
      developmentAreaM2: unknown(),
      restrictedFactors: unknown(),
    },
    building: {
      action: known(answers.buildingAction),
      existingAreaM2: nullableFact(answers.existingAreaM2, "m2"),
      increaseAreaM2: nullableFact(answers.increaseAreaM2, "m2"),
      totalAreaM2: nullableFact(answers.totalAreaM2, "m2"),
    },
    environment: {
      airEmissionFacility: nullableFact(answers.airEmissionFacility),
      waterDischargeFacility: nullableFact(answers.waterDischargeFacility),
      wasteFacility: unknown(),
      chemicalsHandled: nullableFact(answers.chemicalsHandled),
    },
    safety: {
      hazardousMaterials: unknown(),
      highPressureGas: unknown(),
      psmCovered: nullableFact(answers.psmCovered),
    },
    utilities: {
      powerIncreaseMw: nullableFact(answers.powerIncreaseMw, "MW"),
      waterDemandM3Day: nullableFact(answers.waterDemandM3Day, "m3/day"),
      wastewaterM3Day: nullableFact(answers.wastewaterM3Day, "m3/day"),
    },
    permitCoordination: nullableFact(answers.permitCoordination),
    strategicIndustrySpecialCase: unknown(),
    existingApprovalIds: hasBuildingWork ? known([]) : notApplicable(),
  };
}
