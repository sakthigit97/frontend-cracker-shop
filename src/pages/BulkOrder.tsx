import BulkStepper from "../components/bulkOrder/BulkStepper";
import BulkWizard from "../components/bulkOrder/BulkWizard";
import { bulkOrderStore } from "../store/bulkOrder.store";

export default function BulkOrder() {
    const { step } = bulkOrderStore();

    return (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-6 lg:px-8">
            <div className="mb-5 sm:mb-6">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Bulk Order
                </h1>

                <p className="mt-1.5 text-sm text-gray-600 sm:text-base">
                    Create high-value bulk cracker orders using exclusive
                    pricing schemes.
                </p>
            </div>

            {/* Complete wizard */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                
                {/* Progress */}
                <div className="border-b border-gray-200 px-3 py-3 sm:px-5 sm:py-4">
                    <BulkStepper currentStep={step} />
                </div>

                {/* Current step */}
                <BulkWizard currentStep={step} />
            </div>
        </div>
    );
}