import type { BulkScheme } from "../types/bulkOrder";

export const BULK_SCHEMES: BulkScheme[] = [
    {
        id: "SCHEME1",
        name: "Standard Bulk Purchase",
        description: "For customers placing orders between ₹50,000 and ₹1,00,000.",
        minAmount: 50000,
        maxAmount: 100000,
        requireAdminCode: false,
    },
    {
        id: "SCHEME2",
        name: "Authorized Dealer Purchase",
        description: "For authorized dealers placing orders between ₹1,00,001 and ₹2,00,000.",
        minAmount: 100001,
        maxAmount: 200000,
        requireAdminCode: false,
    },
    {
        id: "SCHEME3",
        name: "Distributor Purchase",
        description: "For distributors placing orders between ₹2,00,001 and ₹5,00,000.",
        minAmount: 200001,
        maxAmount: 500000,
        requireAdminCode: true,
    },
    {
        id: "SCHEME4",
        name: "Enterprise Bulk Purchase",
        description: "For high-value orders above ₹5,00,000. Requires approval before processing.",
        minAmount: 500001,
        maxAmount: Infinity,
        requireAdminCode: true,
    },
];