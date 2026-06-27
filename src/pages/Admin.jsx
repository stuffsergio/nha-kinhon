import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useAdminOrders, useUpdateOrderStatus } from "../hooks/useAdminOrders";
import { useDeliveryPeople, useAssignDelivery } from "../hooks/useAdminDelivery";
import { useToast } from "../context/ToastContext";

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En Preparación",
  SHIPPED: "Enviado",
  PICKED_UP: "Recogido",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusColors = {
  PENDING: "bg-[#f5f5f7] text-[#7a7a7a]",
  CONFIRMED: "bg-[#0066cc]/10 text-[#0066cc]",
  PROCESSING: "bg-[#f59e0b]/10 text-[#f59e0b]",
  SHIPPED: "bg-[#3b82f6]/10 text-[#3b82f6]",
  PICKED_UP: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
  IN_TRANSIT: "bg-[#f59e0b]/10 text-[#f59e0b]",
  DELIVERED: "bg-[#059669]/10 text-[#059669]",
  CANCELLED: "bg-[#dc2626]/10 text-[#dc2626]",
};

const validTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  PICKED_UP: [],
  IN_TRANSIT: [],
  DELIVERED: [],
  CANCELLED: [],
};

const tabs = [
  { id: "orders", label: "Todos los Pedidos" },
  { id: "assign", label: "Asignar Repartidores" },
  { id: "delivery", label: "Repartidores" },
];

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("assign");

  const qc = useQueryClient();
  const { data: ordersData, isLoading } = useAdminOrders();
  const { data: deliveryData, isLoading: delLoading } = useDeliveryPeople();
  const updateStatus = useUpdateOrderStatus();
  const assignDelivery = useAssignDelivery();

  const orders = ordersData?.data || [];
  const deliveryPeople = deliveryData?.data || [];
  const availableOrders = orders.filter((o) => o.status === "CONFIRMED" && !o.deliveryId);
  const activeDeliveries = deliveryPeople.filter((dp) => dp.isActive);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 text-center">
        <h1 className="font-apple-display text-[40px] font-semibold text-[#1d1d1f] mb-4">Acceso Denegado</h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a]">No tienes permisos de administrador.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 space-y-6">
      <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f]">
        Administración
      </h1>

      <div className="flex gap-2 border-b border-[#e0e0e0] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-apple-body text-[17px] font-normal transition-colors whitespace-nowrap ${
              activeTab === tab.id ? "text-[#1d1d1f] border-b-2 border-[#dc2626]" : "text-[#7a7a7a] hover:text-[#1d1d1f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "assign" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Pedidos disponibles</p>
              <p className="font-apple-display text-[34px] font-semibold text-[#1d1d1f]">{availableOrders.length}</p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Repartidores activos</p>
              <p className="font-apple-display text-[34px] font-semibold text-[#1d1d1f]">{activeDeliveries.length}</p>
            </div>
          </div>

          {availableOrders.length === 0 ? (
            <p className="font-apple-body text-[17px] text-[#7a7a7a] py-12 text-center">No hay pedidos pendientes de asignar.</p>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                        Pedido #{order.id.slice(0, 8)}
                      </h3>
                      <p className="font-apple-body text-[14px] text-[#7a7a7a]">
                        {order.total.toLocaleString()} FCFA &bull; {order.recipientName} &bull; {order.items?.length || 0} artículos
                      </p>
                    </div>
                    <span className="text-[12px] text-[#7a7a7a]">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  {activeDeliveries.length > 0 ? (
                    <div className="border-t border-[#e0e0e0] pt-4">
                      <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-2">Asignar a repartidor:</p>
                      <div className="flex flex-wrap gap-2">
                        {deliveryPeople.filter((dp) => dp.isActive).map((dp) => (
                          <button
                            key={dp.id}
                            onClick={() => {
                              assignDelivery.mutate({ orderId: order.id, deliveryId: dp.userId }, {
                                onSuccess: () => toast(`Pedido asignado a ${dp.user.name}`, "success"),
                                onError: (e) => toast("Error: " + e.message, "error"),
                              });
                            }}
                            disabled={assignDelivery.isPending}
                            className="flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[14px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#059669]" />
                            {dp.user.name} ({dp.vehicle})
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-apple-body text-[14px] text-[#dc2626]">No hay repartidores activos disponibles.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
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
            orders.map((order) => (
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                    <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Repartidor</p>
                    <p className="font-apple-body text-[15px] text-[#1d1d1f]">{order.delivery?.name || "—"}</p>
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
            ))
          )}
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="space-y-4">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "delivery-people"] })}
            className="text-[#0066cc] font-apple-body text-[14px] hover:underline"
          >
            ↻ Actualizar lista
          </button>

          {delLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
                  <div className="h-6 bg-[#f5f5f7] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : deliveryPeople.length === 0 ? (
            <p className="font-apple-body text-[17px] text-[#7a7a7a] py-12 text-center">No hay repartidores registrados.</p>
          ) : (
            deliveryPeople.map((dp) => (
              <div key={dp.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${dp.isActive ? "bg-[#059669]" : "bg-[#d2d2d7]"}`} />
                    <div>
                      <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                        {dp.user.name}
                      </h3>
                      <p className="font-apple-body text-[14px] text-[#7a7a7a]">
                        {dp.vehicle} &bull; {dp.serviceArea || "Sin zona"} &bull; {dp.deliveryCount || 0} pedidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-apple-body text-[14px] font-medium text-[#1d1d1f]">{dp.phone}</p>
                    <p className="font-apple-body text-[12px] text-[#7a7a7a]">{dp.rating.toFixed(1)} ★</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
