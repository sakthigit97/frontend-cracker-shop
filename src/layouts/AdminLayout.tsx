import { Outlet } from "react-router-dom"
import AdminHeader from "../components/layout/AdminHeader"

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <main className="min-h-screen bg-[var(--color-background)] p-6">
        <Outlet />
      </main>
    </div>
  )
}