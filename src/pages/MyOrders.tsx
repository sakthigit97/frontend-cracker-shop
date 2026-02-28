import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Button from "../components/ui/Button";
import { ORDER_STATUS_CONFIG } from "../utils/orderStatus";
import { useOrdersStore } from "../store/orders.store";

export default function MyOrders() {
  const navigate = useNavigate();
  const {
    orders,
    loading,
    nextCursor,
    fetchInitial,
    fetchMore,
  } = useOrdersStore();

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  if (loading && orders.length === 0) {
    return (

      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <table key={i} >
            <tbody>
              <tr className="border-t animate-pulse">
                <td className="p-3">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </td>

                <td className="p-3">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </td>

                <td className="p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="text-6xl mb-4">📦</div>

        <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
          No orders yet
        </h2>

        <p className="text-sm text-[var(--color-muted)] max-w-md mb-6">
          You haven’t placed any orders yet.
        </p>

        <Button onClick={() => navigate("/products")}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        My Orders
      </h1>

      <div className="flex flex-col gap-5">
        {orders.map((order) => {
          const statusConfig =
            ORDER_STATUS_CONFIG[order.status] || {
              label: order.status.replaceAll("_", " "),
              className: "bg-gray-100 text-gray-700",
            };

          return (
            <div
              key={order.orderId}
              className="
                bg-[var(--color-surface)]
                border
                rounded-2xl
                p-5
                shadow-sm
                hover:shadow-md
                transition
              "
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--color-muted)]">
                    Order ID
                  </p>
                  <p className="font-semibold">{order.orderId}</p>

                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <span
                    className={`
                      text-xs
                      font-semibold
                      px-4
                      py-1.5
                      rounded-full
                      ${statusConfig.className}
                    `}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <p className="text-lg font-bold text-[var(--color-primary)]">
                    ₹{order.totalAmount}
                  </p>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/orders/${order.orderId}`, {
                        state: { order },
                      })
                    }
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {nextCursor && (
        <div className="flex justify-center py-8">
          <button
            onClick={fetchMore}
            disabled={loading}
            className="
              px-6
              py-2
              rounded-lg
              bg-[var(--color-primary)]
              text-white
              text-sm
              disabled:opacity-60
            "
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}