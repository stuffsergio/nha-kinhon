import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { keepPreviousData } from "@tanstack/react-query";

export function useProducts(filters = {}, options = {}) {
  const hasFilters = Object.keys(filters).length > 0;
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => api.get("/products", { params: filters }),
    placeholderData: options.keepPrevious ? keepPreviousData : undefined,
    enabled: options.enabled !== false && hasFilters,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`),
    enabled: !!id,
  });
}
