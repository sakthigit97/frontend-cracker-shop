export const BULK_ORDER_STEPS = {
    SCHEME: 0,
    PRODUCTS: 1,
    CHECKOUT: 2,
    REVIEW: 3,
} as const;

export const BULK_ORDER_STEP_LIST = [
    {
        id: BULK_ORDER_STEPS.SCHEME,
        title: "Scheme",
    },
    {
        id: BULK_ORDER_STEPS.PRODUCTS,
        title: "Products",
    },
    {
        id: BULK_ORDER_STEPS.CHECKOUT,
        title: "Checkout",
    },
    {
        id: BULK_ORDER_STEPS.REVIEW,
        title: "Review",
    },
];