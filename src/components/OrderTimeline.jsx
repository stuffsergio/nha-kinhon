import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const fullOrderKeys = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
];

const timelineLabelKey = {
  PENDING_PAYMENT: "orderTimeline.payment",
  CONFIRMED: "orderTimeline.confirmed",
  PROCESSING: "orderTimeline.preparing",
  SHIPPED: "orderTimeline.shipped",
  PICKED_UP: "orderTimeline.pickedUp",
  IN_TRANSIT: "orderTimeline.inTransit",
  DELIVERED: "orderTimeline.delivered",
};

const orderIndex = {
  PENDING_PAYMENT: 0,
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  PICKED_UP: 4,
  IN_TRANSIT: 5,
  DELIVERED: 6,
  CANCELLED: -1,
};

export default function OrderTimeline({ status }) {
  const { t } = useTranslation();
  const currentIdx = orderIndex[status] ?? 0;

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#dc2626] text-white flex items-center justify-center font-apple-body text-[13px] font-semibold">
          !
        </div>
        <span className="font-apple-body text-[15px] font-medium text-[#dc2626]">
          {t("orderTimeline.cancelled")}
        </span>
      </div>
    );
  }

  const relevantSteps = fullOrderKeys.slice(0, Math.max(currentIdx + 1, 1));
  const isDelivered = status === "DELIVERED";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {relevantSteps.map((stepKey, idx) => {
        const isCompleted = idx < currentIdx || (isDelivered && idx === currentIdx);
        const isCurrent = idx === currentIdx && !isDelivered;
        const label = t(timelineLabelKey[stepKey]);

        return (
          <div key={stepKey} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-apple-body text-[11px] font-semibold transition-all ${
                  isCompleted
                    ? "bg-[#0066cc] text-white"
                    : isCurrent
                      ? "bg-[#0066cc] text-white ring-2 ring-[#0066cc] ring-offset-2"
                      : "bg-[#f5f5f7] text-[#7a7a7a]"
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
              </div>
              <span
                className={`font-apple-body text-[10px] whitespace-nowrap ${isCompleted || isCurrent ? "text-[#1d1d1f] font-medium" : "text-[#7a7a7a]"}`}
              >
                {label}
              </span>
            </div>
            {idx < relevantSteps.length - 1 && (
              <div className={`w-6 h-[2px] mx-1 mb-4 ${isCompleted ? "bg-[#0066cc]" : "bg-[#e0e0e0]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
