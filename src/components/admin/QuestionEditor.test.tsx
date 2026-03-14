import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QuestionEditor } from "./QuestionEditor";

// Mock the server actions
vi.mock("@/app/actions/questions", () => ({
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
}));

afterEach(() => cleanup());

describe("QuestionEditor", () => {
  const defaultProps = {
    testId: "test-1",
    sectionId: "section-1",
    onClose: vi.fn(),
  };

  it("renders new question form with multiple choice as default", () => {
    render(<QuestionEditor {...defaultProps} />);
    expect(screen.getByText("New Question")).toBeInTheDocument();
    expect(screen.getByText("Question Type")).toBeInTheDocument();
    expect(screen.getByText("Answer Options")).toBeInTheDocument();
  });

  it("shows true/false options when TF type selected", () => {
    render(<QuestionEditor {...defaultProps} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "true_false" } });
    expect(screen.getByText("Correct Answer")).toBeInTheDocument();
  });

  it("shows accepted answers field for short answer type", () => {
    render(<QuestionEditor {...defaultProps} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "short_answer" } });
    expect(
      screen.getByText("Accepted Answers (one per line)")
    ).toBeInTheDocument();
  });

  it("shows essay instructions for essay type", () => {
    render(<QuestionEditor {...defaultProps} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "essay" } });
    expect(screen.getByText(/manually graded/i)).toBeInTheDocument();
  });

  it("renders edit form with existing question data", () => {
    const question = {
      id: "q-1",
      section_id: "section-1",
      question_type: "short_answer" as const,
      content: "What is 2+2?",
      explanation: "Basic math",
      points: 2,
      sort_order: 0,
      accepted_answers: ["4", "four"],
      created_at: "2024-01-01T00:00:00Z",
    };

    render(<QuestionEditor {...defaultProps} question={question} />);
    expect(screen.getByText("Edit Question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Basic math")).toBeInTheDocument();
  });

  it("allows adding MC options", () => {
    render(<QuestionEditor {...defaultProps} />);
    const optionInputs = screen.getAllByPlaceholderText(/Option [A-F]/);
    expect(optionInputs).toHaveLength(4);

    fireEvent.click(screen.getByText("+ Add Option"));
    expect(screen.getAllByPlaceholderText(/Option [A-F]/)).toHaveLength(5);
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<QuestionEditor {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
