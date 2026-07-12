import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--color-background)] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">


        <button
          onClick={() => navigate(-1)}
          className="
          flex items-center justify-center
          w-9 h-9
          rounded-full
          bg-[var(--color-primary)]
          text-white
          shadow-sm

          hover:scale-105
          active:scale-95
          transition-all
        "
        >
          ←
        </button>

        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
          Privacy Policy
        </h1>


        <section className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
              Terms & Conditions
            </h1>

            <p className="mt-3">
              Welcome to <strong>SIVAKASI PYRO PARK</strong>. Your access and use of
              our Website/App are subject to these Terms and Conditions. By accessing
              or using our platform, you acknowledge that you have read, understood,
              and agreed to be bound by these terms. If you do not agree, you must
              immediately cease using our platform.
            </p>
          </div>

          {/* 1 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              1. Legal Compliance & Supreme Court Advisory
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Enquiry-Based System:</strong> In compliance with the
                directives of the Honourable Supreme Court of India regarding the
                online sale of firecrackers, this platform operates strictly as an
                electronic catalogue and enquiry system.
              </li>

              <li>
                <strong>Order Confirmation:</strong> Items added to your cart and
                submitted through this platform are treated as enquiries and not as
                confirmed sales. Our customer care team will contact you within 24
                hours via phone or WhatsApp to verify the order, confirm availability,
                and provide final billing and dispatch details.
              </li>

              <li>
                <strong>Prohibited Zones:</strong> We do not accept enquiries or
                arrange dispatches to cities or states where the possession,
                transportation, or use of firecrackers is prohibited by law.
              </li>
            </ul>
          </div>

          {/* 2 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              2. Eligibility & Age Restrictions
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Minimum Age:</strong> Purchase of crackers is strictly
                restricted to individuals aged 18 years and above.
              </li>

              <li>
                <strong>Minor Supervision:</strong> Minors may browse the Website/App
                only under the supervision of a parent or legal guardian. By placing
                an enquiry, you confirm that you satisfy all applicable legal
                requirements.
              </li>
            </ul>
          </div>

          {/* 3 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              3. Minimum Order Value & Pricing
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Minimum Order Value:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Within Tamil Nadu – ₹3,000/-</li>
                  <li>Other States – ₹5,000/-</li>
                  <li>Northern States – ₹10,000/-</li>
                </ul>
              </li>

              <li>
                <strong>Taxes & Charges:</strong> Displayed prices are exclusive of
                statutory taxes. Additional 18% GST and applicable packaging charges
                will be added to the final invoice.
              </li>

              <li>
                <strong>Market Pricing:</strong> Prices are subject to change without
                prior notice based on market conditions and raw material availability.
              </li>

              <li>
                <strong>Promotions:</strong> Cashback offers, discounts, referral
                codes, and promotional campaigns are subject to their respective terms
                and may be modified or withdrawn without prior notice.
              </li>
            </ul>
          </div>

          {/* 4 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              4. Payment, Cancellation & Refunds
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Full Advance Payment:</strong> Orders are processed only after
                100% payment has been received through approved payment methods.
              </li>

              <li>
                <strong>Cancellation:</strong> Once payment is completed and the order
                enters processing or packing, cancellation is not permitted. Where a
                cancellation is approved before processing under exceptional
                circumstances, a 15% cancellation/restocking charge will apply and the
                remaining 85% will be refunded.
              </li>

              <li>
                <strong>Refunds:</strong> Approved refunds will be processed to the
                original payment method within 15 business days.
              </li>
            </ul>
          </div>

          {/* 5 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              5. Shipping, Transportation & Delivery Disclaimer
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>No Home Delivery:</strong> Doorstep delivery is unavailable due
                to safety regulations governing the transportation of explosive
                materials.
              </li>

              <li>
                <strong>Transport Office Pickup:</strong> Customers must collect their
                parcels from the designated transport office or godown nearest to their
                communication address.
              </li>

              <li>
                <strong>Freight Charges:</strong> Unless specifically included in a
                promotional package, transport charges must be paid directly to the
                transport agency during parcel collection.
              </li>

              <li>
                <strong>Transit Damage:</strong> While products are packed securely,
                SIVAKASI PYRO PARK is not responsible for delays, handling issues, or
                damages caused by third-party transport providers.
              </li>

              <li>
                <strong>Product Substitution:</strong> If any ordered item becomes
                unavailable due to seasonal demand, we may substitute it with a similar
                or higher-value product after attempting to contact the customer.
              </li>

              <li>
                <strong>Mandatory Unboxing Video:</strong> Claims regarding missing
                items or quantity shortages will be considered only if supported by a
                continuous, unedited unboxing video recorded from the moment the parcel
                seal is opened.
              </li>
            </ul>
          </div>

          {/* 6 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              6. User Accounts, Privacy & Identity Verification
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Registration Accuracy:</strong> Users must provide accurate and
                complete personal information. Incorrect or false information may
                result in account suspension or order cancellation.
              </li>

              <li>
                <strong>Identity Verification:</strong> We may request valid
                government-issued identification such as Aadhaar Card, PAN Card,
                Driving Licence, or GST Registration details to comply with legal,
                transportation, and taxation requirements.
              </li>

              <li>
                <strong>Data Security & Privacy:</strong> All personal information and
                submitted documents are stored securely and handled confidentially. We
                do not sell or share customer information with unauthorized third
                parties.
              </li>

              <li>
                <strong>Account Deletion:</strong> Customers may request account
                deletion at any time. Certain records may be retained where required by
                applicable legal, taxation, or administrative regulations.
              </li>
            </ul>
          </div>

          {/* 7 */}
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
              7. Prohibited Website Use & Indemnity
            </h3>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Users shall not use this Website/App for unlawful, fraudulent, or
                prohibited purposes.
              </li>

              <li>
                Users agree to indemnify and hold harmless
                <strong> SIVAKASI PYRO PARK </strong>
                against any claims, liabilities, damages, legal disputes, or expenses
                arising from misuse of the Website/App or violation of applicable
                firecracker safety or environmental laws.
              </li>
            </ul>
          </div>

        </section>

        <p className="text-xs text-gray-500 mt-8 text-center">
          Last updated: July {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}