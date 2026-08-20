import { readFile } from "node:fs/promises";

const procedures = JSON.parse(await readFile(new URL("../data/catalog/procedures.json", import.meta.url), "utf8"));
const rules = JSON.parse(await readFile(new URL("../data/catalog/rules.json", import.meta.url), "utf8"));
const coverage = JSON.parse(await readFile(new URL("../data/catalog/coverage.json", import.meta.url), "utf8"));

const invalid = procedures.filter((item) => !item.id || !item.reviewedAt || !item.reviewNote);
if (invalid.length) {
  throw new Error(`Production catalog has procedures without review metadata: ${invalid.map((item) => item.id).join(", ")}`);
}

const unverified = procedures.filter((item) => item.verificationStatus === "TODO_LEGAL_REVIEW");
const draftRules = rules.filter((item) => item.status === "DRAFT");
if (!coverage.disclaimer || !coverage.gaps?.length) {
  throw new Error("Production catalog must disclose a disclaimer and coverage gaps.");
}

if (unverified.length || draftRules.length) {
  process.stderr.write(
    `[legal-data warning] ${unverified.length} procedure(s) require legal review and ${draftRules.length} rule(s) remain draft. The UI must keep them downgraded and disclose coverage.\n`,
  );
}
