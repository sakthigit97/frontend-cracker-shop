import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
      <div className="w-full max-w-md bg-[var(--color-surface)] p-6 rounded-xl shadow-sm">
        <Outlet />
      </div>
    </main>
  )
}