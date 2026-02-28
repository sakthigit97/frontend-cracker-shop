import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-gray-200 p-4">
      {children}
    </div>
  );
}
