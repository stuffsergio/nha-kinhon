import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../../../components/ErrorBoundary";

const GoodChild = () => <div>Everything is fine</div>;
const BadChild = () => {
  throw new Error("Test error message");
};

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Everything is fine")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByText("Recargar página")).toBeInTheDocument();
    console.error.mockRestore();
  });
});
