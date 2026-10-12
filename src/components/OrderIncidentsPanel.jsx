import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useOrderHistory,
  useUpdateOrderRecipient,
  useOrderReattempt,
  useRefundRequest,
  useCancelOrderWithRefund,
} from "../hooks/useOrderHistory";
import { useToast } from "../context/ToastContext";

const INCIDENT_STATUSES = new Set([
  "DELIVERY_FAILED_ATTEMPT",
  "UNDELIVERABLE",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export default function OrderIncidentsPanel({ order }) {
  const { t } = useTranslation();
  const toast = useToast();
  const showPanel =
    INCIDENT_STATUSES.has(order.status) ||
    order.failedDeliveryAttempts > 0 ||
    (order.refunds && order.refunds.length > 0);

  const { data: history } = useOrderHistory(order.id, showPanel);
  const updateRecipient = useUpdateOrderRecipient(order.id);
  const reattempt = useOrderReattempt(order.id);
  const refundRequest = useRefundRequest(order.id);
  const cancelRefund = useCancelOrderWithRefund();

  const [phone, setPhone] = useState(order.recipientPhone || "");
  const [address, setAddress] = useState(order.recipientAddress || "");

  if (!showPanel) return null;

  const canAct =
    order.status === "DELIVERY_FAILED_ATTEMPT" || order.status === "UNDELIVERABLE";

  const handleSaveRecipient = async () => {
    try {
      await updateRecipient.mutateAsync({
        recipientPhone: phone,
        recipientAddress: address,
      });
      toast.success(t("incidents.recipientSaved"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  const handleReattempt = async () => {
    try {
      await reattempt.mutateAsync();
      toast.success(t("incidents.reattemptOk"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  const handleRefund = async () => {
    try {
      await refundRequest.mutateAsync({ reason: "UNDELIVERABLE" });
      toast.success(t("incidents.refundRequested"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  const handleCancelRefund = async () => {
    try {
      await cancelRefund.mutateAsync(order.id);
      toast.success(t("incidents.cancelRefundOk"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  const attempts = history?.attempts || order.deliveryAttempts || [];
  const refunds = history?.refunds || order.refunds || [];

  return (
    <div className="border border-[#e0e0e0] rounded-[12px] p-4 space-y-4 bg-[#fffbeb]/40">
      <h4 className="font-apple-display text-[21px] font-semibold text-[#1d1d1f]">
        {t("incidents.title")}
      </h4>

      {attempts.length > 0 && (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li key={a.id} className="text-[14px] text-[#1d1d1f] font-apple-body">
              <span className="font-medium">
                {t("incidents.attempt", { n: a.attemptNumber })}
              </span>
              {" — "}
              {t(`incidents.reason.${a.reason}`, { defaultValue: a.reason })}
              {a.note ? `: ${a.note}` : ""}
            </li>
          ))}
        </ul>
      )}

      {refunds.length > 0 && (
        <ul className="space-y-1">
          {refunds.map((r) => (
            <li key={r.id} className="text-[14px] font-apple-body text-[#7a7a7a]">
              {t("incidents.refundLine", {
                amount: r.amount.toLocaleString(),
                status: t(`incidents.refundStatus.${r.status}`, { defaultValue: r.status }),
              })}
            </li>
          ))}
        </ul>
      )}

      {canAct && (
        <div className="space-y-3 pt-2 border-t border-[#e0e0e0]">
          <p className="text-[13px] text-[#7a7a7a]">{t("incidents.actionsHint")}</p>
          <input
            className="w-full border border-[#e0e0e0] rounded-[8px] px-3 py-2 text-[15px]"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("incidents.phonePlaceholder")}
          />
          <textarea
            className="w-full border border-[#e0e0e0] rounded-[8px] px-3 py-2 text-[15px] min-h-[72px]"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("incidents.addressPlaceholder")}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveRecipient}
              disabled={updateRecipient.isPending}
              className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-[14px]"
            >
              {t("incidents.saveRecipient")}
            </button>
            {order.status === "DELIVERY_FAILED_ATTEMPT" && (
              <button
                type="button"
                onClick={handleReattempt}
                disabled={reattempt.isPending}
                className="px-4 py-2 rounded-full border border-[#0066cc] text-[#0066cc] text-[14px]"
              >
                {t("incidents.reattempt")}
              </button>
            )}
            <button
              type="button"
              onClick={handleRefund}
              disabled={refundRequest.isPending}
              className="px-4 py-2 rounded-full border border-[#d97706] text-[#d97706] text-[14px]"
            >
              {t("incidents.requestRefund")}
            </button>
            <button
              type="button"
              onClick={handleCancelRefund}
              disabled={cancelRefund.isPending}
              className="px-4 py-2 rounded-full border border-[#dc2626] text-[#dc2626] text-[14px]"
            >
              {t("incidents.cancelWithRefund")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
