import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Package, ClipboardList, User, Clock, Truck, DollarSign, Star, TrendingUp, ArrowLeft, MapPin, Camera, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAvailableOrders, useMyDeliveryOrders, usePickupOrder, useUpdateDeliveryStatus } from "../hooks/useDeliveryOrders";
import { useDeliveryProfile, useToggleActive, useDeliveryStats } from "../hooks/useDeliveryProfile";
import { fileToCompressedDataUrl } from "../utils/image";
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
  const [deliverOrder, setDeliverOrder] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);

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
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
        <Link to="/" className="inline-flex items-center gap-1.5 font-apple-body text-[15px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors mb-10">
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
        <div className="max-w-[420px] mx-auto">
          <div className="bg-[#ffffff] border border-[#e0e0e0] rounded-[24px] no-shadow p-8 text-center">
            <div className="w-20 h-20 bg-[#059669]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck size={40} className="text-[#059669]" />
            </div>
            <h1 className="font-apple-display text-[32px] font-semibold leading-[1.1] text-[#1d1d1f] mb-3">
              Panel de Repartidores
            </h1>
            <p className="font-apple-body text-[17px] text-[#7a7a7a] mb-8 leading-relaxed">
              Inicia sesión o regístrate para gestionar tus entregas, ver tu historial y recibir pedidos cerca de ti.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: MapPin, text: "Recoge pedidos cerca de tu zona" },
                { icon: DollarSign, text: "Gana por cada entrega" },
                { icon: Clock, text: "Horario flexible, tú decides" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 bg-[#f5f5f7] rounded-full flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#059669]" />
                  </div>
                  <p className="font-apple-body text-[15px] text-[#4a4a4a]">{text}</p>
                </div>
              ))}
            </div>
            <ButtonPrimary onClick={() => navigate("/delivery/login")} className="w-full">
              Ir a iniciar sesión
            </ButtonPrimary>
            <p className="font-apple-body text-[14px] text-[#7a7a7a] mt-4">
              ¿No tienes cuenta?{" "}
              <button onClick={() => navigate("/delivery/login")} className="text-[#0066cc] hover:underline">
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
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
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
            <ArrowLeft size={16} /> Inicio
          </Link>
          <button onClick={logout} className="font-apple-body text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
            Salir
          </button>
        </div>
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
                          if (nextStatus === "DELIVERED") {
                            setDeliverOrder(order);
                            setDeliveryPhoto(null);
                            return;
                          }
                          updateStatus.mutate({ orderId: order.id, status: nextStatus }, {
                            onSuccess: () => toast("Estado actualizado", "success"),
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

      {deliverOrder && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Confirmar entrega">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !updateStatus.isPending && setDeliverOrder(null)} />
          <div className="relative min-h-full flex items-center justify-center p-6">
            <div className="relative bg-[#ffffff] rounded-[18px] no-shadow w-full max-w-[420px] p-8 animate-fade-in">
              <button
                onClick={() => setDeliverOrder(null)}
                disabled={updateStatus.isPending}
                className="absolute top-4 right-4 p-2 hover:bg-[#f5f5f7] rounded-full transition-colors disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
              <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-2">
                Confirmar Entrega
              </h3>
              <p className="font-apple-body text-[15px] text-[#7a7a7a] mb-5">
                Pedido #{deliverOrder.id.slice(0, 8)} &bull; {deliverOrder.recipientName}. Adjunta una foto como prueba de entrega.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoLoading(true);
                  try {
                    const dataUrl = await fileToCompressedDataUrl(file);
                    setDeliveryPhoto(dataUrl);
                  } catch (err) {
                    toast("Error al procesar la foto: " + err.message, "error");
                  } finally {
                    setPhotoLoading(false);
                    e.target.value = "";
                  }
                }}
              />

              {deliveryPhoto ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="block w-full rounded-[14px] overflow-hidden border border-[#e0e0e0] mb-5"
                >
                  <img src={deliveryPhoto} alt="Foto de entrega" className="w-full h-[220px] object-cover" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  className="w-full h-[220px] mb-5 rounded-[14px] border-2 border-dashed border-[#d2d2d7] flex flex-col items-center justify-center gap-3 text-[#7a7a7a] hover:border-[#0066cc] hover:text-[#0066cc] transition-colors disabled:opacity-50"
                >
                  <Camera size={40} strokeWidth={1.5} />
                  <span className="font-apple-body text-[15px]">{photoLoading ? "Procesando…" : "Tomar / subir foto"}</span>
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeliverOrder(null)}
                  disabled={updateStatus.isPending}
                  className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    updateStatus.mutate(
                      { orderId: deliverOrder.id, status: "DELIVERED", deliveryPhoto },
                      {
                        onSuccess: () => {
                          toast("Pedido entregado con éxito", "success");
                          setDeliverOrder(null);
                          setDeliveryPhoto(null);
                        },
                        onError: (e) => toast("Error: " + e.message, "error"),
                      },
                    );
                  }}
                  disabled={updateStatus.isPending || !deliveryPhoto}
                  className="flex-1 px-4 py-3 bg-[#059669] text-white rounded-[9999px] font-apple-body text-[17px] hover:bg-[#047857] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
                >
                  {updateStatus.isPending ? "Entregando…" : "Marcar entregado"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
