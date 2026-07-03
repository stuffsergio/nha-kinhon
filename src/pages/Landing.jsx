import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, MapPin, CreditCard, HeartHandshake, Truck, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const steps = [
  {
    icon: ShoppingBag,
    title: "Elige productos",
    description: "Selecciona alimentos y productos de mercados locales de Guinea-Bissau.",
  },
  {
    icon: CreditCard,
    title: "Paga desde tu país",
    description: "Usa tu tarjeta internacional. Nosotros gestionamos el pago y la logística.",
  },
  {
    icon: HeartHandshake,
    title: "Reciben en casa",
    description: "Tu familia recibe el pedido directamente en su domicilio en Guinea-Bissau.",
  },
];

const benefits = [
  {
    icon: MapPin,
    title: "Cobertura nacional",
    description: "Llegamos a cualquier región de Guinea-Bissau. Sin importar lo remoto.",
  },
  {
    icon: Truck,
    title: "Delivery confiable",
    description: "Repartidores verificados con seguimiento en tiempo real de tu pedido.",
  },
  {
    icon: ShieldCheck,
    title: "Pago seguro",
    description: "Transacciones protegidas con Stripe. Tu dinero está seguro hasta la entrega.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate("/inicio", { replace: true });
    return null;
  }

  return (
    <div className="w-full">
      <section className="bg-[#000000] py-[120px] px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="font-apple-display text-[64px] font-semibold leading-[1.05] tracking-[-0.36px] text-[#ffffff] mb-6">
            Nha Kinhon
          </h1>
          <p className="font-apple-body text-[24px] font-normal leading-[1.33] tracking-[0.144px] text-[#cccccc] mb-4 max-w-[600px] mx-auto">
            Envía comida y productos a tus familiares en Guinea-Bissau desde cualquier parte del mundo.
          </p>
          <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-12">
            Conectamos la diáspora guineana con sus seres queridos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/login?mode=register"
              className="inline-flex items-center font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-white bg-[#0066cc] rounded-[9999px] px-[24px] py-[10px] hover:bg-[#0071e3] transition-colors duration-150"
            >
              Crear cuenta
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#2997ff] border border-[#2997ff] rounded-[9999px] px-[24px] py-[10px] hover:bg-[#2997ff] hover:text-white transition-colors duration-150"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#ffffff] py-[100px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            Cómo funciona
          </h2>
          <p className="font-apple-body text-[21px] font-normal leading-[1.38] tracking-[0.168px] text-[#7a7a7a] mb-[60px] max-w-[600px] mx-auto">
            Tres pasos sencillos para enviar a tus seres queridos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon size={32} className="text-[#0066cc]" strokeWidth={1.5} />
                </div>
                <div className="w-8 h-[2px] bg-[#0066cc] mx-auto mb-4 hidden md:block" />
                <span className="font-apple-body text-[13px] font-semibold leading-[1.38] tracking-[-0.08px] text-[#0066cc] uppercase mb-2 block">
                  Paso {i + 1}
                </span>
                <h3 className="font-apple-display text-[24px] font-semibold leading-[1.16] tracking-[0.144px] text-[#1d1d1f] mb-3">
                  {step.title}
                </h3>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f7] py-[100px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            ¿Por qué Nha Kinhon?
          </h2>
          <p className="font-apple-body text-[21px] font-normal leading-[1.38] tracking-[0.168px] text-[#7a7a7a] mb-[60px] max-w-[600px] mx-auto">
            La forma más fácil y segura de enviar a Guinea-Bissau
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-[#ffffff] p-8 rounded-[18px] text-center no-shadow hover:shadow-product transition-shadow duration-250"
              >
                <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-5">
                  <b.icon size={28} className="text-[#1d1d1f]" strokeWidth={1.5} />
                </div>
                <h3 className="font-apple-display text-[20px] font-semibold leading-[1.2] text-[#1d1d1f] mb-3">
                  {b.title}
                </h3>
                <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000000] py-[100px] px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#ffffff] mb-4">
            Únete a la diáspora guineana
          </h2>
          <p className="font-apple-body text-[21px] font-normal leading-[1.38] tracking-[0.168px] text-[#cccccc] mb-10 max-w-[500px] mx-auto">
            Crea tu cuenta gratis y empieza a enviar a tus familiares hoy mismo.
          </p>
          <Link
            to="/login?mode=register"
            className="inline-flex items-center font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-white bg-[#0066cc] rounded-[9999px] px-[28px] py-[12px] hover:bg-[#0071e3] transition-colors duration-150"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </div>
  );
}
