import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SignInPage from "@/app/sign-in/[[...sign-in]]/page";
import SignUpPage from "@/app/sign-up/[[...sign-up]]/page";

describe("Clerk auth pages", () => {
  it("renders the Magica sign-in screen", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText("Magica home")).toBeInTheDocument();
    expect(screen.getByText(/to load Clerk sign in/i)).toBeInTheDocument();
  });

  it("renders the Magica sign-up screen", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText("Magica home")).toBeInTheDocument();
    expect(screen.getByText(/to load Clerk sign up/i)).toBeInTheDocument();
  });
});
