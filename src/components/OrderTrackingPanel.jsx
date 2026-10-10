import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Map } from "lucide-react";
import { useOrderTracking } from "../hooks/useOrderTracking";
import OrderTrackingMap from "./OrderTrackingMap";

export const FULL_LIVE_STATUSES = ["PICKED_UP", "IN_TRANSIT"];
export const PRE_LIVE_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED"];

export default function OrderTrackingPanel({ orderId, orderStatus, destinationPreview }) {
  const { t } = useTranslation();
  const isFullLive = FULL_LIVE_STATUSES.includes(orderStatus);
  const isPreLive = PRE_LIVE_STATUSES.includes(orderStatus);

  if (!isFullLive && !isPreLive) return null;

  const [preLiveOpen, setPreLiveOpen] = useState(false);

  const {
    data: tracking,
    isLoading,
    isFetching,
    isError,
    error,
    isFetchError,
  } = useOrderTracking(orderId, { enabled: isFullLive || (isPreLive && preLiveOpen) });

  const showStaleTrackingNotice = Boolean(tracking && isFetchError);

  if (isPreLive && !preLiveOpen) {
    const hasDest =
      destinationPreview?.lat != null && destinationPreview?.lng != null;
    return (
      <div className="rounded-[12px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#0066cc]">
              <Map size={18} />
            </div>
            <div>
              <p className="font-apple-display text-[17px] font-semibold text-[#1d1d1f]">
                {t("tracking.mapTitle")}
              </p>
              <p className="font-apple-body text-[14px] text-[#7a7a7a] mt-0.5">
                {t("tracking.preLiveHint")}
              </p>
            </div>
          </div>
          {hasDest && (
            <button
              type="button"
              onClick={() => setPreLiveOpen(true)}
              className="shrink-0 inline-flex items-center gap-1 font-apple-body text-[14px] text-[#0066cc] hover:underline"
            >
              {t("tracking.viewDestination")}
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isPreLive && preLiveOpen) {
    const dest =
      tracking?.destination ??
      (destinationPreview?.lat != null
        ? {
            lat: destinationPreview.lat,
            lng: destinationPreview.lng,
            name: destinationPreview.name,
            address: destinationPreview.address,
          }
        : null);

    return (
      <div className="rounded-[12px] border border-[#e0e0e0] bg-[#fafafa] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-apple-display text-[17px] font-semibold text-[#1d1d1f]">
            {t("tracking.deliveryDestination")}
          </h4>
          <button
            type="button"
            onClick={() => setPreLiveOpen(false)}
            className="inline-flex items-center gap-1 font-apple-body text-[14px] text-[#0066cc] hover:underline"
          >
            {t("tracking.hide")}
            <ChevronUp size={16} />
          </button>
        </div>
        {isLoading && (
          <div className="h-[100px] animate-pulse bg-[#f5f5f7] rounded-[12px]" aria-busy="true" />
        )}
        {!isLoading && dest && (
          <OrderTrackingMap
            tracking={tracking}
            compact
            destinationOnly={dest}
          />
        )}
        {!isLoading && !dest && (
          <p className="font-apple-body text-[14px] text-[#7a7a7a]">
            {t("tracking.noDeliveryCoords")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#e0e0e0] bg-[#fafafa] p-4">
      <h4 className="font-apple-display text-[19px] font-semibold text-[#1d1d1f] mb-3">
        {t("tracking.mapTitle")}
      </h4>
      {isLoading && (
        <div className="h-[120px] animate-pulse bg-[#f5f5f7] rounded-[12px]" aria-busy="true" />
      )}
      {showStaleTrackingNotice && (
        <p className="font-apple-body text-[14px] text-[#b45309] mb-2" role="status">
          {t("tracking.staleNotice")}
        </p>
      )}
      {isError && !tracking && (
        <p className="font-apple-body text-[14px] text-[#7a7a7a]">
          {error?.message || t("tracking.loadError")}
        </p>
      )}
      {!isLoading && tracking && (
        <OrderTrackingMap tracking={tracking} isFetching={isFetching && !showStaleTrackingNotice} />
      )}
    </div>
  );
}
