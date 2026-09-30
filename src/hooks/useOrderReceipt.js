import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useOrderReceipt(orderId, options = {}) {
  return useQuery({
    queryKey: ["orders", orderId, "receipt"],
    queryFn: () => api.get(`/orders/${orderId}/receipt`),
    enabled: !!orderId,
    staleTime: 60_000,
    ...options,
  });
}
