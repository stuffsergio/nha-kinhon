import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="w-[80dvw] h-[8dvh] my-4 m-auto text-center flex flex-row justify-between items-center py-2 px-10 border">
      <NavLink to="/">LOGO</NavLink>
      <NavLink to="/">Home</NavLink>

      <NavLink to="/servicios">Servicios</NavLink>

      <NavLink to="/login">Login</NavLink>

      <NavLink to="/perfil">Profile</NavLink>
    </nav>
  );
}
