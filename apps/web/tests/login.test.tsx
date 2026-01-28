import { render, screen } from "@testing-library/react";

import LoginPage from "../app/login/page";


test("renders login page", () => {
  render(<LoginPage />);
  expect(screen.getByText("Login")).toBeInTheDocument();
});




