const statusConfig = {
  PENDING:    { label: "Pendiente",      color: "bg-[#f5f5f7] text-[#7a7a7a]" },
  CONFIRMED:  { label: "Confirmado",     color: "bg-[#0066cc]/10 text-[#0066cc]" },
  PROCESSING: { label: "Preparando",     color: "bg-[#f59e0b]/10 text-[#f59e0b]" },
  SHIPPED:    { label: "Enviado",        color: "bg-[#3b82f6]/10 text-[#3b82f6]" },
  PICKED_UP:  { label: "Recogido",       color: "bg-[#8b5cf6]/10 text-[#8b5cf6]" },
  IN_TRANSIT: { label: "En camino",      color: "bg-[#f97316]/10 text-[#f97316]" },
  DELIVERED:  { label: "Entregado",      color: "bg-[#059669]/10 text-[#059669]" },
  CANCELLED:  { label: "Cancelado",      color: "bg-[#dc2626]/10 text-[#dc2626]" },
};

export default function DeliveryStatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: "bg-[#f5f5f7] text-[#7a7a7a]" };
  return (
    <span className={`inline-block px-3 py-1 rounded-[9999px] font-apple-body text-[14px] font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
