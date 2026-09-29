import { useState } from "react";
import { useAdminOrderTracking } from "../hooks/useOrderTracking";
import OrderTrackingMap from "./OrderTrackingMap";

const TRACKABLE_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

export default function AdminOrderTrackingPanel({ orderId, orderStatus }) {
  const [expanded, setExpanded] = useState(false);
  const trackable = TRACKABLE_STATUSES.includes(orderStatus);
  const { data: tracking, isLoading, isFetching, isError } = useAdminOrderTracking(orderId, {
    enabled: trackable && expanded,
  });

  if (!trackable) return null;

  return (
    <div className="border-t border-[#e0e0e0] pt-4 mt-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="font-apple-body text-[14px] text-[#0066cc] hover:underline"
      >
        {expanded ? "Ocultar mapa de seguimiento" : "Ver seguimiento en mapa"}
      </button>
      {expanded && (
        <div className="mt-3">
          {isLoading && (
            <div className="h-[120px] animate-pulse bg-[#f5f5f7] rounded-[12px]" />
          )}
          {isError && (
            <p className="font-apple-body text-[14px] text-[#7a7a7a]">
              No se pudo cargar el seguimiento.
            </p>
          )}
          {tracking && <OrderTrackingMap tracking={tracking} isFetching={isFetching} />}
        </div>
      )}
    </div>
  );
}
