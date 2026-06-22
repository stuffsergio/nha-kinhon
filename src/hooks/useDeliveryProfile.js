import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useDeliveryProfile() {
  return useQuery({
    queryKey: ["delivery", "profile"],
    queryFn: () => api.get("/delivery/profile"),
  });
}

export function useUpdateDeliveryProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/delivery/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
    },
  });
}

export function useToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/delivery/profile/toggle-active"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
      qc.invalidateQueries({ queryKey: ["delivery", "stats"] });
    },
  });
}

export function useDeliveryStats() {
  return useQuery({
    queryKey: ["delivery", "stats"],
    queryFn: () => api.get("/delivery/stats"),
  });
}
