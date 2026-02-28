export const ORDER_STATUS_CONFIG: any = {
    ORDER_PLACED: {
        label: "Order Placed",
        className: "bg-blue-100 text-blue-700",
    },
    ORDER_CONFIRMED: {
        label: "Order Confirmed",
        className: "bg-indigo-100 text-indigo-700",
    },
    PAYMENT_CONFIRMED: {
        label: "Payment Confirmed",
        className: "bg-purple-100 text-purple-700",
    },
    ORDER_PACKED: {
        label: "Order Packed",
        className: "bg-orange-100 text-orange-700",
    },
    DISPATCHED: {
        label: "Dispatched",
        className: "bg-green-100 text-green-700",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-100 text-red-700",
    },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;


export const STATUS_ORDER = [
    "ORDER_PLACED",
    "ORDER_CONFIRMED",
    "PAYMENT_CONFIRMED",
    "ORDER_PACKED",
    "DISPATCHED",
    "CANCELLED",
];

export const STATUS_LABELS: Record<string, string> = {
    ORDER_PLACED: "Placed",
    ORDER_CONFIRMED: "Confirmed",
    PAYMENT_CONFIRMED: "Paid",
    ORDER_PACKED: "Packed",
    DISPATCHED: "Dispatched",
    CANCELLED: "Cancelled",
};

export const STATUS_COLORS: Record<string, string> = {
    ORDER_PLACED: "#facc15",       // yellow
    ORDER_CONFIRMED: "#3b82f6",    // blue
    PAYMENT_CONFIRMED: "#22c55e",  // green
    ORDER_PACKED: "#8b5cf6",       // purple
    DISPATCHED: "#10b981",         // emerald
    CANCELLED: "#ef4444",          // red
};