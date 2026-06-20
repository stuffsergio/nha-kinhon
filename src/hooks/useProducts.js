import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useProducts(filters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => api.get("/products", { params: filters }),
    keepPreviousData: true,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`),
    enabled: !!id,
  });
}
