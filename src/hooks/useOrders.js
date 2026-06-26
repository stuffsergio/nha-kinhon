import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useOrders(options = {}) {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders"),
    refetchInterval: 30_000,
    ...options,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/orders/checkout", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
