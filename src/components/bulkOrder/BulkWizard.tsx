import { memo } from "react";
import { BULK_ORDER_STEPS } from "../../constants/bulkOrderSteps";
import SchemeStep from "./SchemeStep";
import ProductStep from "./ProductStep";
import CheckoutStep from "./CheckoutStep";
import ReviewStep from "./ReviewStep";

interface BulkWizardProps {
    currentStep: number;
}

function BulkWizard({
    currentStep,
}: BulkWizardProps) {

    switch (currentStep) {

        case BULK_ORDER_STEPS.SCHEME:
            return <SchemeStep />;

        case BULK_ORDER_STEPS.PRODUCTS:
            return <ProductStep />;

        case BULK_ORDER_STEPS.CHECKOUT:
            return <CheckoutStep />;

        case BULK_ORDER_STEPS.REVIEW:
            return <ReviewStep />;

        default:
            return <SchemeStep />;

    }

}

export default memo(BulkWizard);