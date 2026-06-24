import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Map = lazy(() => import("./pages/Map"));
const Search = lazy(() => import("./pages/Search"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/Login"));
const Services = lazy(() => import("./pages/Services"));
const Support = lazy(() => import("./pages/Support"));
const Admin = lazy(() => import("./pages/Admin"));
const DeliveryLogin = lazy(() => import("./pages/DeliveryLogin"));
const DeliveryDashboard = lazy(() => import("./pages/DeliveryDashboard"));
const MarketDetail = lazy(() => import("./pages/MarketDetail"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-[#f5f5f7] rounded w-1/3" />
        <div className="h-6 bg-[#f5f5f7] rounded w-2/3" />
        <div className="h-6 bg-[#f5f5f7] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/tienda/:id" element={<MarketDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/delivery/login" element={<DeliveryLogin />} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
      </Routes>
    </Suspense>
  );
}
