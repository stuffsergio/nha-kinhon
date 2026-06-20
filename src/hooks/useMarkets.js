import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => api.get("/markets"),
  });
}

export function useMarket(id) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: () => api.get(`/markets/${id}`),
    enabled: !!id,
  });
}
