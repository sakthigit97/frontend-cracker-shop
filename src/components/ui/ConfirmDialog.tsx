import { useState } from "react";
import Button from "./Button";
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    message?: ReactNode;
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    async function handleConfirm() {
        if (loading) return;
        try {
            setLoading(true);
            await onConfirm();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                    {title}
                </h3>

                {description && (
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {description}
                    </p>
                )}

                {message && (
                    <div className="mt-3 text-sm text-[var(--color-muted)]">
                        {message}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        disabled={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? "Processing..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}