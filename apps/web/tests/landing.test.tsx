import { render, screen } from "@testing-library/react";

import { Landing } from "../app/components/Landing";


test("renders landing headline", () => {
  render(<Landing health={null} />);
  expect(screen.getByText("ZollPilot")).toBeInTheDocument();
});




