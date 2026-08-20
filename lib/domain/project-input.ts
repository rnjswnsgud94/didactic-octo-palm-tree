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

function choiceFact(value: string): Fact {
  const normalized = value.trim();
  return !normalized || normalized === "UNKNOWN" ? unknown() : known(normalized);
}

export function scenarioAnswersToProjectInput(answers: ScenarioAnswers): ProjectInput {
  const inside = nullableFact(answers.insideIndustrialComplex);
  return {
    assessmentDate: answers.assessmentDate,
    ...(answers.plannedConstructionStartDate
      ? { plannedConstructionStart: answers.plannedConstructionStartDate }
      : {}),
    ...(answers.plannedConstructionEndDate
      ? { plannedCompletion: answers.plannedConstructionEndDate }
      : {}),
    investmentType: choiceFact(answers.investmentType),
    location: {
      province: choiceFact(answers.province),
      city: answers.city.trim() ? known(answers.city.trim()) : unknown(),
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
      category: choiceFact(answers.industryCategory),
      ksic: unknown(),
      products: unknown(),
      coreProcesses: unknown(),
    },
    site: {
      zoning: unknown(),
      landCategory: nullableFact(answers.landCategory),
      ownership: unknown(),
      developmentAreaM2: nullableFact(answers.totalAreaM2, "m2"),
      restrictedFactors: unknown(),
      demolitionRequired: nullableFact(answers.demolitionRequired),
      roadConnectionRequired: nullableFact(answers.roadConnectionRequired),
      trafficImpactAssessmentRequired: nullableFact(answers.trafficImpactAssessmentRequired),
      groundwaterDevelopment: nullableFact(answers.groundwaterDevelopment),
      disasterImpactAssessmentType: nullableFact(answers.disasterImpactAssessmentType),
      undergroundSafetyAssessmentType: nullableFact(answers.undergroundSafetyAssessmentType),
      nationalHeritageAssessmentType: nullableFact(answers.nationalHeritageAssessmentType),
      militaryProtectionConsultationRequired: nullableFact(answers.militaryProtectionConsultationRequired),
      riverOccupationRequired: nullableFact(answers.riverOccupationRequired),
      publicWaterOccupationRequired: nullableFact(answers.publicWaterOccupationRequired),
      waterSourceProtectionZone: nullableFact(answers.waterSourceProtectionZone),
    },
    building: {
      action: choiceFact(answers.buildingAction),
      mechanicalEquipmentActTarget: nullableFact(answers.mechanicalEquipmentActTarget),
      existingAreaM2: nullableFact(answers.existingAreaM2, "m2"),
      increaseAreaM2: nullableFact(answers.increaseAreaM2, "m2"),
      totalAreaM2: nullableFact(answers.totalAreaM2, "m2"),
      fireFacilityWork: nullableFact(answers.fireFacilityWork),
    },
    environment: {
      airEmissionFacility: nullableFact(answers.airEmissionFacility),
      waterDischargeFacility: nullableFact(answers.waterDischargeFacility),
      wasteFacility: nullableFact(answers.wasteFacility),
      chemicalsHandled: nullableFact(answers.chemicalsHandled),
      environmentalAssessmentType: nullableFact(answers.environmentalAssessmentType),
      integratedPermitTarget: nullableFact(answers.integratedEnvironmentalPermitTarget),
      chemicalManufactureOrImport: nullableFact(answers.chemicalManufactureOrImport),
      hazardousChemicalBusiness: nullableFact(answers.hazardousChemicalBusiness),
      chemicalRegistrationRequired: nullableFact(answers.chemicalRegistrationRequired),
      restrictedOrToxicChemicalImport: nullableFact(answers.restrictedOrToxicChemicalImport),
    },
    safety: {
      hazardousMaterials: nullableFact(answers.hazardousMaterials),
      highPressureGas: nullableFact(answers.highPressureGas),
      specificHighPressureGasUse: nullableFact(answers.specificHighPressureGasUse),
      lpgSpecificUseFacility: nullableFact(answers.lpgSpecificUseFacility),
      cityGasSpecificUseFacility: nullableFact(answers.cityGasSpecificUseFacility),
      psmCovered: nullableFact(answers.psmCovered),
      fireSafetyManagerRequired: nullableFact(answers.fireSafetyManagerRequired),
      hazardousMaterialsTank: nullableFact(answers.hazardousMaterialsTank),
      hazardousMaterialsPreventionRulesRequired: nullableFact(answers.hazardousMaterialsPreventionRulesRequired),
      heatUseEquipment: nullableFact(answers.heatUseEquipment),
      hazardousMachineryInspectionRequired: nullableFact(answers.hazardousMachineryInspectionRequired),
    },
    construction: {
      safetyManagementPlanRequired: nullableFact(answers.safetyManagementPlanRequired),
      specificWorkReportRequired: nullableFact(answers.specificWorkReportRequired),
      asbestosPresent: nullableFact(answers.asbestosPresent),
    },
    utilities: {
      powerIncreaseMw: nullableFact(answers.powerIncreaseMw, "MW"),
      waterDemandM3Day: nullableFact(answers.waterDemandM3Day, "m3/day"),
      wastewaterM3Day: nullableFact(answers.wastewaterM3Day, "m3/day"),
      privateElectricalFacilityWork: nullableFact(answers.privateElectricalFacilityWork),
      energyUsePlanRequired: nullableFact(answers.energyUsePlanRequired),
      publicSewerConnection: nullableFact(answers.publicSewerConnection),
      privateSewageTreatmentFacility: nullableFact(answers.privateSewageTreatmentFacility),
    },
    organization: {
      safetyManagerRequired: nullableFact(answers.safetyManagerRequired),
      healthManagerRequired: nullableFact(answers.healthManagerRequired),
    },
    permitCoordination: nullableFact(answers.permitCoordination),
    strategicIndustrySpecialCase: unknown(),
    existingApprovalIds:
      answers.buildingAction === "NONE"
        ? notApplicable()
        : answers.buildingAction === "UNKNOWN"
          ? unknown()
          : known([]),
  };
}
