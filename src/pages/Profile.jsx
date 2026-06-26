import { useState } from "react";
import { User, Heart, ShoppingBag, Users, Settings, Bell, Wallet, CreditCard, X, Truck, Plus } from "lucide-react";
import OrderTimeline from "../components/OrderTimeline";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../hooks/useOrders";
import { useFavorites, useRemoveFavorite } from "../hooks/useFavorites";
import { useContacts, useCreateContact } from "../hooks/useContacts";
import { useUnreadCount, useMarkAllAsRead } from "../hooks/useNotifications";
import { api } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../context/ToastContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDetails, setShowDetails] = useState(false);
  const [contactoToShow, setContactoToShow] = useState({ id: null, nombre: "", email: "" });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", address: "" });
  const createContact = useCreateContact();

  const { data: ordersRes, isLoading: ordersLoading } = useOrders({ enabled: !!user });
  const { data: favoritesRes, isLoading: favLoading } = useFavorites({ enabled: !!user });
  const { data: contactsRes, isLoading: contactsLoading } = useContacts({ enabled: !!user });
  const { data: unreadRes } = useUnreadCount({ enabled: !!user });

  const orders = ordersRes?.data || [];
  const favoriteProducts = favoritesRes?.data || [];
  const contacts = contactsRes?.data || [];
  const unreadCount = unreadRes?.count || 0;

  const removeFavorite = useRemoveFavorite();
  const markAllRead = useMarkAllAsRead();

  const handleShowDetails = (contacto) => {
    setShowDetails(true);
    setContactoToShow(contacto);
  };

  const handleSaveProfile = async () => {
    const nameInput = document.getElementById("profile-name");
    const emailInput = document.getElementById("profile-email");
    try {
      const data = await api.put("/auth/me", {
        name: nameInput?.value,
        email: emailInput?.value,
      });
      updateUser(data.user);
      toast("Perfil actualizado", "success");
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: User },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "contacts", label: "Contactos", icon: Users },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  if (!user) {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
        <p className="text-center font-apple-body text-[17px] text-[#7a7a7a]">
          Inicia sesión para ver tu perfil
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 space-y-6">
      <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f]">
        Perfil
      </h1>

      <div className="flex gap-2 border-b border-[#e0e0e0] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]"
                  : "text-[#7a7a7a] hover:text-[#1d1d1f]"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-1">
                  {user.name}
                </h2>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  {user.email}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => markAllRead.mutate()}
                  className="px-3 py-2 bg-[#1d1d1f] text-[#ffffff] rounded-[8px] flex items-center gap-2 font-apple-body text-[14px] font-normal leading-[1.29] tracking-[-0.224px]"
                >
                  <Bell size={18} />
                  Notificaciones
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#0066cc] text-white rounded-full text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={24} className="text-[#0066cc]" />
                <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                  Saldo
                </h3>
              </div>
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] tabular-nums">
                {(user.balance || 0).toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag size={24} className="text-[#0066cc]" />
                <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                  Pedidos
                </h3>
              </div>
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] tabular-nums">
                {orders.length}
              </p>
            </div>
            <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Heart size={24} className="text-[#0066cc]" />
                <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                  Favoritos
                </h3>
              </div>
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] tabular-nums">
                {favoriteProducts.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-4">
          {favLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
                  <div className="h-7 bg-[#f5f5f7] rounded w-2/3 mb-3" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-center py-[80px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
              No tienes productos favoritos
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteProducts.map((product) => (
                <div key={product.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-2">
                        {product.name}
                      </h3>
                      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        {product.price} FCFA/{product.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFavorite.mutate(product.id)}
                      className="text-[#0066cc] font-apple-body text-[14px] hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow animate-pulse">
                  <div className="h-7 bg-[#f5f5f7] rounded w-1/3 mb-2" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-1/4 mb-4" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-full mb-2" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-[80px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
              No tienes pedidos aún
            </div>
          ) : (
            orders.map((order) => {
              const badgeColors = {
                DELIVERED: "bg-[#ecfdf5] text-[#059669]",
                CANCELLED: "bg-[#fef2f2] text-[#dc2626]",
                PENDING: "bg-[#fffbeb] text-[#d97706]",
                CONFIRMED: "bg-[#eff6ff] text-[#0066cc]",
                PROCESSING: "bg-[#f5f3ff] text-[#7c3aed]",
                SHIPPED: "bg-[#ecfdf5] text-[#059669]",
                PICKED_UP: "bg-[#ecfdf5] text-[#059669]",
                IN_TRANSIT: "bg-[#eff6ff] text-[#0066cc]",
              };
              const statusLabels = {
                DELIVERED: "Entregado",
                CANCELLED: "Cancelado",
                PENDING: "Pendiente",
                CONFIRMED: "Confirmado",
                PROCESSING: "En Preparación",
                SHIPPED: "Enviado",
                PICKED_UP: "Recogido",
                IN_TRANSIT: "En Camino",
              };
              return (
              <div key={order.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="font-apple-body text-[15px] text-[#7a7a7a]">
                      {new Date(order.createdAt).toLocaleDateString()} &bull; {order.recipientName}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-[9999px] font-apple-body text-[13px] font-medium ${badgeColors[order.status] || "bg-[#f5f5f7] text-[#1d1d1f]"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                <div className="bg-[#f5f5f7] rounded-[12px] p-4">
                  <OrderTimeline status={order.status} />
                </div>

                {order.delivery && (
                  <div className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
                    <Truck size={16} className="text-[#059669]" />
                    <span className="font-apple-body">Repartidor: <strong>{order.delivery.name}</strong></span>
                  </div>
                )}

                <div className="border-t border-[#e0e0e0] pt-4 space-y-2 tabular-nums">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between font-apple-body text-[15px] text-[#7a7a7a]">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                  <div className="border-t border-[#e0e0e0] pt-2 flex justify-between font-apple-display text-[24px] font-semibold leading-[1.14] text-[#1d1d1f]">
                    <span>Total</span>
                    <span>{order.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
                Contactos
              </h3>
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[15px] font-normal hover:bg-[#0071e3] transition-colors duration-150"
              >
                <Plus size={18} />
                Añadir
              </button>
            </div>
            {contactsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse p-4 border border-[#e0e0e0] rounded-[8px]">
                    <div className="h-6 bg-[#f5f5f7] rounded w-1/3 mb-2" />
                    <div className="h-5 bg-[#f5f5f7] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="font-apple-body text-[17px] text-[#7a7a7a] text-center py-8">
                No tienes contactos guardados. ¡Añade tu primer contacto!
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center p-4 border border-[#e0e0e0] rounded-[8px]"
                  >
                    <div>
                      <p className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                        {contact.name}
                      </p>
                      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        {contact.email || contact.phone || ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleShowDetails(contact)}
                      className="text-[#0066cc] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px]"
                    >
                      Ver detalles
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddContact && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true" aria-label="A\u00f1adir contacto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddContact(false)} />
          <div className="relative min-h-full flex items-center justify-center p-6">
            <div className="relative bg-[#ffffff] rounded-[18px] no-shadow w-full max-w-md p-6 animate-fade-in">
            <button
              onClick={() => setShowAddContact(false)}
              className="absolute top-4 right-4 p-2 hover:bg-[#f5f5f7] rounded-full transition-colors duration-150"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
            <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-6">
              A\u00f1adir Contacto
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newContact.name.trim()) {
                  toast("El nombre es obligatorio", "error");
                  return;
                }
                if (!newContact.phone.trim()) {
                  toast("El tel\u00e9fono es obligatorio", "error");
                  return;
                }
                createContact.mutate(newContact, {
                  onSuccess: () => {
                    toast("Contacto a\u00f1adido", "success");
                    setNewContact({ name: "", email: "", phone: "", address: "" });
                    setShowAddContact(false);
                  },
                  onError: (err) => toast(err.message, "error"),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="contact-name" className="block font-apple-body text-[14px] leading-[1.43] text-[#7a7a7a] mb-1">
                  Nombre completo <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nombre del contacto"
                  autoComplete="name"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-[10px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 font-apple-body text-[17px] transition-shadow duration-150"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block font-apple-body text-[14px] leading-[1.43] text-[#7a7a7a] mb-1">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-[10px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 font-apple-body text-[17px] transition-shadow duration-150"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block font-apple-body text-[14px] leading-[1.43] text-[#7a7a7a] mb-1">
                  Tel\u00e9fono <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+245 XXX XXX XXX"
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-[10px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 font-apple-body text-[17px] transition-shadow duration-150"
                />
              </div>
              <div>
                <label htmlFor="contact-address" className="block font-apple-body text-[14px] leading-[1.43] text-[#7a7a7a] mb-1">
                  Direcci\u00f3n
                </label>
                <input
                  id="contact-address"
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="Direcci\u00f3n en Guinea-Bissau"
                  autoComplete="street-address"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-[10px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 font-apple-body text-[17px] transition-shadow duration-150"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createContact.isPending}
                  className="flex-1 px-4 py-3 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[17px] hover:bg-[#0071e3] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {createContact.isPending ? "Guardando\u2026" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
            <h3 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-4 flex items-center gap-2">
              <User size={20} />
              Datos Personales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1">
                  Nombre
                </label>
                <input
                  id="profile-name"
                  type="text"
                  defaultValue={user.name}
                  className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px]"
                />
              </div>
              <div>
                <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-[#e0e0e0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px]"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="bg-[#0066cc] text-white font-apple-body text-[17px] px-6 py-2 rounded-[9999px] hover:bg-[#0071e3] transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          />
          <div className="relative bg-[#ffffff] rounded-[18px] no-shadow max-w-md w-full p-[24px]">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-2 hover:bg-[#f5f5f7] rounded-full"
            >
              <X size={24} />
            </button>
            <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-4">
              Detalles del Contacto
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  Nombre
                </p>
                <p className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                  {contactoToShow.name}
                </p>
              </div>
              <div>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  Email
                </p>
                <p className="font-apple-display text-[22px] font-semibold leading-[1.14] text-[#1d1d1f]">
                  {contactoToShow.email || "—"}
                </p>
              </div>
              <div>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  Tel&eacute;fono
                </p>
                <p className="font-apple-display text-[22px] font-semibold leading-[1.14] text-[#1d1d1f]">
                  {contactoToShow.phone || "—"}
                </p>
              </div>
              <div>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  Direcci&oacute;n
                </p>
                <p className="font-apple-display text-[22px] font-semibold leading-[1.14] text-[#1d1d1f]">
                  {contactoToShow.address || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
