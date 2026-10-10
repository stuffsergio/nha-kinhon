import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Truck, ArrowLeft } from "lucide-react";
import { useDeliveryLogin, useDeliveryRegister } from "../hooks/useDeliveryAuth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function DeliveryLogin() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const loginMutation = useDeliveryLogin();
  const registerMutation = useDeliveryRegister();

  const [form, setForm] = useState({
    email: "", password: "", name: "", confirmPassword: "", phone: "", vehicle: "moto", serviceArea: "Bissau",
  });

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  if (user?.role === "DELIVERY") {
    navigate("/delivery/dashboard", { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email: form.email, password: form.password });
      toast( t("delivery.welcome"), "success");
      navigate("/delivery/dashboard", { replace: true });
    } catch (err) {
      toast(err.message || t("delivery.loginError"), "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      toast( t("delivery.fillRequired"), "error");
      return;
    }
    if (form.password.length < 6) {
      toast( t("auth.passwordMin"), "error");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast( t("auth.passwordMismatch"), "error");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone.trim(), vehicle: form.vehicle, serviceArea: form.serviceArea,
      });
      toast( t("delivery.registerDone"), "success");
      navigate("/delivery/dashboard", { replace: true });
    } catch (err) {
      toast(err.message || t("delivery.registerError"), "error");
    }
  };

  return (
    <div className="w-full min-h-[80dvh] flex items-center justify-center px-6 py-[80px]">
      <div className="w-full max-w-[440px] mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 font-apple-body text-[15px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors mb-6">
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#059669]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-[#059669]" />
          </div>
          <h1 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-2">
            Repartidores
          </h1>
          <p className="font-apple-body text-[17px] text-[#7a7a7a]">
            {tab === "login" ? t("delivery.loginSubtitle") : t("delivery.registerSubtitle")}
          </p>
        </div>

        <div className="flex mb-8 border-b border-[#e0e0e0]">
          <button onClick={() => setTab("login")} className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors ${tab === "login" ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]" : "text-[#7a7a7a]"}`}>
            Iniciar Sesión
          </button>
          <button onClick={() => setTab("register")} className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors ${tab === "register" ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]" : "text-[#7a7a7a]"}`}>
            Registrarse
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Email</label>
              <input type="email" value={form.email} onChange={update("email")} placeholder={t("auth.emailPlaceholder")} required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Contraseña</label>
              <input type="password" value={form.password} onChange={update("password")} placeholder="••••••" required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <button type="submit" disabled={loginMutation.isPending} className="w-full py-3 bg-[#059669] text-white rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] hover:bg-[#047857] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed">
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Nombre completo *</label>
              <input type="text" value={form.name} onChange={update("name")} placeholder={t("auth.yourName")} required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Email *</label>
              <input type="email" value={form.email} onChange={update("email")} placeholder={t("auth.emailPlaceholder")} required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Teléfono *</label>
                <input type="tel" value={form.phone} onChange={update("phone")} placeholder="+245 XXX XXX" required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
              </div>
              <div>
                <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Vehículo</label>
                <select value={form.vehicle} onChange={update("vehicle")} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px] bg-white">
                  <option value="a_pie">A pie</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="moto">Moto</option>
                  <option value="coche">Coche</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Zona de trabajo</label>
              <select value={form.serviceArea} onChange={update("serviceArea")} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px] bg-white">
                <option value="Bissau">Bissau</option>
                <option value="Gabu">Gabu</option>
                <option value="Cacheu">Cacheu</option>
                <option value="Bolama">Bolama</option>
                <option value="Bafatá">Bafatá</option>
                <option value="Quinara">Quinara</option>
                <option value="Tombali">Tombali</option>
                <option value="Oio">Oio</option>
              </select>
            </div>
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Contraseña *</label>
              <input type="password" value={form.password} onChange={update("password")} placeholder={t("auth.minPassword")} required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <div>
              <label className="block font-apple-body text-[14px] text-[#7a7a7a] mb-1">Confirmar contraseña *</label>
              <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder={t("auth.repeatPassword")} required className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#059669] font-apple-body text-[17px]" />
            </div>
            <button type="submit" disabled={registerMutation.isPending} className="w-full py-3 bg-[#059669] text-white rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] hover:bg-[#047857] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed">
              {registerMutation.isPending ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
