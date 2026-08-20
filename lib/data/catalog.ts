import { z } from "zod";

import citationsJson from "@/data/catalog/citations.json";
import coverageJson from "@/data/catalog/coverage.json";
import durationsJson from "@/data/catalog/durations.json";
import edgesJson from "@/data/catalog/edges.json";
import legalSourcesJson from "@/data/catalog/legal-sources.json";
import proceduresJson from "@/data/catalog/procedures.json";
import rulesJson from "@/data/catalog/rules.json";
import scenariosJson from "@/data/scenarios/golden.json";
import {
  expandedCitations,
  expandedDurations,
  expandedEdges,
  expandedLegalSources,
  expandedProcedures,
  expandedRules,
} from "@/lib/data/expanded-catalog";
import {
  applicabilityRuleSchema,
  durationEstimateSchema,
  legalCitationSchema,
  legalSourceSchema,
  procedureEdgeSchema,
  procedureSchema,
} from "@/lib/domain/schemas";

const coverageSchema = z.object({
  catalogVersion: z.string(),
  assessmentDefault: z.string(),
  lastLegalReviewAt: z.string(),
  lastLawApiSyncAt: z.string().nullable(),
  snapshotStatus: z.enum(["LIVE", "SNAPSHOT", "SNAPSHOT_ONLY", "STALE"]),
  nextReviewDueAt: z.string(),
  sourceAttribution: z.string(),
  supported: z.object({
    nationwideCommon: z.array(z.string()),
    regions: z.array(z.string()),
    industries: z.array(z.string()),
  }),
  gaps: z.array(z.string()),
  futureLawWarnings: z.array(z.string()),
  disclaimer: z.string(),
});

export const scenarioAnswerSchema = z.object({
  assessmentDate: z.string(),
  investmentType: z.string(),
  province: z.string(),
  city: z.string(),
  insideIndustrialComplex: z.boolean().nullable(),
  industryCategory: z.string(),
  buildingAction: z.string(),
  existingAreaM2: z.number().nullable(),
  increaseAreaM2: z.number().nullable(),
  totalAreaM2: z.number().nullable(),
  landCategory: z.enum(["OTHER", "FARMLAND", "FOREST"]).nullable(),
  demolitionRequired: z.boolean().nullable(),
  roadConnectionRequired: z.boolean().nullable(),
  trafficImpactAssessmentRequired: z.boolean().nullable(),
  permitCoordination: z.string().nullable(),
  airEmissionFacility: z.boolean().nullable(),
  waterDischargeFacility: z.boolean().nullable(),
  environmentalAssessmentType: z.enum(["NONE", "ENVIRONMENTAL", "SMALL"]).nullable(),
  integratedEnvironmentalPermitTarget: z.boolean().nullable(),
  chemicalsHandled: z.boolean().nullable(),
  chemicalManufactureOrImport: z.boolean().nullable(),
  hazardousChemicalBusiness: z.boolean().nullable(),
  hazardousMaterials: z.boolean().nullable(),
  highPressureGas: z.boolean().nullable(),
  specificHighPressureGasUse: z.boolean().nullable(),
  psmCovered: z.boolean().nullable(),
  fireFacilityWork: z.boolean().nullable(),
  privateElectricalFacilityWork: z.boolean().nullable(),
  energyUsePlanRequired: z.boolean().nullable(),
  groundwaterDevelopment: z.boolean().nullable(),
  powerIncreaseMw: z.number().nullable(),
  waterDemandM3Day: z.number().nullable(),
  wastewaterM3Day: z.number().nullable(),
});

const scenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  answers: scenarioAnswerSchema,
});

const additionalRuleIdsByProcedure: Record<string, string[]> = {
  "air-emission-installation-permit": ["rule-exp-air-integrated-exclusion"],
  "water-discharge-installation-permit": ["rule-exp-water-integrated-exclusion"],
};

const procedures = z.array(procedureSchema).parse(
  [...proceduresJson, ...expandedProcedures].map((procedure) => ({
    ...procedure,
    ruleIds: [
      ...procedure.ruleIds,
      ...(additionalRuleIdsByProcedure[procedure.id] ?? []),
    ],
  })),
);
const edges = z.array(procedureEdgeSchema).parse([...edgesJson, ...expandedEdges]);
const rules = z.array(applicabilityRuleSchema).parse([...rulesJson, ...expandedRules]);
const legalSources = z.array(legalSourceSchema).parse([...legalSourcesJson, ...expandedLegalSources]);
const citations = z.array(legalCitationSchema).parse([...citationsJson, ...expandedCitations]);
const durations = z.array(durationEstimateSchema).parse([...durationsJson, ...expandedDurations]);
const coverage = coverageSchema.parse(coverageJson);
const scenarios = z.array(scenarioSchema).parse(scenariosJson);

function assertUnique(label: string, ids: string[]) {
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    throw new Error(`${label} 중복 ID: ${[...new Set(duplicates)].join(", ")}`);
  }
}

function assertCatalogReferences() {
  assertUnique("procedure", procedures.map((item) => item.id));
  assertUnique("edge", edges.map((item) => item.id));
  assertUnique("rule", rules.map((item) => item.id));
  assertUnique("source", legalSources.map((item) => item.id));
  assertUnique("citation", citations.map((item) => item.id));
  assertUnique("duration", durations.map((item) => item.id));

  const procedureIds = new Set(procedures.map((item) => item.id));
  const ruleIds = new Set(rules.map((item) => item.id));
  const sourceIds = new Set(legalSources.map((item) => item.id));
  const citationIds = new Set(citations.map((item) => item.id));
  const durationIds = new Set(durations.map((item) => item.id));

  for (const citation of citations) {
    if (!sourceIds.has(citation.sourceId)) {
      throw new Error(`citation ${citation.id}: source ${citation.sourceId} 없음`);
    }
  }

  for (const rule of rules) {
    if (!procedureIds.has(rule.procedureId)) {
      throw new Error(`rule ${rule.id}: procedure ${rule.procedureId} 없음`);
    }
    for (const citationId of rule.citationIds) {
      if (!citationIds.has(citationId)) {
        throw new Error(`rule ${rule.id}: citation ${citationId} 없음`);
      }
    }
  }

  for (const procedure of procedures) {
    for (const ruleId of procedure.ruleIds) {
      if (!ruleIds.has(ruleId)) throw new Error(`procedure ${procedure.id}: rule ${ruleId} 없음`);
    }
    for (const citationId of procedure.citationIds) {
      if (!citationIds.has(citationId)) {
        throw new Error(`procedure ${procedure.id}: citation ${citationId} 없음`);
      }
    }
    if (procedure.durationId && !durationIds.has(procedure.durationId)) {
      throw new Error(`procedure ${procedure.id}: duration ${procedure.durationId} 없음`);
    }
  }

  for (const edge of edges) {
    if (!procedureIds.has(edge.from) || !procedureIds.has(edge.to)) {
      throw new Error(`edge ${edge.id}: procedure 참조 없음`);
    }
    if (edge.conditionRuleId && !ruleIds.has(edge.conditionRuleId)) {
      throw new Error(`edge ${edge.id}: rule ${edge.conditionRuleId} 없음`);
    }
    for (const citationId of edge.citationIds) {
      if (!citationIds.has(citationId)) {
        throw new Error(`edge ${edge.id}: citation ${citationId} 없음`);
      }
    }
  }

  const adjacency = new Map<string, string[]>();
  const indegree = new Map(procedures.map((item) => [item.id, 0]));
  for (const edge of edges) {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort();
  let visited = 0;
  while (queue.length) {
    const id = queue.shift()!;
    visited += 1;
    for (const next of (adjacency.get(id) ?? []).sort()) {
      const value = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, value);
      if (value === 0) queue.push(next);
    }
    queue.sort();
  }
  if (visited !== procedures.length) throw new Error("procedure edge graph에 순환이 있습니다.");
}

assertCatalogReferences();

export const catalog = {
  procedures,
  edges,
  rules,
  legalSources,
  citations,
  durations,
  coverage,
  scenarios,
} as const;

export type ScenarioAnswers = z.infer<typeof scenarioAnswerSchema>;
