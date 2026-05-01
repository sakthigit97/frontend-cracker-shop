import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { ORDER_STATUS_CONFIG, STATUS_ORDER } from "../utils/orderStatus";
import { cancelOrderApi, restoreOrderApi } from "../services/order.api";
import { useOrdersStore } from "../store/orders.store";
import { useState } from "react";
import { useAlert } from "../store/alert.store";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const TERMINAL_STATUS = "CANCELLED";
const CANCELLABLE_STATUSES = ["ORDER_PLACED", "ORDER_CONFIRMED"];

export default function OrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const clearOrdersCache = useOrdersStore((s) => s.clear);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { showAlert } = useAlert();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isTamilNadu = order.address?.toLowerCase().includes("tamil nadu");
  const deliveryText = isTamilNadu
    ? "3–5 working days"
    : "7–10 working days";

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4 px-4">
        <p className="text-sm text-[var(--color-muted)]">
          Order details not available.
        </p>
        <Button onClick={() => navigate("/orders")}>
          Back to My Orders
        </Button>
      </div>
    );
  }

  const STATUS_KEYS = Object.keys(ORDER_STATUS_CONFIG);
  const currentIndex = STATUS_KEYS.indexOf(order.status);
  const isCancelled = order.status === TERMINAL_STATUS;
  const isDispatched = order.status === "DISPATCHED";
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const invoiceAvailableFrom = "PAYMENT_CONFIRMED";

  const canDownloadInvoice =
    STATUS_ORDER.indexOf(order.status) >=
    STATUS_ORDER.indexOf(invoiceAvailableFrom) &&
    order.status !== "CANCELLED";

  async function handleRestore() {
    try {
      setRestoring(true);

      await restoreOrderApi(order.orderId);
      clearOrdersCache();
      showAlert({
        type: "success",
        message: "Order Reopened Successfully",
        duration: 1500,
      });

      navigate("/orders", { replace: true });
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Unable to reopen order",
      });
    } finally {
      setRestoring(false);
    }
  }

  async function handleDownloadInvoice() {
    if (downloading) return;
    try {

      setDownloading(true);
      const auth = localStorage.getItem("auth");
      const token = auth ? JSON.parse(auth).token : null;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/orders/${order.orderId}/invoice`;
      if (isMobile) {
        const url = `${apiUrl}?token=${encodeURIComponent(token || '')}`
        window.open(url, "_blank");
        return;
      }

      const res = await fetch(
        apiUrl,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Invoice download failed");
      }

      const blob = await res.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("Invalid invoice file received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Unable to download invoice",
      });
    } finally {
      setDownloading(false);
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  async function handleCancel() {
    try {
      setLoading(true);
      await cancelOrderApi(order.orderId);
      clearOrdersCache();
      showAlert({
        type: "success",
        message: "Order Cancelled",
        duration: 1500,
      });
      navigate("/orders", { replace: true });
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Unable to cancel order",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="
          flex items-center justify-center
          w-9 h-9
          rounded-full
          bg-[var(--color-primary)]
          text-white
          shadow-sm

          hover:scale-105
          active:scale-95
          transition-all
        "
          >
            ←
          </button>

          <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
            Order Details
          </h1>
        </div>

        <p className="text-sm text-[var(--color-muted)]">
          Order ID: {order.orderId}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          Placed on {formatDate(order.createdAt)}
        </p>
      </div>

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-red-600 mb-2">
            ❌ Order Cancelled
          </h3>
          <p className="text-sm text-red-500">
            This order has been cancelled and will not be processed further.
          </p>
        </div>
      )}

      {!isCancelled && (
        <div className="bg-[var(--color-surface)] border rounded-xl p-5">
          <h3 className="font-semibold text-[var(--color-primary)] mb-4">
            Order Tracking
          </h3>

          <div className="flex flex-col gap-4">
            {STATUS_KEYS.map((statusKey, index) => {
              const status = ORDER_STATUS_CONFIG[statusKey];

              let indicatorClass = "border-gray-300 text-gray-400";

              if (isDispatched) {
                indicatorClass =
                  "bg-green-500 border-green-500 text-white";
              } else if (index < currentIndex) {
                indicatorClass =
                  "bg-green-500 border-green-500 text-white";
              } else if (index === currentIndex) {
                indicatorClass =
                  "bg-yellow-400 border-yellow-400 text-black";
              }

              return (
                <div key={statusKey} className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${indicatorClass}`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${index <= currentIndex
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-muted)]"
                        }`}
                    >
                      {status.label}
                    </p>

                    {index === currentIndex && !isDispatched && (
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        Current status
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isDispatched && (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-800">
                🚚 Expected Delivery:
                <span className="font-semibold ml-1">
                  {deliveryText}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-[var(--color-surface)] border rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Status</span>
          <span
            className={`font-semibold ${isCancelled ? "text-red-600" : ""
              }`}
          >
            {ORDER_STATUS_CONFIG[order.status]?.label || "Cancelled"}
          </span>
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span>Payment</span>
          <span>{order.paymentMode}</span>
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium mb-1">
            Delivery Address
          </p>
          <p className="text-sm text-[var(--color-muted)] whitespace-pre-line">
            {order.address}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border rounded-xl p-4">
        <h3 className="font-semibold text-[var(--color-primary)] mb-3">
          Items
        </h3>

        {order.items.map((item: any) => (
          <div
            key={item.productId}
            className="flex justify-between items-start text-sm py-2"
          >
            <div>
              <div>
                {item.name} × {item.quantity}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <>
                    <span className="line-through text-gray-400 text-xs">
                      ₹{item.originalPrice}
                    </span>

                    <span className="text-green-600 font-semibold">
                      ₹{item.price}
                    </span>

                    {item.discountText && (
                      <span className="text-green-700 text-xs font-semibold bg-green-100 px-2 py-[2px] rounded">
                        {item.discountText}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-medium">₹{item.price}</span>
                )}
              </div>
            </div>

            <div className="font-medium">
              ₹{item.total}
            </div>
          </div>
        ))}

        <hr className="my-3" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>
              ₹
              {order.subtotal ??
                order.items.reduce((sum: number, i: any) => sum + i.total, 0)}
            </span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Packaging Charges</span>
            <span>₹{order.packagingCharge ?? 0}</span>
          </div>

          {(order.gstAmount ?? 0) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span>₹{order.gstAmount}</span>
            </div>
          )}
          <hr />

          <div className="flex justify-between font-semibold">
            <span>Total Amount</span>
            <span>₹{order.totalAmount}</span>
          </div>

          {order.walletUsed > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Wallet Used</span>
              <span>- ₹{order.walletUsed}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold text-[var(--color-primary)]">
            <span>Final Payable</span>
            <span>
              ₹
              {order.finalPayable ??
                order.totalAmount - (order.walletUsed || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isCancelled && (
          <Button
            disabled={restoring}
            onClick={handleRestore}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {restoring ? "Reopening..." : "Reopen Order"}
          </Button>
        )}

        {canDownloadInvoice && (
          <Button onClick={handleDownloadInvoice}>
            {downloading ? "Downloading...." : "Download Invoice"}
          </Button>
        )}

        {order.status === "ORDER_PLACED" && (
          <Button
            onClick={() =>
              navigate(`/orders/${order.orderId}/adjust`, {
                state: { order },
              })
            }
          >
            Adjust Order
          </Button>
        )}

        {canCancel && (
          <Button
            disabled={loading}
            onClick={() => setShowCancelConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel Order?"
        message={
          <>
            Are you sure you want to cancel this order?
            <br />
            <span className="text-red-500 font-medium">
              This action cannot be undone.
            </span>
          </>
        }
        confirmText="Yes, Cancel"
        cancelText="No"
        loading={loading}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={async () => { await handleCancel() }}
      />
    </div>
  );
}