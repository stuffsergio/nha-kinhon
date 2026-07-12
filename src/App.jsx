import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PublicLayout from "./layouts/PublicLayout";

const Landing = lazy(() => import("./pages/Landing"));
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
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6" role="status" aria-live="polite">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-[#f5f5f7] rounded w-1/3" />
        <div className="h-6 bg-[#f5f5f7] rounded w-2/3" />
        <div className="h-6 bg-[#f5f5f7] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://js.stripe.com";
    document.head.appendChild(link);

    const link2 = document.createElement("link");
    link2.rel = "preconnect";
    link2.href = "https://tile.openstreetmap.org";
    document.head.appendChild(link2);

    return () => {
      link.remove();
      link2.remove();
    };
  }, []);

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/inicio" element={<Home />} />
          <Route path="/mapa" element={<Map />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/perfil" element={<Profile />} />
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
