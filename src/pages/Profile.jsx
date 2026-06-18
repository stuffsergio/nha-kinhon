import { useState } from "react";
import { User, Heart, ShoppingBag, Users, Settings, Bell, Wallet, CreditCard, X, Plus, Minus } from "lucide-react";
import { users } from "../data/users";
import { products } from "../data/products";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDetails, setShowDetails] = useState(false);
  const [contactoToShow, setContactoToShow] = useState({ id: null, nombre: "", email: "" });
  
  const user = users[0];
  const favoriteProducts = products.filter((p) => user.favorites.includes(p.id));

  const handleShowDetails = (contacto) => {
    setShowDetails(true);
    setContactoToShow(contacto);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: User },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "contacts", label: "Contactos", icon: Users },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="relative">
                <button className="px-3 py-2 bg-black text-white rounded-lg flex items-center gap-2">
                  <Bell size={18} />
                  Notificaciones
                </button>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  2
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={24} className="text-green-600" />
                <h3 className="font-semibold">Saldo</h3>
              </div>
              <p className="text-3xl font-bold">{user.balance.toLocaleString()} FCFA</p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag size={24} className="text-blue-600" />
                <h3 className="font-semibold">Pedidos</h3>
              </div>
              <p className="text-3xl font-bold">{user.orders.length}</p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Heart size={24} className="text-red-600" />
                <h3 className="font-semibold">Favoritos</h3>
              </div>
              <p className="text-3xl font-bold">{user.favorites.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-4">
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tienes productos favoritos
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 p-4 rounded-xl">
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600">{product.price} FCFA/{product.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {user.orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                  <p className="text-gray-600 text-sm">{order.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === "entregado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.status === "entregado" ? "Entregado" : "En Proceso"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">Destinatario: {order.recipient.name}</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>Producto #{item.productId} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{order.total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-6 rounded-xl">
            <h3 className="font-semibold mb-4">Contactos Añadidos</h3>
            <div className="space-y-3">
              {user.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-gray-600 text-sm">{contact.email}</p>
                  </div>
                  <button
                    onClick={() => handleShowDetails(contact)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver detalles
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Datos Personales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Métodos de Pago
            </h3>
            <div className="space-y-3">
              {user.paymentMethods.map((method) => (
                <div key={method.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-gray-600" />
                    <div>
                      <p className="font-medium capitalize">{method.type}</p>
                      <p className="text-gray-600 text-sm">**** {method.last4}</p>
                    </div>
                  </div>
                  <span className="text-gray-600 text-sm">{method.expiry}</span>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
                + Agregar Método de Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4">Detalles del Contacto</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Nombre</p>
                <p className="font-semibold">{contactoToShow.nombre}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-semibold">{contactoToShow.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
