import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
  });
}

export function useCategory(id) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => api.get(`/categories/${id}`),
    enabled: !!id,
  });
}
