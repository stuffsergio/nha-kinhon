import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import BottomNavBar from "../components/BottomNavBar";

export default function MainLayout() {
  return (
    <div className="flex flex-col">
      <main className="min-h-screen relative">
        <Outlet />
      </main>
      <footer>
        <Footer />
      </footer>
      <BottomNavBar />
    </div>
  );
}
