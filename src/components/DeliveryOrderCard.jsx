import { MapPin, Phone, Package, Clock } from "lucide-react";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import DeliveryTimeline from "./DeliveryTimeline";

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days}d`;
}

export default function DeliveryOrderCard({ order, actions, showTimeAgo }) {
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const orderTotal = order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || order.total;

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
              Pedido #{order.id.slice(0, 8)}
            </h3>
            {showTimeAgo && (
              <span className="font-apple-body text-[12px] text-[#7a7a7a] flex items-center gap-1">
                <Clock size={12} /> {timeAgo(order.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="font-apple-display text-[28px] font-semibold leading-[1.14] text-[#1d1d1f]">
              {orderTotal.toLocaleString()} FCFA
            </p>
            <p className="font-apple-body text-[14px] text-[#7a7a7a]">
              &bull; {itemCount} artículos
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <DeliveryStatusBadge status={order.status} />
          {order.deliveredAt && (
            <span className="font-apple-body text-[11px] text-[#7a7a7a]">
              {new Date(order.deliveredAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {["PICKED_UP", "IN_TRANSIT"].includes(order.status) && (
        <DeliveryTimeline currentStatus={order.status} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[#f5f5f7] rounded-[12px]">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-[#0066cc] mt-0.5 shrink-0" />
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Destinatario</p>
            <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.recipientName}</p>
            <p className="font-apple-body text-[13px] text-[#7a7a7a]">{order.recipientAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Phone size={16} className="text-[#0066cc] mt-0.5 shrink-0" />
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Teléfono</p>
            <a href={`tel:${order.recipientPhone}`} className="font-apple-body text-[15px] text-[#0066cc] hover:underline">
              {order.recipientPhone || "—"}
            </a>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[#7a7a7a]" />
            <span className="font-apple-body text-[14px] font-semibold text-[#1d1d1f]">Productos</span>
          </div>
          <span className="font-apple-body text-[13px] text-[#7a7a7a]">{order.items?.length || 0} tipos</span>
        </div>
        <div className="divide-y divide-[#e0e0e0]">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-1.5">
              <div className="flex items-center gap-2">
                <span className="font-apple-body text-[14px] text-[#1d1d1f]">{item.name}</span>
                <span className="font-apple-body text-[12px] text-[#7a7a7a]">x{item.quantity}</span>
              </div>
              <span className="font-apple-body text-[14px] text-[#7a7a7a]">
                {(item.price * item.quantity).toLocaleString()} FCFA
              </span>
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="p-3 bg-[#fef9e7] rounded-[8px]">
          <p className="font-apple-body text-[13px] text-[#92400e]">
            <span className="font-semibold">Notas:</span> {order.notes}
          </p>
        </div>
      )}

      {actions && <div className="border-t border-[#e0e0e0] pt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
