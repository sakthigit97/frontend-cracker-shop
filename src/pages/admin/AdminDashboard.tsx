import { useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAdminDashboardStore } from "../../store/admin.store";
import {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../../utils/orderStatus";
import Button from "../../components/ui/Button";
import ProductSkeleton from "../../components/product/ProductSkeleton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, fetch } = useAdminDashboardStore();

  useEffect(() => {
    fetch();
  }, []);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { stats, statusBreakdown, recentOrders } = data;

  const pieData = STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    value: statusBreakdown[status],
    color: STATUS_COLORS[status],
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today Orders" value={stats.todayTotal} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Confirmed" value={stats.confirmed} />
        <StatCard label="Dispatched" value={stats.dispatched} />
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Order Status Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[260px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                className="flex justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[status],
                    }}
                  />
                  <span>{STATUS_LABELS[status]}</span>
                </div>
                <span className="font-semibold">
                  {statusBreakdown[status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Latest Orders</h2>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/orders")}
          >
            View all
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">
            No recent orders
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div
                key={o.orderId}
                className="
            flex
            items-center
            justify-between
            gap-3
            rounded-lg
            border
            px-3
            py-2
            hover:bg-gray-50
            transition
          "
              >
                {/* LEFT */}
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {o.orderId}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₹{o.totalAmount}
                  </p>
                </div>

                {/* RIGHT */}
                <span
                  className={`
              text-xs
              font-semibold
              px-2.5
              py-1
              rounded-full
              whitespace-nowrap
              ${o.status === "ORDER_PLACED" && "bg-yellow-100 text-yellow-800"}
              ${o.status === "ORDER_CONFIRMED" && "bg-blue-100 text-blue-800"}
              ${o.status === "PAYMENT_CONFIRMED" && "bg-green-100 text-green-800"}
              ${o.status === "ORDER_PACKED" && "bg-purple-100 text-purple-800"}
              ${o.status === "DISPATCHED" && "bg-emerald-100 text-emerald-800"}
              ${o.status === "CANCELLED" && "bg-red-100 text-red-800"}
            `}
                >
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-primary)]">
        {value}
      </p>
    </div>
  );
}
