import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAdminIncidents,
  useAdminRefundQueue,
  useAdminRefundSummary,
  useApproveRefund,
  useRejectRefund,
  useAdminManualRefund,
} from "../hooks/useAdminIncidents";
import { useToast } from "../context/ToastContext";
import { useOrderStatusLabel } from "../hooks/useOrderStatusLabel";

function RefundDialog({ orderId, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: summary } = useAdminRefundSummary(orderId);
  const manualRefund = useAdminManualRefund(orderId);
  const [amount, setAmount] = useState("");

  const max = summary?.refundableRemaining ?? 0;

  const submit = async () => {
    const value = parseInt(amount, 10);
    if (!value || value > max) {
      toast.error(t("adminIncidents.amountInvalid"));
      return;
    }
    try {
      await manualRefund.mutateAsync({ amount: value, reason: "ADMIN_MANUAL" });
      toast.success(t("adminIncidents.refundCreated"));
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] p-6 w-full max-w-md space-y-4">
        <h3 className="font-apple-display text-[24px] font-semibold">{t("adminIncidents.refundDialogTitle")}</h3>
        <p className="text-[14px] text-[#7a7a7a]">
          {t("adminIncidents.maxRefundable", { amount: max.toLocaleString() })}
        </p>
        <input
          type="number"
          className="w-full border rounded-[8px] px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(max)}
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border">
            {t("common.cancel")}
          </button>
          <button type="button" onClick={submit} className="px-4 py-2 rounded-full bg-[#0066cc] text-white">
            {t("adminIncidents.issueRefund")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminIncidentsPanel() {
  const { t } = useTranslation();
  const statusLabel = useOrderStatusLabel();
  const toast = useToast();
  const [refundOrderId, setRefundOrderId] = useState(null);
  const { data: incidentsData, isLoading: incLoading } = useAdminIncidents();
  const { data: refundsData, isLoading: refLoading } = useAdminRefundQueue({ status: "PENDING" });
  const approveRefund = useApproveRefund();
  const rejectRefund = useRejectRefund();
  const incidents = incidentsData?.data || [];
  const pendingRefunds = refundsData?.data || [];

  const handleApprove = async (refundId, orderId) => {
    try {
      await approveRefund.mutateAsync({ refundId });
      toast.success(t("adminIncidents.approved"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  const handleReject = async (refundId) => {
    try {
      await rejectRefund.mutateAsync({ refundId, adminNote: t("adminIncidents.rejectDefaultNote") });
      toast.success(t("adminIncidents.rejected"));
    } catch (e) {
      toast.error(e.response?.data?.error || t("common.error"));
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-apple-display text-[28px] font-semibold mb-4">{t("adminIncidents.refundQueue")}</h2>
        {refLoading ? (
          <p>{t("common.loading")}</p>
        ) : pendingRefunds.length === 0 ? (
          <p className="text-[#7a7a7a]">{t("adminIncidents.noPendingRefunds")}</p>
        ) : (
          <ul className="space-y-3">
            {pendingRefunds.map((r) => (
              <li key={r.id} className="border border-[#e0e0e0] rounded-[12px] p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">#{r.orderId.slice(0, 8)}</p>
                  <p className="text-[14px] text-[#7a7a7a]">
                    {r.amount.toLocaleString()} FCFA — {r.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(r.id, r.orderId)}
                    className="px-3 py-1.5 rounded-full bg-[#059669] text-white text-[13px]"
                  >
                    {t("adminIncidents.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r.id)}
                    className="px-3 py-1.5 rounded-full border border-[#dc2626] text-[#dc2626] text-[13px]"
                  >
                    {t("adminIncidents.reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-apple-display text-[28px] font-semibold mb-4">{t("adminIncidents.incidentsTitle")}</h2>
        {incLoading ? (
          <p>{t("common.loading")}</p>
        ) : incidents.length === 0 ? (
          <p className="text-[#7a7a7a]">{t("adminIncidents.noIncidents")}</p>
        ) : (
          <ul className="space-y-4">
            {incidents.map((o) => (
              <li key={o.id} className="border border-[#e0e0e0] rounded-[12px] p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">#{o.id.slice(0, 8)}</span>
                  <span className="text-[13px]">{statusLabel(o.status)}</span>
                </div>
                <p className="text-[14px] text-[#7a7a7a]">
                  {o.user?.name} — {t("incidents.attemptCount", { count: o.failedDeliveryAttempts })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundOrderId(o.id)}
                    className="px-3 py-1.5 rounded-full bg-[#0066cc] text-white text-[13px]"
                  >
                    {t("adminIncidents.manualRefund")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {refundOrderId && (
        <RefundDialog orderId={refundOrderId} onClose={() => setRefundOrderId(null)} />
      )}
    </div>
  );
}
