import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useDeliveryPeople() {
  return useQuery({
    queryKey: ["admin", "delivery-people"],
    queryFn: () => api.get("/admin/delivery-people"),
  });
}

export function useAssignDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, deliveryId }) =>
      api.post(`/admin/orders/${orderId}/assign-delivery`, { deliveryId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "delivery-people"] });
    },
  });
}
