import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useAdminIncidents(filters = {}) {
  return useQuery({
    queryKey: ["adminIncidents", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/incidents", { params: filters });
      return data;
    },
  });
}

export function useAdminRefundQueue(filters = {}) {
  return useQuery({
    queryKey: ["adminRefunds", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/refunds", { params: filters });
      return data;
    },
  });
}

export function useAdminRefundSummary(orderId) {
  return useQuery({
    queryKey: ["adminRefundSummary", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/orders/${orderId}/refund-summary`);
      return data;
    },
    enabled: Boolean(orderId),
  });
}

export function useApproveRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, ...body }) =>
      api.post(`/admin/refunds/${refundId}/approve`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminRefunds"] });
      qc.invalidateQueries({ queryKey: ["adminIncidents"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRejectRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, ...body }) =>
      api.post(`/admin/refunds/${refundId}/reject`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminRefunds"] });
    },
  });
}

export function useAdminManualRefund(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/admin/orders/${orderId}/refund`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminRefunds"] });
      qc.invalidateQueries({ queryKey: ["adminRefundSummary", orderId] });
    },
  });
}

export function useResolveUndeliverable(orderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/admin/orders/${orderId}/resolve-undeliverable`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminIncidents"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
