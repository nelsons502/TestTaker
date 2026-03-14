import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TestTakingUI } from "./TestTakingUI";

vi.mock("@/app/actions/attempts", () => ({
  saveResponse: vi.fn().mockResolvedValue({ error: null }),
  submitAttempt: vi.fn(),
}));

afterEach(() => cleanup());

const baseQuestions = [
  {
    id: "q1",
    section_id: "s1",
    question_type: "multiple_choice",
    content: "What is 2+2?",
    points: 1,
    sectionTitle: "Math",
    options: [
      { id: "opt1", content: "3" },
      { id: "opt2", content: "4" },
    ],
  },
  {
    id: "q2",
    section_id: "s1",
    question_type: "short_answer",
    content: "Name a primary color",
    points: 1,
    sectionTitle: "Math",
    options: [],
  },
  {
    id: "q3",
    section_id: "s2",
    question_type: "essay",
    content: "Explain gravity",
    points: 5,
    sectionTitle: "Science",
    options: [],
  },
];

const defaultProps = {
  testId: "test-1",
  testTitle: "Sample Test",
  attemptId: "attempt-1",
  questions: baseQuestions,
  existingResponses: [],
  deadlineISO: null,
};

describe("TestTakingUI", () => {
  it("renders the first question", () => {
    render(<TestTakingUI {...defaultProps} />);
    expect(screen.getByText("Sample Test")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
  });

  it("navigates between questions", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Name a primary color")).toBeInTheDocument();
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Previous"));
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("disables previous on first question", () => {
    render(<TestTakingUI {...defaultProps} />);
    const prevBtn = screen.getByText("Previous");
    expect(prevBtn).toBeDisabled();
  });

  it("disables next on last question", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    const nextBtn = screen.getByText("Next");
    expect(nextBtn).toBeDisabled();
  });

  it("shows MC options and allows selection", () => {
    render(<TestTakingUI {...defaultProps} />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(2);

    // Click the label containing "4"
    fireEvent.click(radios[1]);
    expect(radios[1].checked).toBe(true);
  });

  it("shows short answer input for short_answer type", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Next"));
    expect(
      screen.getByPlaceholderText("Type your answer...")
    ).toBeInTheDocument();
  });

  it("shows textarea for essay type", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    expect(
      screen.getByPlaceholderText("Write your response...")
    ).toBeInTheDocument();
  });

  it("shows submit modal", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("Submit Test?")).toBeInTheDocument();
    expect(screen.getByText(/0 of 3 questions/)).toBeInTheDocument();
  });

  it("can dismiss submit modal", () => {
    render(<TestTakingUI {...defaultProps} />);
    fireEvent.click(screen.getByText("Submit"));
    fireEvent.click(screen.getByText("Keep Working"));
    expect(screen.queryByText("Submit Test?")).not.toBeInTheDocument();
  });

  it("shows answered count in header", () => {
    render(<TestTakingUI {...defaultProps} />);
    expect(screen.getByText("0/3 answered")).toBeInTheDocument();
  });

  it("restores existing responses", () => {
    render(
      <TestTakingUI
        {...defaultProps}
        existingResponses={[
          { question_id: "q1", answer_text: null, selected_option_id: "opt2" },
        ]}
      />
    );
    expect(screen.getByText("1/3 answered")).toBeInTheDocument();
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[1].checked).toBe(true);
  });

  it("shows timer when deadline is set", () => {
    const future = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    render(<TestTakingUI {...defaultProps} deadlineISO={future} />);
    // Should show roughly 60:00 or 59:59
    expect(screen.getByText(/59:/)).toBeInTheDocument();
  });

  it("shows question sidebar with section grouping", () => {
    render(<TestTakingUI {...defaultProps} />);
    // Sidebar section headers are uppercase
    const mathHeaders = screen.getAllByText("Math");
    expect(mathHeaders.length).toBeGreaterThanOrEqual(1);
    const scienceHeaders = screen.getAllByText("Science");
    expect(scienceHeaders.length).toBeGreaterThanOrEqual(1);
  });
});
