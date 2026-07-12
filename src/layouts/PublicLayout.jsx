import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

export default function PublicLayout() {
  return (
    <div className="flex flex-col">
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
