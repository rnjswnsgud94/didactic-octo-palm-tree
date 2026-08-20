import { describe, expect, it } from "vitest";

import { isGithubPagesHostname } from "@/app/components/dashboard/LawApiVerifier";

describe("GitHub Pages static mirror", () => {
  it("recognizes GitHub Pages hosts without matching unrelated domains", () => {
    expect(isGithubPagesHostname("rnjswnsgud94.github.io")).toBe(true);
    expect(isGithubPagesHostname("RNJSWNSGUD94.GITHUB.IO")).toBe(true);
    expect(isGithubPagesHostname("factory-permit-dashboard.rnjswnsgud94.chatgpt.site")).toBe(false);
    expect(isGithubPagesHostname("github.io.example.com")).toBe(false);
  });
});
