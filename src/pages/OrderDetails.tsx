import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Package,
  Phone,
  ReceiptIndianRupee,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { formatCurrency } from "../utils/pricing";

import {
  ORDER_STATUS_CONFIG,
  STATUS_ORDER,
} from "../utils/orderStatus";

import {
  cancelOrderApi,
  restoreOrderApi,
} from "../services/order.api";

import { useOrdersStore } from "../store/orders.store";
import { useAlert } from "../store/alert.store";
import { useConfigStore } from "../store/config.store";

import { downloadInvoice } from "../utils/pdf/downloadInvoice";
import { formatDateTime } from "../utils/date";
import defaultImage from "../assets/default-image.png";
import { sortProductsBySequence } from "../utils/sequncerUtil";

const TERMINAL_STATUS = "CANCELLED";

const CANCELLABLE_STATUSES = [
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
];

export default function OrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const order = location.state?.order;

  const clearOrdersCache = useOrdersStore(
    (s) => s.clear
  );

  const config = useConfigStore(
    (s) => s.config
  );

  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] =
    useState(false);
  const [restoring, setRestoring] =
    useState(false);
  const [showCancelConfirm, setShowCancelConfirm] =
    useState(false);

  const packagingPercent =
    config?.packagingPercent ?? 0;

  const gstPercent =
    config?.gstPercent ?? 0;

  const disableGstForTN =
    config?.disableGstForTN || false;

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Package
              size={26}
              className="text-gray-500"
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Order details not available
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            We couldn't find the requested order.
          </p>

          <div className="mt-5">
            <Button
              onClick={() =>
                navigate("/orders")
              }
            >
              Back to My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const STATUS_KEYS =
    Object.keys(ORDER_STATUS_CONFIG);

  const currentIndex =
    STATUS_KEYS.indexOf(order.status);

  const isCancelled =
    order.status === TERMINAL_STATUS;

  const isDispatched =
    order.status === "DISPATCHED";

  const canCancel =
    CANCELLABLE_STATUSES.includes(
      order.status
    );

  const invoiceAvailableFrom =
    "PAYMENT_CONFIRMED";

  const canDownloadInvoice =
    STATUS_ORDER.indexOf(order.status) >=
    STATUS_ORDER.indexOf(
      invoiceAvailableFrom
    ) &&
    order.status !== TERMINAL_STATUS;

  const trackingStatuses = STATUS_KEYS.filter(
    (status) => status !== "CANCELLED"
  );

  const isTamilNadu =
    order.address
      ?.toLowerCase()
      .includes("tamil nadu");

  const deliveryText = isTamilNadu
    ? "3–5 working days"
    : "7–10 working days";

  const totalQuantity =
    order.items?.reduce(
      (total: number, item: any) =>
        total + item.quantity,
      0
    ) ?? 0;

  const sortedItems = useMemo(
    () => sortProductsBySequence(order.items),
    [order.items]
  );

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

      navigate("/orders", {
        replace: true,
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message:
          err.message ||
          "Unable to reopen order",
      });
    } finally {
      setRestoring(false);
    }
  }

  const parsedAddress = (() => {
    const fallbackName =
      order.fullName ||
      order.customerName ||
      "-";

    const fallbackMobile =
      order.mobile ||
      order.phone ||
      "-";

    const rawAddress = order.address;

    if (
      rawAddress &&
      typeof rawAddress === "object"
    ) {
      const address = rawAddress as {
        fullName?: string;
        mobile?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
      };

      const addressParts = [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.pincode,
      ].filter(Boolean);

      return {
        name:
          address.fullName ||
          fallbackName,

        mobile:
          address.mobile ||
          fallbackMobile,

        address:
          addressParts.join(", ") || "-",
      };
    }

    if (typeof rawAddress === "string") {
      const lines = rawAddress
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean);

      if (lines.length > 0) {
        const firstLine = lines[0] ?? "";
        const secondLine = lines[1] ?? "";

        const isPhoneNumber = (value: string) =>
          /^\d{10}$/.test(
            value.replace(/\D/g, "")
          );

        const parsedName =
          fallbackName !== "-"
            ? fallbackName
            : !isPhoneNumber(firstLine)
              ? firstLine
              : "-";

        const parsedMobile =
          fallbackMobile !== "-"
            ? fallbackMobile
            : isPhoneNumber(secondLine)
              ? secondLine
              : "-";

        const addressStartIndex =
          parsedName === firstLine &&
            parsedMobile === secondLine
            ? 2
            : isPhoneNumber(firstLine)
              ? 1
              : 2;

        const addressLines =
          lines.slice(addressStartIndex);

        return {
          name: parsedName,
          mobile: parsedMobile,
          address:
            addressLines.join(", ") || "-",
        };
      }
    }

    return {
      name: fallbackName,
      mobile: fallbackMobile,
      address: "-",
    };
  })();

  async function handleDownloadInvoice() {
    if (downloading) return;

    try {
      setDownloading(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      await downloadInvoice({
        order,
        config,
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message:
          err.message ||
          "Unable to download invoice",
      });
    } finally {
      setDownloading(false);
    }
  }

  async function handleCancel() {
    try {
      setLoading(true);

      await cancelOrderApi(
        order.orderId
      );

      clearOrdersCache();

      showAlert({
        type: "success",
        message: "Order Cancelled",
        duration: 1500,
      });

      navigate("/orders", {
        replace: true,
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message:
          err.message ||
          "Unable to cancel order",
      });
    } finally {
      setLoading(false);
      setShowCancelConfirm(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-5">
        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full
              bg-[var(--color-primary)]
              text-white
              shadow-sm
              transition
              hover:scale-105
              active:scale-95
            "
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--color-primary)] sm:text-2xl">
              Order Details
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)] sm:text-sm">

              <span className="font-medium text-gray-700">
                {order.orderId}
              </span>

              <span className="hidden sm:inline">
                •
              </span>

              <span>
                {formatDateTime(
                  order.createdAt
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CANCELLED NOTICE
      ====================================================== */}

      {isCancelled && (
        <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">

            <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1.5 text-red-600">
              <Package size={16} />
            </div>

            <div>
              <p className="font-semibold text-red-700">
                Order Cancelled
              </p>

              <p className="mt-0.5 text-sm text-red-600">
                This order has been cancelled
                and will not be processed further.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* =====================================================
          ORDER TRACKING
      ====================================================== */}

      {!isCancelled && (
        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Order Tracking
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Current order progress
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            {trackingStatuses.map(
              (statusKey, index) => {
                const status =
                  ORDER_STATUS_CONFIG[
                  statusKey
                  ];

                let indicatorClass =
                  "border-gray-200 bg-white text-gray-400";

                let cardClass =
                  "border-gray-200 bg-gray-50";

                let helperText = "";

                if (
                  index <= currentIndex
                ) {
                  indicatorClass =
                    "border-green-500 bg-green-500 text-white";

                  cardClass =
                    "border-green-100 bg-green-50";
                } else if (
                  index ===
                  currentIndex + 1
                ) {
                  indicatorClass =
                    "border-yellow-400 bg-yellow-400 text-gray-900";

                  cardClass =
                    "border-yellow-100 bg-yellow-50";

                  helperText = "Pending";
                }

                return (
                  <div
                    key={statusKey}
                    className={`
                      rounded-xl
                      border
                      p-3
                      ${cardClass}
                    `}
                  >
                    <div className="flex items-center gap-3">

                      <div
                        className={`
                          flex h-8 w-8 shrink-0
                          items-center justify-center
                          rounded-full
                          border
                          text-xs font-semibold
                          ${indicatorClass}
                        `}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`
                            text-sm font-medium
                            ${index <= currentIndex
                              ? "text-gray-900"
                              : "text-gray-500"
                            }
                          `}
                        >
                          {status.label}
                        </p>

                        {helperText && (
                          <p className="mt-0.5 text-[11px] font-semibold text-amber-600">
                            {helperText}
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                );
              }
            )}

          </div>

          {!isDispatched && (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="text-sm text-yellow-800">
                Expected Delivery:
                <span className="ml-1 font-semibold">
                  {deliveryText}
                </span>
              </p>
            </div>
          )}

        </section>
      )}

      {/* =====================================================
          CUSTOMER / ORDER / ADDRESS
      ====================================================== */}

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="grid gap-5 md:grid-cols-3">


          <div>
            <SectionTitle
              icon={<User size={17} />}
              title="Customer Details"
            />

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">

              <InfoItem
                icon={<User size={15} />}
                label="Customer"
                value={parsedAddress.name}
              />

              <InfoItem
                icon={<Phone size={15} />}
                label="Mobile"
                value={parsedAddress.mobile}
              />

            </div>
          </div>

          {/* Order */}

          <div>
            <SectionTitle
              icon={<ReceiptIndianRupee size={17} />}
              title="Order Information"
            />

            <div className="grid gap-3">

              <InfoItem
                label="Payment"
                value={
                  order.paymentMode || "-"
                }
              />

              <InfoItem
                label="Status"
                value={
                  ORDER_STATUS_CONFIG[
                    order.status
                  ]?.label ||
                  order.status
                }
              />

            </div>
          </div>

          {/* Address */}

          <div>
            <SectionTitle
              icon={<MapPin size={17} />}
              title="Delivery Address"
            />

            <div className="grid gap-3">
              <InfoItem
                label="Address"
                value={parsedAddress.address}
              />

            </div>
          </div>

        </div>
      </section>

      {order.statusHistory?.length > 0 && (
        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

          <SectionTitle
            icon={<FileText size={17} />}
            title="Order History"
          />

          <div className="mt-4 max-h-[360px] overflow-y-auto pr-1">

            <div className="space-y-4">

              {[...(order.statusHistory || [])]
                .sort(
                  (a: any, b: any) =>
                    (b.changedAt ?? b.at) -
                    (a.changedAt ?? a.at)
                )
                .map(
                  (
                    history: any,
                    index: number
                  ) => {

                    const status =
                      history.toStatus ??
                      history.status;

                    const updatedBy =
                      history.changedBy ??
                      history.by;

                    const updatedAt =
                      history.changedAt ??
                      history.at;

                    return (
                      <div
                        key={index}
                        className="relative border-l-2 border-gray-200 pl-4"
                      >
                        <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--color-primary)]" />

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <p className="font-medium text-gray-900">
                            {ORDER_STATUS_CONFIG[
                              status
                            ]?.label ??
                              status.replaceAll(
                                "_",
                                " "
                              )}
                          </p>

                          <span className="text-xs text-gray-500">
                            {formatDateTime(
                              updatedAt
                            )}
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          Changed By:{" "}
                          {updatedBy?.startsWith(
                            "ADMIN"
                          )
                            ? "Admin"
                            : updatedBy?.replace(
                              "USER#",
                              ""
                            )}
                        </p>

                        {history.comment && (
                          <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                            {history.comment}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

            </div>

          </div>
        </section>
      )}

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">

          <div>
            <SectionTitle icon={<Package size={18} />}
              title="Products"
            />

            <p className="mt-1 text-xs text-gray-500">
              {sortedItems.length}{" "}
              {sortedItems.length === 1
                ? "Product"
                : "Products"}{" "}
              • {totalQuantity} Qty
            </p>
          </div>

        </div>

        <div className="w-full overflow-hidden rounded-xl border border-gray-200">

          <div className="max-h-[420px] overflow-y-auto overflow-x-auto">

            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">

                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Product
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Unit
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Price
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Amount
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {sortedItems.map(
                  (item: any) => {

                    const packQuantity =
                      Number(
                        item.packQuantity ?? 0
                      );

                    const packUnit =
                      item.packUnit?.trim();

                    const hasPack =
                      packQuantity > 0 &&
                      Boolean(packUnit);

                    return (
                      <tr key={item.productId} className="align-middle">

                        {/* Product */}
                        <td className="px-4 py-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <img src={item.image?.trim() || defaultImage} alt={item.name} onError={(event) => {
                              event.currentTarget.onerror =
                                null;

                              event.currentTarget.src =
                                defaultImage;
                            }}
                              className="
                            h-12
                            w-12
                            shrink-0
                            rounded-lg
                            border
                            object-cover
                            "
                            />

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold text-gray-900">
                                  {item.name}
                                </p>

                                {item.isComboPackage && (
                                  <span
                                    className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                    Combo
                                  </span>
                                )}

                              </div>

                              {(item.discountText ||
                                !item.isComboPackage) && (
                                  <p className="mt-0.5 text-xs text-green-600">
                                    {item.discountText ||
                                      "NET RATE"}
                                  </p>
                                )}

                            </div>

                          </div>

                        </td>

                        {/* Pack */}
                        <td className="px-4 py-3 text-center">

                          {hasPack ? (
                            <span
                              className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              {packQuantity}{"/"}
                              {packUnit}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              -
                            </span>
                          )}

                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-3 text-center">

                          <span className="font-medium text-gray-800">
                            {item.quantity}
                          </span>

                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">

                          <span className="font-medium text-gray-700">
                            ₹{formatCurrency(item.price)}
                          </span>

                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">

                          <span className="font-semibold text-gray-900">
                            ₹{formatCurrency(item.total)}
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        </div>
        {/* Mobile hint */}
        <p className="mt-2 text-[11px] text-gray-400 sm:hidden">
          Swipe horizontally to view all columns.
        </p>

        {/* Pricing */}
        <div className="mt-4 border-t border-gray-200 pt-4">

          <div className="mb-3 flex items-center gap-2">

            <ReceiptIndianRupee size={17} className="text-primary" />

            <div>
              <h3 className="font-semibold text-gray-900">
                Pricing Summary
              </h3>

              <p className="text-xs text-gray-500">
                Final order calculation
              </p>
            </div>

          </div>

          <div className="space-y-2.5 text-sm">

            <PriceRow label="Products Total" value={order.totalProductAmount ?? 0} />

            {(order.comboPackageTotal ?? 0) >
              0 && (
                <PriceRow label="Combo Packages" value={order.comboPackageTotal}
                  helper="Inclusive Of Packaging Charges" />
              )}

            {(order.nonComboProductTotal ??
              0) > 0 && (
                <PriceRow label="Non Combo Products" value={order.nonComboProductTotal} />
              )}

            {(order.packagingCharge ?? 0) >
              0 && (
                <PriceRow label={`Packaging Charge (${packagingPercent}%)`} value={order.packagingCharge} />
              )}

            {(order.couponDiscount ?? 0) >
              0 && (
                <>
                  <PriceRow label="Amount Before Discount" value={order.amountBeforeDiscount} />

                  <div className="flex justify-between gap-4 text-green-600">
                    <span>
                      Coupon Savings{" "}
                      {order.couponType ===
                        "PERCENTAGE"
                        ? `(${order.couponValue}%)`
                        : `(Flat ₹${order.couponValue})`}
                    </span>

                    <span className="shrink-0 font-medium">
                      -₹{order.couponDiscount}
                    </span>
                  </div>

                  <PriceRow label="Amount After Discount" value={order.amountAfterDiscount} />
                </>
              )}

            {(order.gstAmount ?? 0) >
              0 && (
                <PriceRow label={`GST (${gstPercent}%)`} value={order.gstAmount} />
              )}

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="flex items-end justify-between gap-4">

              <div>
                <p className="font-semibold text-gray-900">
                  Grand Total
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {disableGstForTN &&
                    isTamilNadu
                    ? "Inclusive of Packaging Charges"
                    : "Inclusive of GST & Packaging Charges"}
                </p>
              </div>

              <span className="whitespace-nowrap text-xl font-bold text-[var(--color-primary)]">
                ₹{formatCurrency(order.grandTotal)}
              </span>

            </div>

            {(order.walletUsed ?? 0) >
              0 && (
                <>
                  <div className="my-3 border-t border-dashed border-gray-300" />

                  <PriceRow label="Wallet Applied" value={-order.walletUsed} valueClassName="text-green-700" />

                  <div className="flex items-end justify-between gap-4">

                    <div>
                      <p className="font-semibold text-gray-900">
                        Amount Payable
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Amount to be paid
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-xl font-bold text-[var(--color-primary)]">
                      ₹{formatCurrency(order.finalPayable)}
                    </span>

                  </div>
                </>
              )}

          </div>


        </div>

      </section>


      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">

        {isCancelled && (
          <Button
            disabled={restoring}
            onClick={handleRestore}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {restoring
              ? "Reopening..."
              : "Reopen Order"}
          </Button>
        )}

        {canDownloadInvoice && (
          <Button
            data-enter-submit="true"
            onClick={
              handleDownloadInvoice
            }
          >
            {downloading
              ? "Downloading..."
              : "Download Invoice"}
          </Button>
        )}

        {order.status ===
          "ORDER_PLACED" && (
            <Button
              onClick={() =>
                navigate(
                  `/orders/${order.orderId}/adjust`,
                  {
                    state: { order },
                  }
                )
              }
            >
              Adjust Order
            </Button>
          )}

        {canCancel && (
          <Button
            disabled={loading}
            onClick={() =>
              setShowCancelConfirm(true)
            }
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {loading
              ? "Cancelling..."
              : "Cancel Order"}
          </Button>
        )}

      </div>

      {/* =====================================================
          CANCEL CONFIRMATION
      ====================================================== */}

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel Order?"
        message={
          <>
            Are you sure you want to
            cancel this order?
            <br />

            <span className="font-medium text-red-500">
              This action cannot be undone.
            </span>
          </>
        }
        confirmText="Yes, Cancel"
        cancelText="No"
        loading={loading}
        onCancel={() =>
          setShowCancelConfirm(false)
        }
        onConfirm={handleCancel}
      />

    </div>
  );
}

/* ============================================================
   SHARED UI HELPERS
============================================================ */

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
}

function SectionTitle({
  icon,
  title,
}: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">

      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        {icon}
      </div>

      <h2 className="font-semibold text-gray-900">
        {title}
      </h2>

    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoItem({
  label,
  value,
  icon,
}: InfoItemProps) {
  return (
    <div className="min-w-0">

      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </p>

      <p className="mt-0.5 break-words text-sm text-gray-900">
        {value}
      </p>

    </div>
  );
}

interface PriceRowProps {
  label: string;
  value: number;
  helper?: string;
  valueClassName?: string;
}
function PriceRow({
  label,
  value,
  helper,
  valueClassName = "text-gray-900",
}: PriceRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-gray-600">{label}</span>

        {helper && (
          <span className="ml-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            {helper}
          </span>
        )}
      </div>

      <span
        className={`shrink-0 font-medium ${valueClassName}`}
      >
        {value < 0 ? "-" : "₹"}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}