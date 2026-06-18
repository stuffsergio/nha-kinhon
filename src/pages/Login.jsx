import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const initialForm = { email: "", password: "" };
  const admin = { email: "test@gmail.com", password: "1234" };
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(form);

    if (!form.email) {
      setError("Debes rellenar el email");
      return;
    }
    if (!form.password) {
      setError("Debes rellenar la contraseña");
      return;
    }

    if (form.email !== admin.email) {
      setError("Usuario no existente");
      return;
    } else if (form.password != admin.password) {
      setError("Credenciales incorrectas");
      return;
    }

    if (form.email === admin.email && form.password === admin.password) {
      console.log("Credenciales correctas, redirigiendo...");
    }

    navigate("/servicios");
  };

  return (
    <div className="m-auto text-center">
      <div>
        <Link to="/">Volver atrás</Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center w-[40dvw] p-6 gap-4 border bg-black/20"
      >
        <div className="flex flex-col items-start gap-2">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border border-black/60 px-4 py-2 text-lg"
          />
        </div>
        <div className="flex flex-col items-start gap-2">
          <label htmlFor="password">Password</label>
          <div>
            {showPassword ? (
              <input
                type="text"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="border border-black/60 px-4 py-2 text-lg"
              />
            ) : (
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="border border-black/60 px-4 py-2 text-lg"
              />
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              Show
            </button>
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="bg-black text-white px-3 py-1.5 text-xl"
          >
            Entrar
          </button>
        </div>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
}
