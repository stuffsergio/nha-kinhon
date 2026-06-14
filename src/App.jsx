import "./App.css";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Services from "./pages/Services";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}
