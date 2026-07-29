import { memo } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

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
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">

            <div className="flex items-center gap-3">

                <div className="rounded-full bg-amber-100 p-3">
                    <ShieldCheck
                        className="text-amber-600"
                        size={24}
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold">
                        Admin Approval Required
                    </h3>

                    <p className="text-sm text-gray-600">
                        This scheme requires a valid admin
                        authorization code before continuing.
                    </p>
                </div>

            </div>

            <div className="mt-6">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Admin Code
                </label>

                <div className="flex flex-col gap-3 md:flex-row">

                    <input
                        type="text"
                        value={code}
                        disabled={verified}
                        placeholder="Enter admin code"
                        onChange={(e) =>
                            onChange(e.target.value)
                        }
                        className={[
                            "h-12 flex-1 rounded-lg border px-4 outline-none transition",

                            verified
                                ? "border-green-500 bg-green-50"
                                : "border-gray-300 focus:border-primary",
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
                            "flex h-12 min-w-[150px] items-center justify-center rounded-lg px-6 font-semibold transition",

                            loading ||
                                verified
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

            {!verified && !error && (

                <div className="mt-4 rounded-lg bg-white p-4 text-sm text-gray-600">
                    Enter the admin code provided by the sales
                    team to unlock this bulk purchase scheme.
                </div>

            )}

            {error && (

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>

            )}

            {verified && (

                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">

                    <div className="flex items-center">

                        <CheckCircle2
                            size={20}
                            className="mr-2 text-green-600"
                        />

                        <span className="font-medium text-green-700">
                            Admin code verified successfully.
                        </span>

                    </div>

                </div>

            )}

        </div>
    );
}

export default memo(AdminCodeSection);