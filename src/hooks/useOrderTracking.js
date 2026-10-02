import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

const TRACKING_POLL_MS = 10_000;
const LIVE_MAP_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

function shouldPollTracking(tracking) {
  return LIVE_MAP_STATUSES.includes(tracking?.status);
}

export function useOrderTracking(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["orderTracking", orderId],
    queryFn: () => api.get(`/orders/${orderId}/tracking`),
    enabled: enabled && Boolean(orderId),
    retry: 1,
    refetchInterval: (query) => {
      const raw = query.state.data;
      const tracking = raw?.tracking ?? raw;
      return shouldPollTracking(tracking) ? TRACKING_POLL_MS : false;
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
      const raw = query.state.data;
      const tracking = raw?.tracking ?? raw;
      return shouldPollTracking(tracking) ? TRACKING_POLL_MS : false;
    },
    select: (data) => data.tracking,
  });
}
