import { useState } from "react";
import { User, Heart, ShoppingBag, Users, Settings, Bell, Wallet, CreditCard, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../hooks/useOrders";
import { useFavorites, useRemoveFavorite } from "../hooks/useFavorites";
import { useContacts } from "../hooks/useContacts";
import { useUnreadCount, useMarkAllAsRead } from "../hooks/useNotifications";
import { api } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDetails, setShowDetails] = useState(false);
  const [contactoToShow, setContactoToShow] = useState({ id: null, nombre: "", email: "" });

  const { data: ordersRes } = useOrders();
  const { data: favoritesRes } = useFavorites();
  const { data: contactsRes } = useContacts();
  const { data: unreadRes } = useUnreadCount();

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
      alert("Perfil actualizado");
    } catch (e) {
      alert("Error: " + e.message);
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
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">
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
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">
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
              <p className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]">
                {favoriteProducts.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-4">
          {favoriteProducts.length === 0 ? (
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
          {orders.length === 0 ? (
            <div className="text-center py-[80px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
              No tienes pedidos aún
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-[9999px] font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] ${
                    order.status === "DELIVERED" ? "bg-[#f5f5f7] text-[#1d1d1f]" : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}>
                    {order.status === "DELIVERED" ? "Entregado" :
                     order.status === "PENDING" ? "Pendiente" :
                     order.status === "CONFIRMED" ? "Confirmado" :
                     order.status === "PROCESSING" ? "En Preparación" :
                     order.status === "SHIPPED" ? "Enviado" :
                     order.status === "CANCELLED" ? "Cancelado" : order.status}
                  </span>
                </div>
                <div className="border-t border-[#e0e0e0] pt-4">
                  <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-2">
                    Destinatario: {order.recipientName}
                  </p>
                  <div className="space-y-2">
                    {(order.items || []).map((item, index) => (
                      <div key={index} className="flex justify-between font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#e0e0e0] mt-2 pt-2 flex justify-between font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                    <span>Total</span>
                    <span>{order.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
            <h3 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-4">
              Contactos Añadidos
            </h3>
            {contacts.length === 0 ? (
              <p className="font-apple-body text-[17px] text-[#7a7a7a]">No tienes contactos guardados</p>
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
                        {contact.email || ""}
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
                <p className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                  {contactoToShow.email || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
