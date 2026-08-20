import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { decodeShareState, encodeShareState } from "@/lib/share-state";

describe("versioned share state", () => {
  it("round-trips the whitelisted non-sensitive fields deterministically", () => {
    const answers = catalog.scenarios[2].answers;
    const first = encodeShareState(answers, "SCHEDULE");
    const second = encodeShareState(answers, "SCHEDULE");
    expect(first).toBe(second);
    expect(decodeShareState(first, catalog.scenarios[0].answers)).toEqual({ answers, tab: "SCHEDULE" });
    expect(first).not.toContain("address");
  });

  it("ignores unknown parameters and rejects oversized state", () => {
    const fallback = catalog.scenarios[0].answers;
    const encoded = `${encodeShareState(fallback, "SWIMLANE")}&unexpected=%3Cscript%3E`;
    expect(decodeShareState(encoded, fallback).answers).toEqual(fallback);
    expect(decodeShareState(`v=1&x=${"a".repeat(4_000)}`, fallback).warning).toContain("너무 길어");
  });
});
