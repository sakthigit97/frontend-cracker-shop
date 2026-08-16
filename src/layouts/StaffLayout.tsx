import { Outlet } from "react-router-dom";
import StaffHeader from "../components/layout/StaffHeader";

export default function StaffLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <StaffHeader />

      <main className="min-h-screen bg-[var(--color-background)] p-6">
        <Outlet />
      </main>
    </div>
  );
}