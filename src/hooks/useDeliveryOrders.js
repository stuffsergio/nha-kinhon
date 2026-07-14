import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useAvailableOrders() {
  return useQuery({
    queryKey: ["delivery", "orders", "available"],
    queryFn: () => api.get("/delivery/orders/available"),
  });
}

export function useMyDeliveryOrders() {
  return useQuery({
    queryKey: ["delivery", "orders", "my"],
    queryFn: () => api.get("/delivery/orders/my"),
  });
}

export function usePickupOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => api.post(`/delivery/orders/${orderId}/pickup`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "orders"] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, deliveryPhoto }) =>
      api.put(`/delivery/orders/${orderId}/status`, { status, deliveryPhoto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "orders"] });
    },
  });
}
