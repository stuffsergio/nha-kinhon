import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.name.trim()) { setError("Debes rellenar el nombre"); return; }
      if (!form.email.trim()) { setError("Debes rellenar el email"); return; }
      if (!form.password) { setError("Debes rellenar la contraseña"); return; }
      if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
      if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    } else {
      if (!form.email.trim()) { setError("Debes rellenar el email"); return; }
      if (!form.password) { setError("Debes rellenar la contraseña"); return; }
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
      <div className="max-w-md mx-auto">
        <Link to="/" className="font-apple-body text-[17px] text-[#0066cc] hover:underline inline-block mb-8">
          &larr; Volver atrás
        </Link>

        <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-2">
          {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a] mb-10">
          {mode === "login"
            ? "Accede a tu cuenta para realizar pedidos"
            : "Regístrate para empezar a enviar comida"}
        </p>

        <div className="flex gap-0 mb-10 border-b border-[#e0e0e0]">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors ${
              mode === "login"
                ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]"
                : "text-[#7a7a7a] hover:text-[#1d1d1f]"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors ${
              mode === "register"
                ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]"
                : "text-[#7a7a7a] hover:text-[#1d1d1f]"
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <div>
              <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5">
                Nombre completo
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] placeholder:text-[#7a7a7a]"
              />
            </div>
          )}

          <div>
            <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] placeholder:text-[#7a7a7a]"
            />
          </div>

          <div>
            <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] placeholder:text-[#7a7a7a]"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] placeholder:text-[#7a7a7a]"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3">
              <p className="font-apple-body text-[14px] text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0066cc] text-white font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[12px] hover:bg-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed transition-colors btn-apple-active"
          >
            {submitting
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
          </button>

          <p className="text-center font-apple-body text-[14px] text-[#7a7a7a] mt-6">
            {mode === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => switchMode("register")} className="text-[#0066cc] hover:underline">
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => switchMode("login")} className="text-[#0066cc] hover:underline">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
