import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCategories, useCategory } from "../../../hooks/useCategories";

vi.mock("../../../services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "../../../services/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return categories data", async () => {
    const mockData = {
      categories: [
        { id: 1, name: "Frutas" },
        { id: 2, name: "Verduras" },
      ],
    };
    api.get.mockResolvedValue(mockData);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith("/categories");
  });

  it("should handle error", async () => {
    api.get.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe("useCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single category by id", async () => {
    const mockData = { category: { id: 1, name: "Frutas" } };
    api.get.mockResolvedValue(mockData);

    const { result } = renderHook(() => useCategory(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith("/categories/1");
  });

  it("should not fetch when id is falsy", () => {
    const { result } = renderHook(() => useCategory(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(api.get).not.toHaveBeenCalled();
  });
});
