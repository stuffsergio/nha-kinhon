import { useState } from "react";

const contactos = [
  { id: 1, nombre: "Luz", email: "luz@gmail.com" },
  { id: 2, nombre: "Lucas", email: "lucas@gmail.com" },
  { id: 3, nombre: "Sofía", email: "sofia@gmail.com" },
  { id: 4, nombre: "Sergio", email: "sergio@gmail.com" },
];
const pedidosRealizados = [
  {
    id: 1,
    nombre: "Primo",
    email: "primo@gmail.com",
    productos: ["Patatas", "Tomates", "Arroz", "Yuca"],
  },
  {
    id: 2,
    nombre: "Prima",
    email: "prima@gmail.com",
    productos: ["Pasta", "Huevos", "Pollo", "Naranjas"],
  },
  {
    id: 3,
    nombre: "Tío",
    email: "tio@gmail.com",
    productos: ["Zumo", "Leche", "Castaña", "Manzanas"],
  },
];

export default function Profile() {
  const [showDetails, setShowDetails] = useState(false);
  const [contactoToShow, setContactoToShow] = useState({});
  const handleShowDetails = (contacto) => {
    setShowDetails(true);
    setContactoToShow(contacto);
  };

  return (
    <div className="w-[80dvw] m-auto flex flex-col gap-10">
      <div className="flex flex-row justify-between gap-10 py-5 px-10">
        {/* DATOS PROFILE */}
        <div>
          <h1>Admin</h1>
          <p className="text-sm opacity-90">admin@gmail.com</p>
        </div>
        <div className="relative">
          <button className="px-2 py-1 bg-black text-white rounded-md">
            Ver notificaciones
          </button>
          <span className="absolute -top-2.5 -right-1.5 py-0.5 px-1.5 rounded-full text-xs bg-white text-black border border-black">
            2
          </span>
        </div>
        <div>
          <p>80 €</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 border border-black/60 p-6">
        <h3>Contactos</h3>
        <div className="flex flex-col gap-2 px-14">
          {contactos.map((c, index) => (
            <div
              key={c.id}
              className="flex flex-row justify-between p-6 border border-black/30"
            >
              <p className="text-lg">{c.nombre}</p>
              <button className="text-sm" onClick={() => handleShowDetails(c)}>
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border border-black/60 p-6">
        <h3>Pedidos realizados</h3>
        <div className="flex flex-col gap-2 px-14">
          {pedidosRealizados.map((p, index) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 p-6 border border-black/30"
            >
              <p className="font-bold">{p.nombre}</p>
              <ul className="text-sm flex flex-row gap-1 px-4 py-2">
                {p.productos.map((producto, index) => (
                  <li>
                    {producto} {"  "} |
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* POP-UP DETALLES CONTACTOS */}
      {showDetails && (
        <div className="z-10 overflow-y-hidden">
          {/* OVERLAY */}
          <div
            onClick={() => setShowDetails(false)}
            className="absolute inset-0 bg-black/10 backdrop-blur-lg"
          />

          {/* TARJETA USUARIO */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <div className="relative p-10 border border-white text-white bg-[#1f1f1f]">
              <p>{contactoToShow.nombre}</p>
              <p>{contactoToShow.email}</p>

              <button
                className="absolute top-5 right-5"
                onClick={() => setShowDetails(false)}
              >
                X
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
