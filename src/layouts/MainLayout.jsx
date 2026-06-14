import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";

export default function MainLayout() {
  return (
    <div className="flex flex-col">
      <header>
        <NavBar />
      </header>
      <main className="min-h-screen relative">
        <Outlet />
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}
