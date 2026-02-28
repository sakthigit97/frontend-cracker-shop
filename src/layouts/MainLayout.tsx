import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function MainLayout() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-[var(--color-background)] pt-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}