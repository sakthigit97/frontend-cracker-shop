import BulkStepper from "../components/bulkOrder/BulkStepper";
import BulkWizard from "../components/bulkOrder/BulkWizard";
import { bulkOrderStore } from "../store/bulkOrder.store";

export default function BulkOrder() {
    const { step } = bulkOrderStore();

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold sm:text-3xl">
                    Bulk Order
                </h1>

                <p className="mt-2 text-sm text-gray-600 sm:text-base">
                    Create high-value bulk cracker orders using exclusive pricing schemes.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
                <BulkStepper currentStep={step} />
            </div>

            <div className="mt-8">
                <BulkWizard currentStep={step} />
            </div>
        </div>
    );
}