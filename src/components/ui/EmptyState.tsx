import Button from "./Button";

interface EmptyStateProps {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="mb-6 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7h18M3 12h18M3 17h18"
                    />
                </svg>
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
                {title}
            </h2>

            {description && (
                <p className="mt-2 text-sm text-gray-500 max-w-md">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <div className="mt-6">
                    <Button onClick={onAction}>
                        {actionLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}