import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useDocumentVisible } from "./useDocumentVisible";

const TRACKING_POLL_MS = 10_000;
const TRACKING_POLL_MS_BACKGROUND = 30_000;
const LIVE_MAP_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

function shouldPollTracking(tracking) {
  return LIVE_MAP_STATUSES.includes(tracking?.status);
}

function trackingPollInterval(query, documentVisible) {
  const raw = query.state.data;
  const tracking = raw?.tracking ?? raw;
  if (!shouldPollTracking(tracking)) return false;
  return documentVisible ? TRACKING_POLL_MS : TRACKING_POLL_MS_BACKGROUND;
}

export function useOrderTracking(orderId, { enabled = true } = {}) {
  const documentVisible = useDocumentVisible();

  return useQuery({
    queryKey: ["orderTracking", orderId],
    queryFn: () => api.get(`/orders/${orderId}/tracking`),
    enabled: enabled && Boolean(orderId),
    retry: 1,
    refetchInterval: (query) => trackingPollInterval(query, documentVisible),
    select: (data) => data.tracking,
  });
}

export function useAdminOrderTracking(orderId, { enabled = true } = {}) {
  const documentVisible = useDocumentVisible();

  return useQuery({
    queryKey: ["adminOrderTracking", orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}/tracking`),
    enabled: enabled && Boolean(orderId),
    refetchInterval: (query) => trackingPollInterval(query, documentVisible),
    select: (data) => data.tracking,
  });
}
