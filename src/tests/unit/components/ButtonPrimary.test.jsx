import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ButtonPrimary from "../../../components/ButtonPrimary";

describe("ButtonPrimary", () => {
  it("renders children text", () => {
    render(<ButtonPrimary>Click me</ButtonPrimary>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ButtonPrimary onClick={onClick}>Click</ButtonPrimary>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<ButtonPrimary disabled>Click</ButtonPrimary>);
    const button = screen.getByText("Click");
    expect(button).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<ButtonPrimary disabled onClick={onClick}>Click</ButtonPrimary>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<ButtonPrimary className="custom-class">Click</ButtonPrimary>);
    expect(screen.getByText("Click")).toHaveClass("custom-class");
  });
});
