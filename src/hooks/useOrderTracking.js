import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

const TRACKING_POLL_MS = 10_000;

export function useOrderTracking(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["orderTracking", orderId],
    queryFn: () => api.get(`/orders/${orderId}/tracking`),
    enabled: enabled && Boolean(orderId),
    retry: 1,
    refetchInterval: (query) => {
      const tracking = query.state.data?.tracking;
      return tracking?.isLive ? TRACKING_POLL_MS : false;
    },
    select: (data) => data.tracking,
  });
}

export function useAdminOrderTracking(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["adminOrderTracking", orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}/tracking`),
    enabled: enabled && Boolean(orderId),
    refetchInterval: (query) => {
      const tracking = query.state.data?.tracking;
      return tracking?.isLive ? TRACKING_POLL_MS : false;
    },
    select: (data) => data.tracking,
  });
}
