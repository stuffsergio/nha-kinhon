import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ClipboardList, User, Clock, Truck, DollarSign, Star, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAvailableOrders, useMyDeliveryOrders, usePickupOrder, useUpdateDeliveryStatus } from "../hooks/useDeliveryOrders";
import { useDeliveryProfile, useToggleActive, useDeliveryStats } from "../hooks/useDeliveryProfile";
import DeliveryOrderCard from "../components/DeliveryOrderCard";
import ButtonPrimary from "../components/ButtonPrimary";

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

const tabs = [
  { id: "available", label: "Disponibles", icon: Package },
  { id: "active", label: "Mis Activos", icon: ClipboardList },
  { id: "history", label: "Historial", icon: Clock },
  { id: "profile", label: "Mi Perfil", icon: User },
];

export default function DeliveryDashboard() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("available");
  const [fetchingUser, setFetchingUser] = useState(false);

  useEffect(() => {
    if (!user) {
      setFetchingUser(true);
      api.get("/auth/me")
        .then((me) => updateUser(me.user))
        .catch(() => {})
        .finally(() => setFetchingUser(false));
    }
  }, []);

  const { data: availableRes, isLoading: availLoading } = useAvailableOrders();
  const { data: myOrdersRes, isLoading: myLoading } = useMyDeliveryOrders();
  const { data: profileRes, isLoading: profLoading } = useDeliveryProfile();
  const { data: statsRes } = useDeliveryStats();

  const pickupOrder = usePickupOrder();
  const updateStatus = useUpdateDeliveryStatus();
  const toggleActive = useToggleActive();

  if (fetchingUser) {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#f5f5f7] rounded w-1/3" />
          <div className="h-6 bg-[#f5f5f7] rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "DELIVERY") {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 text-center">
        <Truck size={48} className="mx-auto mb-4 text-[#059669]" />
        <h1 className="font-apple-display text-[40px] font-semibold text-[#1d1d1f] mb-4">Acceso Repartidores</h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a] mb-6">Inicia sesión como repartidor para acceder al panel.</p>
        <ButtonPrimary onClick={() => navigate("/delivery/login")}>Ir a iniciar sesión</ButtonPrimary>
      </div>
    );
  }

  const available = availableRes?.data || [];
  const myOrders = myOrdersRes?.data || [];
  const profile = profileRes?.profile;
  const stats = statsRes?.stats;
  const activeOrders = myOrders.filter((o) => ["PICKED_UP", "IN_TRANSIT"].includes(o.status));
  const historyOrders = myOrders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">
            Panel Repartidor
          </h1>
          <p className="font-apple-body text-[17px] text-[#7a7a7a]">
            {user.name} &bull; {profile?.vehicle || "—"} &bull; {profile?.serviceArea || "Sin zona"}
          </p>
        </div>
        <button onClick={logout} className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
          Salir
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0">
            <DollarSign size={20} className="text-[#059669]" />
          </div>
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Ganado hoy</p>
            <p className="font-apple-body text-[17px] font-semibold text-[#1d1d1f]">{stats?.earningsThisWeek?.toLocaleString() || 0} FCFA</p>
          </div>
        </div>
        <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-[#0066cc]" />
          </div>
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Entregas hoy</p>
            <p className="font-apple-body text-[17px] font-semibold text-[#1d1d1f]">{stats?.deliveriesToday || 0}</p>
          </div>
        </div>
        <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
            <Clock size={20} className="text-[#dc2626]" />
          </div>
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Semana</p>
            <p className="font-apple-body text-[17px] font-semibold text-[#1d1d1f]">{stats?.deliveriesThisWeek || 0} entregas</p>
          </div>
        </div>
        <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 rounded-[14px] no-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0">
            <Star size={20} className="text-[#f59e0b]" />
          </div>
          <div>
            <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px]">Rating</p>
            <p className="font-apple-body text-[17px] font-semibold text-[#1d1d1f]">{stats?.rating?.toFixed(1) || "5.0"}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#e0e0e0] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = tab.id === "available" ? available.length : tab.id === "active" ? activeOrders.length : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "text-[#1d1d1f] border-b-2 border-[#059669]" : "text-[#7a7a7a] hover:text-[#1d1d1f]"
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {count !== null && (
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${count > 0 ? "bg-[#059669] text-white" : "bg-[#f5f5f7] text-[#7a7a7a]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "available" && (
        <div className="space-y-4">
          {availLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
                  <div className="h-6 bg-[#f5f5f7] rounded w-1/3 mb-3" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-1/2 mb-2" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-[80px]">
              <Package size={48} className="mx-auto mb-4 text-[#7a7a7a]" />
              <p className="font-apple-body text-[17px] text-[#7a7a7a]">No hay pedidos disponibles ahora.</p>
            </div>
          ) : (
            available.map((order) => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                showTimeAgo
                actions={
                  <button
                    onClick={() => {
                      pickupOrder.mutate(order.id, {
                        onSuccess: () => toast("Pedido asignado. ¡A repartir!", "success"),
                        onError: (e) => toast("Error: " + e.message, "error"),
                      });
                    }}
                    disabled={pickupOrder.isPending}
                    className="px-5 py-2.5 bg-[#059669] text-white rounded-[9999px] font-apple-body text-[15px] hover:bg-[#047857] transition-colors disabled:bg-[#d2d2d7]"
                  >
                    {pickupOrder.isPending ? "Asignando..." : "Tomar pedido"}
                  </button>
                }
              />
            ))
          )}
        </div>
      )}

      {activeTab === "active" && (
        <div className="space-y-4">
          {myLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse"><div className="h-6 bg-[#f5f5f7] rounded w-1/3 mb-3" /><div className="h-5 bg-[#f5f5f7] rounded w-1/2" /></div>)}</div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-[80px]">
              <ClipboardList size={48} className="mx-auto mb-4 text-[#7a7a7a]" />
              <p className="font-apple-body text-[17px] text-[#7a7a7a]">No tienes pedidos activos.</p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const nextStatus = order.status === "PICKED_UP" ? "IN_TRANSIT" : order.status === "IN_TRANSIT" ? "DELIVERED" : null;
              const actionLabel = order.status === "PICKED_UP" ? "En camino" : order.status === "IN_TRANSIT" ? "Marcar entregado" : null;
              return (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  showTimeAgo
                  actions={
                    nextStatus ? (
                      <button
                        onClick={() => {
                          updateStatus.mutate({ orderId: order.id, status: nextStatus }, {
                            onSuccess: () => toast(nextStatus === "DELIVERED" ? "Pedido entregado con éxito" : "Estado actualizado", "success"),
                            onError: (e) => toast("Error: " + e.message, "error"),
                          });
                        }}
                        disabled={updateStatus.isPending}
                        className="px-5 py-2.5 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[15px] hover:bg-[#0071e3] transition-colors disabled:bg-[#d2d2d7]"
                      >
                        {updateStatus.isPending ? "Actualizando..." : actionLabel}
                      </button>
                    ) : null
                  }
                />
              );
            })
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {myLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="animate-pulse bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px]"><div className="h-6 bg-[#f5f5f7] rounded w-1/3" /></div>)}</div>
          ) : historyOrders.length === 0 ? (
            <div className="text-center py-[80px]">
              <Clock size={48} className="mx-auto mb-4 text-[#7a7a7a]" />
              <p className="font-apple-body text-[17px] text-[#7a7a7a]">Aún no has completado ninguna entrega.</p>
            </div>
          ) : (
            historyOrders.map((order) => <DeliveryOrderCard key={order.id} order={order} />)
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Total entregas</p>
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">{stats?.totalDeliveries || 0}</p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Entregas hoy</p>
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">{stats?.deliveriesToday || 0}</p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Ganancias totales</p>
              <p className="font-apple-display text-[28px] font-semibold leading-[1.1] text-[#1d1d1f]">{stats?.totalEarnings?.toLocaleString() || 0} FCFA</p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Rating</p>
              <div className="flex items-center gap-1">
                <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">{stats?.rating?.toFixed(1) || "5.0"}</p>
                <Star size={20} className="text-[#f59e0b]" />
              </div>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow space-y-4">
            <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
              Datos del Perfil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Nombre</p>
                <p className="font-apple-body text-[17px] text-[#1d1d1f]">{user.name}</p>
              </div>
              <div>
                <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Email</p>
                <p className="font-apple-body text-[17px] text-[#1d1d1f]">{user.email}</p>
              </div>
              <div>
                <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Teléfono</p>
                <p className="font-apple-body text-[17px] text-[#1d1d1f]">{profile?.phone || "—"}</p>
              </div>
              <div>
                <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Vehículo</p>
                <p className="font-apple-body text-[17px] text-[#1d1d1f] capitalize">{profile?.vehicle || "—"}</p>
              </div>
              <div>
                <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Zona</p>
                <p className="font-apple-body text-[17px] text-[#1d1d1f]">{profile?.serviceArea || "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-apple-body text-[12px] text-[#7a7a7a] uppercase tracking-[0.5px] mb-1">Disponible</p>
                  <p className={`font-apple-body text-[17px] font-medium ${profile?.isActive ? "text-[#059669]" : "text-[#dc2626]"}`}>
                    {profile?.isActive ? "Sí" : "No"}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive.mutate(undefined, {
                    onSuccess: () => toast(profile?.isActive ? "Te has desactivado" : "Ya estás disponible para recibir pedidos", "success"),
                    onError: (e) => toast("Error: " + e.message, "error"),
                  })}
                  disabled={toggleActive.isPending}
                  className={`ml-auto px-5 py-2 rounded-[9999px] font-apple-body text-[15px] transition-colors disabled:opacity-50 ${profile?.isActive ? "bg-[#dc2626] text-white hover:bg-[#b91c1c]" : "bg-[#059669] text-white hover:bg-[#047857]"}`}
                >
                  {profile?.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
