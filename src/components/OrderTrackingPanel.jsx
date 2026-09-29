import { useOrderTracking } from "../hooks/useOrderTracking";
import OrderTrackingMap from "./OrderTrackingMap";

const TRACKABLE_STATUSES = ["PICKED_UP", "IN_TRANSIT"];

export default function OrderTrackingPanel({ orderId, orderStatus }) {
  const enabled = TRACKABLE_STATUSES.includes(orderStatus);
  const { data: tracking, isLoading, isFetching, isError, error } = useOrderTracking(
    orderId,
    { enabled },
  );

  if (!enabled) return null;

  return (
    <div className="rounded-[12px] border border-[#e0e0e0] bg-[#fafafa] p-4">
      <h4 className="font-apple-display text-[19px] font-semibold text-[#1d1d1f] mb-3">
        Seguimiento en mapa
      </h4>
      {isLoading && (
        <div className="h-[120px] animate-pulse bg-[#f5f5f7] rounded-[12px]" aria-busy="true" />
      )}
      {isError && (
        <p className="font-apple-body text-[14px] text-[#7a7a7a]">
          {error?.message || "No se pudo cargar el seguimiento."}
        </p>
      )}
      {!isLoading && !isError && tracking && (
        <OrderTrackingMap tracking={tracking} isFetching={isFetching} />
      )}
    </div>
  );
}
