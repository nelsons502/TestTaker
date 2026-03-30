import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StartTestButton } from "./StartTestButton";

vi.mock("@/app/actions/attempts", () => ({
  startAttempt: vi.fn(),
}));

afterEach(() => cleanup());

describe("StartTestButton", () => {
  it("shows Start Test when no in-progress attempt", () => {
    render(
      <StartTestButton testId="test-1" inProgressAttemptId={null} />
    );
    expect(
      screen.getByRole("button", { name: "Start Test" })
    ).toBeInTheDocument();
  });

  it("shows Resume and Start New when in-progress attempt exists", () => {
    render(
      <StartTestButton testId="test-1" inProgressAttemptId="attempt-1" />
    );
    expect(screen.getByText("Resume Test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start New Attempt" })
    ).toBeInTheDocument();
  });

  it("resume link points to correct URL", () => {
    render(
      <StartTestButton testId="test-1" inProgressAttemptId="attempt-1" />
    );
    const resumeLink = screen.getByText("Resume Test") as HTMLAnchorElement;
    expect(resumeLink.getAttribute("href")).toBe(
      "/test-1/take?attempt=attempt-1"
    );
  });
});
