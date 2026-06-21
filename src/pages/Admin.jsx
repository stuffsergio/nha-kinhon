import { useAuth } from "../context/AuthContext";
import { useAdminOrders, useUpdateOrderStatus } from "../hooks/useAdminOrders";
import { useToast } from "../context/ToastContext";

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En Preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusColors = {
  PENDING: "bg-[#f5f5f7] text-[#7a7a7a]",
  CONFIRMED: "bg-[#0066cc]/10 text-[#0066cc]",
  PROCESSING: "bg-[#f59e0b]/10 text-[#f59e0b]",
  SHIPPED: "bg-[#3b82f6]/10 text-[#3b82f6]",
  DELIVERED: "bg-[#059669]/10 text-[#059669]",
  CANCELLED: "bg-[#dc2626]/10 text-[#dc2626]",
};

const validTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.data || [];

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 text-center">
        <h1 className="font-apple-display text-[40px] font-semibold text-[#1d1d1f] mb-4">Acceso Denegado</h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a]">No tienes permisos de administrador.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
      <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-8">
        Administración
      </h1>

      <h2 className="font-apple-display text-[34px] font-semibold leading-[1.1] text-[#1d1d1f] mb-6">
        Pedidos
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
              <div className="h-6 bg-[#f5f5f7] rounded w-1/4 mb-3" />
              <div className="h-5 bg-[#f5f5f7] rounded w-1/2 mb-2" />
              <div className="h-5 bg-[#f5f5f7] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="font-apple-body text-[17px] text-[#7a7a7a] py-[80px] text-center">No hay pedidos registrados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                    Pedido #{order.id.slice(0, 8)}
                  </h3>
                  <p className="font-apple-body text-[14px] text-[#7a7a7a]">
                    {new Date(order.createdAt).toLocaleDateString()} &bull; {order.user?.name || "Usuario"}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-[9999px] font-apple-body text-[14px] font-medium ${statusColors[order.status] || ""}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Destinatario</p>
                  <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.recipientName}</p>
                </div>
                <div>
                  <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Teléfono</p>
                  <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.recipientPhone || "—"}</p>
                </div>
                <div>
                  <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Total</p>
                  <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.total.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Artículos</p>
                  <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.items?.length || 0}</p>
                </div>
              </div>

              {validTransitions[order.status]?.length > 0 && (
                <div className="border-t border-[#e0e0e0] pt-4 flex flex-wrap gap-2">
                  {validTransitions[order.status].map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => {
                        updateStatus.mutate({ orderId: order.id, status: nextStatus }, {
                          onSuccess: () => toast(`Pedido actualizado a ${statusLabels[nextStatus]}`, "success"),
                          onError: (e) => toast("Error: " + e.message, "error"),
                        });
                      }}
                      disabled={updateStatus.isPending}
                      className="px-4 py-2 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[14px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
                    >
                      Marcar como {statusLabels[nextStatus]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
