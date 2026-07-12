import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  CreditCard,
  HeartHandshake,
  MapPin,
  Truck,
  ShieldCheck,
  Smartphone,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
};

const STAGGER = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { staggerChildren: 0.12 },
};

const CHILD_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

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
    description: "Tu familia recibe el pedido directamente en su domicilio.",
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

const stats = [
  { value: "100+", label: "Productos locales" },
  { value: "Toda", label: "Guinea-Bissau" },
  { value: "24/7", label: "Soporte" },
  { value: "×0", label: "Comisiones ocultas" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate("/inicio", { replace: true });
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-white to-white" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <motion.div className="relative max-w-[800px] mx-auto text-center" {...FADE_UP}>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-white/20 rounded-full px-4 py-1.5 mb-8 shadow-xs">
            <Globe size={14} className="text-primary" />
            <span className="font-apple-body text-[13px] font-medium text-ink-muted-80 tracking-wide">
              Conectando la diáspora guineana
            </span>
          </div>
          <h1 className="font-apple-display text-[56px] md:text-[72px] font-semibold leading-[1.05] tracking-[-0.36px] text-ink mb-6">
            Envía a tus seres queridos
            <span className="text-primary"> desde cualquier lugar</span>
          </h1>
          <p className="font-apple-body text-[20px] md:text-[24px] font-normal leading-[1.4] text-ink-muted-48 mb-10 max-w-[600px] mx-auto">
            Nha Kinhon conecta a la diáspora guineana con sus familiares en Guinea-Bissau.
            Compra productos locales y recíbelos en su domicilio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login?mode=register"
              className="group inline-flex items-center justify-center gap-2 font-apple-body text-[17px] font-medium text-white bg-primary rounded-full px-7 py-3.5 hover:bg-primary-focus transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              Crear cuenta gratis
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center font-apple-body text-[17px] font-medium text-ink bg-white/80 backdrop-blur-xl border border-hairline rounded-full px-7 py-3.5 hover:bg-white hover:border-ink-muted-48 transition-all duration-200 shadow-xs"
            >
              Iniciar sesión
            </Link>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <motion.section className="py-16 px-6 bg-white" {...FADE_UP}>
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[#f5f5f7]/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/50"
              >
                <div className="font-apple-display text-[32px] font-semibold text-primary leading-none mb-1">
                  {s.value}
                </div>
                <div className="font-apple-body text-[14px] text-ink-muted-48">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#f5f5f7]/40">
        <div className="max-w-[980px] mx-auto">
          <motion.div className="text-center mb-16" {...FADE_UP}>
            <span className="font-apple-body text-[13px] font-semibold uppercase tracking-widest text-primary">
              Cómo funciona
            </span>
            <h2 className="font-apple-display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-ink mt-3 mb-4">
              Tres pasos sencillos
            </h2>
            <p className="font-apple-body text-[18px] text-ink-muted-48 max-w-[500px] mx-auto">
              Enviar a tus familiares nunca fue tan fácil
            </p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" {...STAGGER}>
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="group relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 text-center hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
                {...CHILD_UP}
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-gradient-to-r from-primary/30 to-primary/10" />
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
                  <step.icon size={28} className="text-primary" strokeWidth={1.5} />
                </div>
                <span className="font-apple-body text-[12px] font-semibold uppercase tracking-widest text-primary/60 mb-3 block">
                  Paso {i + 1}
                </span>
                <h3 className="font-apple-display text-[22px] font-semibold leading-[1.2] text-ink mb-3">
                  {step.title}
                </h3>
                <p className="font-apple-body text-[16px] leading-[1.6] text-ink-muted-48">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WHY NHA KINHON */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[980px] mx-auto">
          <motion.div className="text-center mb-16" {...FADE_UP}>
            <span className="font-apple-body text-[13px] font-semibold uppercase tracking-widest text-primary">
              Ventajas
            </span>
            <h2 className="font-apple-display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-ink mt-3 mb-4">
              ¿Por qué Nha Kinhon?
            </h2>
            <p className="font-apple-body text-[18px] text-ink-muted-48 max-w-[500px] mx-auto">
              La forma más fácil y segura de enviar a Guinea-Bissau
            </p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" {...STAGGER}>
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                className="group bg-[#f5f5f7]/40 backdrop-blur-sm border border-white/50 rounded-3xl p-8 hover:bg-white hover:shadow-lg hover:shadow-black/5 hover:border-hairline transition-all duration-300"
                {...CHILD_UP}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5 shadow-xs group-hover:shadow-sm transition-shadow">
                  <b.icon size={24} className="text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="font-apple-display text-[20px] font-semibold leading-[1.2] text-ink mb-3">
                  {b.title}
                </h3>
                <p className="font-apple-body text-[16px] leading-[1.6] text-ink-muted-48">
                  {b.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* APP DOWNLOAD */}
      <section className="py-24 px-6 bg-[#f5f5f7]/40">
        <div className="max-w-[980px] mx-auto">
          <motion.div className="flex flex-col md:flex-row items-center gap-12" {...FADE_UP}>
            <div className="flex-1">
              <span className="font-apple-body text-[13px] font-semibold uppercase tracking-widest text-primary">
                App móvil
              </span>
              <h2 className="font-apple-display text-[36px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.28px] text-ink mt-3 mb-4">
                Lleva Nha Kinhon en tu bolsillo
              </h2>
              <p className="font-apple-body text-[18px] leading-[1.6] text-ink-muted-48 mb-8 max-w-[480px]">
                Gestiona tus envíos, haz seguimiento en tiempo real y paga desde tu
                dispositivo Android.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 bg-ink text-white rounded-full px-5 py-3 font-apple-body text-[14px] font-medium shadow-sm">
                  <Smartphone size={18} />
                  Google Play
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                {["Pago seguro con Stripe", "Seguimiento en tiempo real", "Notificaciones push"].map(
                  (feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-primary shrink-0" />
                      <span className="font-apple-body text-[15px] text-ink-muted-80">
                        {feature}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-[280px] h-[560px] bg-ink rounded-[40px] border-4 border-ink/80 shadow-2xl shadow-black/20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-ink rounded-b-2xl z-10" />
                <div className="h-full w-full bg-gradient-to-b from-primary/20 via-white to-white flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={28} className="text-primary" />
                    </div>
                    <p className="font-apple-body text-[13px] text-ink-muted-48">Nha Kinhon</p>
                    <p className="font-apple-display text-[11px] font-semibold text-ink/60 mt-1">
                      Envíos a Guinea-Bissau
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-white to-white" />
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-primary/[0.03] to-transparent rounded-full blur-3xl" />
        <motion.div className="relative max-w-[600px] mx-auto text-center" {...FADE_UP}>
          <h2 className="font-apple-display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-ink mb-4">
            Únete a la diáspora guineana
          </h2>
          <p className="font-apple-body text-[18px] leading-[1.6] text-ink-muted-48 mb-10 max-w-[500px] mx-auto">
            Crea tu cuenta gratis y empieza a enviar a tus familiares hoy mismo.
          </p>
          <Link
            to="/login?mode=register"
            className="group inline-flex items-center justify-center gap-2 font-apple-body text-[17px] font-medium text-white bg-primary rounded-full px-8 py-4 hover:bg-primary-focus transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            Crear cuenta gratis
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
