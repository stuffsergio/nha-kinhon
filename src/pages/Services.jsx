import { Package, Send, Heart, Shield } from "lucide-react";
import ButtonPrimary from "../components/ButtonPrimary";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Package,
    title: "Envío de Productos",
    description: "Selecciona productos de nuestros mercados asociados en Guinea-Bissau y recíbelos directamente en la dirección que indiques.",
    features: ["Compra por categorías", "Selección de mercado", "Entrega a domicilio"],
  },
  {
    icon: Send,
    title: "Envío de Dinero",
    description: "Envía dinero de forma segura a tus familiares y amigos en Guinea-Bissau desde cualquier parte del mundo.",
    features: ["Transferencias seguras", "Cambio de divisa", "Notificación al receptor"],
  },
  {
    icon: Heart,
    title: "Asistencia Familiar",
    description: "Coordina ayudas y paquetes familiares con seguimiento personalizado para asegurar que todo llegue a su destino.",
    features: ["Paquetes personalizados", "Seguimiento en tiempo real", "Confirmación de entrega"],
  },
  {
    icon: Shield,
    title: "Atención al Cliente",
    description: "Soporte dedicado para resolver cualquier duda o incidencia durante todo el proceso de envío.",
    features: ["Soporte 24/7", "Asistencia en portugués y crioulo", "Resolución rápida"],
  },
];

export default function Services() {
  return (
    <div className="w-full">
      <section className="bg-[#ffffff] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            Servicios
          </h1>
          <p className="font-apple-body text-[24px] font-normal leading-[1.17] tracking-[0.168px] text-[#7a7a7a] max-w-[680px] mx-auto">
            Todo lo que necesitas para hacer llegar tu apoyo a Guinea-Bissau
          </p>
        </div>
      </section>

      <section className="bg-[#f5f5f7] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="bg-[#ffffff] p-[32px] rounded-[18px] no-shadow">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-5">
                  <Icon size={24} className="text-[#0066cc]" />
                </div>
                <h2 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-3">
                  {service.title}
                </h2>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-5">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="font-apple-body text-[15px] font-normal leading-[1.43] tracking-[-0.224px] text-[#1d1d1f] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#ffffff] py-[80px] px-6 text-center">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-8">
            Explora nuestros productos y encuentra todo lo que necesitas
          </p>
          <Link to="/buscar">
            <ButtonPrimary>Comenzar ahora</ButtonPrimary>
          </Link>
        </div>
      </section>
    </div>
  );
}
