import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(searchParams.get("mode") === "register" ? "register" : "login");
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
      if (!form.name.trim()) {
        setError(t("auth.fillName"));
        return;
      }
      if (!form.email.trim()) {
        setError(t("auth.fillEmail"));
        return;
      }
      if (!form.password) {
        setError(t("auth.fillPassword"));
        return;
      }
      if (form.password.length < 6) {
        setError(t("auth.passwordMin"));
        return;
      }
      if (form.password !== form.confirm) {
        setError(t("auth.passwordMismatch"));
        return;
      }
    } else {
      if (!form.email.trim()) {
        setError(t("auth.fillEmail"));
        return;
      }
      if (!form.password) {
        setError(t("auth.fillPassword"));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate("/inicio");
    } catch (err) {
      setError(err.message || t("common.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-5 py-4 border border-[#d2d2d7] rounded-[14px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 focus:border-transparent font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] placeholder:text-[#7a7a7a] bg-white transition-shadow duration-150";

  return (
    <div className="w-full max-w-[980px] mx-auto px-6">
      <div className="py-[60px]">
        <Link
          to="/"
          className="font-apple-body text-[17px] text-[#0066cc] hover:underline inline-flex items-center gap-1.5 mb-10"
        >
          &larr; {t("common.back")}
        </Link>

        <div className="flex flex-col lg:flex-row lg:gap-24">
          <div className="flex-1 mb-12 lg:mb-0">
            <h1 className="font-apple-display text-[48px] lg:text-[64px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-3">
              {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
            </h1>
            <p className="font-apple-body text-[17px] text-[#7a7a7a] leading-[1.6]">
              {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
            </p>
          </div>

          <div className="w-full lg:w-[440px]">
            <div className="flex gap-0 mb-8 border-b border-[#e0e0e0]" role="tablist">
              <button
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => switchMode("login")}
                className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors duration-150 ${
                  mode === "login"
                    ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]"
                    : "text-[#7a7a7a] hover:text-[#1d1d1f]"
                }`}
              >
                {t("auth.loginTitle")}
              </button>
              <button
                role="tab"
                aria-selected={mode === "register"}
                onClick={() => switchMode("register")}
                className={`flex-1 pb-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] transition-colors duration-150 ${
                  mode === "register"
                    ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]"
                    : "text-[#7a7a7a] hover:text-[#1d1d1f]"
                }`}
              >
                {t("nav.register")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "register" && (
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5"
                  >
                    {t("auth.fullName")}
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("auth.yourName")}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor={`${mode}-email`}
                  className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5"
                >
                  {t("common.email")}
                </label>
                <input
                  id={`${mode}-email`}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  inputMode="email"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor={`${mode}-password`}
                  className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5"
                >
                  {t("auth.password")}
                </label>
                <input
                  id={`${mode}-password`}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={mode === "register" ? t("auth.minPassword") : t("auth.yourPassword")}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className={inputClass}
                />
              </div>

              {mode === "register" && (
                <div>
                  <label
                    htmlFor="reg-confirm"
                    className="block font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] mb-1.5"
                  >
                    {t("auth.confirmPassword")}
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder={t("auth.repeatPassword")}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-[14px] px-5 py-4" role="alert">
                  <p className="font-apple-body text-[15px] text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0066cc] text-white font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[14px] hover:bg-[#0071e3] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 disabled:bg-[#d2d2d7] disabled:cursor-not-allowed transition-colors duration-150"
              >
                {submitting
                  ? t("common.processing")
                  : mode === "login"
                    ? t("auth.loginTitle")
                    : t("auth.registerTitle")}
              </button>

              <p className="text-center font-apple-body text-[15px] text-[#7a7a7a] pt-2">
                {mode === "login" ? (
                  <>
                    {t("auth.noAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-[#0066cc] hover:underline font-medium"
                    >
                      {t("auth.signUpLink")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("auth.hasAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-[#0066cc] hover:underline font-medium"
                    >
                      {t("auth.signInLink")}
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
