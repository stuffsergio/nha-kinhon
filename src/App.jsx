import "./App.css";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Map from "./pages/Map";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Services from "./pages/Services";
import Support from "./pages/Support";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/mapa" element={<Map />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/supporters" element={<Support />} />
        </Route>
      </Routes>
    </>
  );
}
