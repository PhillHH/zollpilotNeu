import { render, screen } from "@testing-library/react";

import { CasesClient } from "../app/app/cases/CasesClient";


test("renders cases list", () => {
  render(
    <CasesClient
      initialCases={[
        { id: "1", title: "Case A", status: "DRAFT" },
        { id: "2", title: "Case B", status: "DRAFT" }
      ]}
    />
  );

  expect(screen.getByText("Case A")).toBeInTheDocument();
  expect(screen.getByText("Case B")).toBeInTheDocument();
});

