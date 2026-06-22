import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ButtonSecondary from "../../../components/ButtonSecondary";

describe("ButtonSecondary", () => {
  it("renders children text", () => {
    render(<ButtonSecondary>Cancel</ButtonSecondary>);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ButtonSecondary onClick={onClick}>Cancel</ButtonSecondary>);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
