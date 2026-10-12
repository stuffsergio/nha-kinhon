import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useOrderHistory(orderId, enabled = true) {
  return useQuery({
    queryKey: ["orderHistory", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${orderId}/history`);
      return data;
    },
    enabled: Boolean(orderId) && enabled,
  });
}

export function useUpdateOrderRecipient(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put(`/orders/${orderId}/recipient`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orderHistory", orderId] });
    },
  });
}

export function useOrderReattempt(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/orders/${orderId}/reattempt`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orderHistory", orderId] });
    },
  });
}

export function useRefundRequest(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/orders/${orderId}/refund-request`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orderHistory", orderId] });
    },
  });
}

export function useCancelOrderWithRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
