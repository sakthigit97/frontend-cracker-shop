export interface ChitInstallment {
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: "pending" | "partial" | "paid";
    paymentHistory: {
        amount: number;
        receivedAt: string;
        receivedBy: string;
        note?: string;
    }[];
}

export interface ChitScheme {
    chitId: string;
    name: string;
    description?: string;
    packageAmount: number;
    discountType: "flat" | "percentage";
    discountValue: number;
    payableAmount: number;
    monthlyAmount: number;
    joinDeadline: string;
    startDate: string;
    endDate: string;
    reminderDate: string;
    createdAt: string;
}

export interface ChitMember {
    chitId: string;
    userId: string;
    name: string;
    phone: string;
    email?: string;
    joinedAt: string;
    payableAmount: number;
    totalPaid: number;
    installments: ChitInstallment[];
}

export interface MyChit {
    member: ChitMember;
    scheme: ChitScheme | null;
}
