import { memo } from "react";
import {
    CheckCircle2,
    Loader2,
    ShieldCheck,
} from "lucide-react";

interface AdminCodeSectionProps {
    code: string;
    verified: boolean;
    loading: boolean;
    error?: string;
    onChange: (value: string) => void;
    onValidate: () => void;
}

function AdminCodeSection({
    code,
    verified,
    loading,
    error,
    onChange,
    onValidate,
}: AdminCodeSectionProps) {
    return (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6">

            {/* Header */}
            <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <ShieldCheck
                        size={24}
                        className="text-amber-600"
                    />
                </div>

                <div className="min-w-0 flex-1">

                    <h3 className="text-lg font-semibold leading-6 text-gray-900 sm:text-xl">
                        Admin Approval Required
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-gray-600 sm:text-base sm:leading-6">
                        This scheme requires a valid admin
                        authorization code before continuing.
                    </p>

                </div>

            </div>

            {/* Admin Code */}
            <div className="mt-6">

                <label
                    htmlFor="bulk-admin-code"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                >
                    Admin Code
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">

                    <input
                        id="bulk-admin-code"
                        type="text"
                        value={code}
                        disabled={verified}
                        placeholder="Enter admin code"
                        autoComplete="off"
                        onChange={(e) =>
                            onChange(e.target.value)
                        }
                        className={[
                            "min-w-0 w-full rounded-xl border",
                            "px-4 py-3",
                            "text-base font-semibold",
                            "tracking-[0.08em]",
                            "text-gray-900",
                            "outline-none transition",
                            "placeholder:font-normal",
                            "placeholder:tracking-normal",
                            "placeholder:text-gray-400",

                            verified
                                ? "border-green-500 bg-green-50/60"
                                : error
                                    ? "border-red-400 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                    : "border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10",
                        ].join(" ")}
                    />

                    <button
                        type="button"
                        disabled={
                            loading ||
                            verified ||
                            !code.trim()
                        }
                        onClick={onValidate}
                        className={[
                            "flex min-h-[48px] w-full items-center justify-center",
                            "rounded-xl px-5",
                            "text-base font-semibold",
                            "transition",

                            loading ||
                                verified ||
                                !code.trim()
                                ? "cursor-not-allowed bg-gray-300 text-gray-600"
                                : "bg-primary text-white hover:opacity-90",
                        ].join(" ")}
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="mr-2 animate-spin"
                                />
                                Validating...
                            </>
                        ) : verified ? (
                            <>
                                <CheckCircle2
                                    size={18}
                                    className="mr-2"
                                />
                                Verified
                            </>
                        ) : (
                            "Validate"
                        )}
                    </button>

                </div>

            </div>

            {/* Helper Text */}
            {!verified && !error && (
                <div className="mt-4 flex items-start gap-2 text-sm leading-5 text-gray-600">

                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />

                    <p>
                        Enter the admin code provided by the sales
                        team to unlock this bulk purchase scheme.
                    </p>

                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-600">
                    {error}
                </div>
            )}

            {/* Success */}
            {verified && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                    <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0 text-green-600"
                    />

                    <div>
                        <p className="font-semibold text-green-700">
                            Admin code verified
                        </p>

                        <p className="mt-0.5 text-sm text-green-600">
                            You can continue with this bulk purchase scheme.
                        </p>
                    </div>

                </div>
            )}

        </div>
    );
}

export default memo(AdminCodeSection);