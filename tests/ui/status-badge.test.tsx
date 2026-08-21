import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/app/components/dashboard/StatusBadge";

describe("StatusBadge", () => {
  it("uses a generic deeming label instead of calling every parent an one-stop process", () => {
    render(<StatusBadge status="DOES_NOT_APPLY" isDeemed />);

    expect(screen.getByText("상위 절차에서 의제 처리")).toBeInTheDocument();
    expect(screen.queryByText("일괄처리로 충족")).not.toBeInTheDocument();
  });
});
