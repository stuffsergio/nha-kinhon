import { useOrderStatusLabel } from "../hooks/useOrderStatusLabel";

const statusColors = {
  PENDING_PAYMENT: "bg-[#fffbeb] text-[#d97706]",
  PENDING: "bg-[#f5f5f7] text-[#7a7a7a]",
  CONFIRMED: "bg-[#0066cc]/10 text-[#0066cc]",
  PROCESSING: "bg-[#f59e0b]/10 text-[#f59e0b]",
  SHIPPED: "bg-[#3b82f6]/10 text-[#3b82f6]",
  PICKED_UP: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
  IN_TRANSIT: "bg-[#f97316]/10 text-[#f97316]",
  DELIVERED: "bg-[#059669]/10 text-[#059669]",
  CANCELLED: "bg-[#dc2626]/10 text-[#dc2626]",
};

export default function DeliveryStatusBadge({ status }) {
  const label = useOrderStatusLabel();
  const color = statusColors[status] || "bg-[#f5f5f7] text-[#7a7a7a]";
  return (
    <span className={`inline-block px-3 py-1 rounded-[9999px] font-apple-body text-[14px] font-medium ${color}`}>
      {label(status)}
    </span>
  );
}
