import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdminSidebar } from "./AdminSidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/tests",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => cleanup());

describe("AdminSidebar", () => {
  it("renders the sidebar with TestTaker branding", () => {
    render(<AdminSidebar fullName="John Doe" />);
    expect(screen.getByText("TestTaker")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("shows the admin name", () => {
    render(<AdminSidebar fullName="Jane Smith" />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("falls back to Admin when no name provided", () => {
    render(<AdminSidebar fullName={null} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows navigation links", () => {
    render(<AdminSidebar fullName="Test" />);
    expect(screen.getByRole("link", { name: "Tests" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("has a sign out button", () => {
    render(<AdminSidebar fullName="Test" />);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("highlights the active Tests link", () => {
    render(<AdminSidebar fullName="Test" />);
    const testsLink = screen.getByRole("link", { name: "Tests" });
    expect(testsLink.className).toContain("bg-blue-50");
  });
});
