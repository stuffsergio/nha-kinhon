import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useSearch(query) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.get("/search", { params: { q: query } }),
    enabled: !!query && query.trim().length > 0,
  });
}
