export default function PrivacyPolicy() {
  return (
    <div className="bg-[var(--color-background)] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">
          Privacy Policy
        </h1>

        {/* Section */}
        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">

          <h2 className="font-semibold text-lg text-[var(--color-primary)]">
            Terms and Conditions
          </h2>
          <p>
            Your access and use of the Cracker Shop website/app is subject to
            terms and conditions. You should not use the website/app for any
            unlawful or prohibited purpose. By accessing the website/app, you
            are duly accepting the terms and conditions available on our
            platform.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Conditions Apply
          </h2>
          <p>
            18% GST and package charges will be added extra. Orders will be
            dispatched only when full payment is completed. Prices may vary
            according to market conditions. Cashback offers and referral codes
            are subject to terms and conditions.
          </p>
          <p>
            Minimum order amount of ₹3000/- is applicable for all orders.
            Orders once placed cannot be cancelled after payment. Refunds, if
            applicable, will be processed within 15 days.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Eligibility
          </h2>
          <p>
            Purchase of crackers is restricted to individuals above 18 years of
            age. Minors may access the website/app only under the supervision of
            a parent or legal guardian.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Personal Identification Information
          </h2>
          <p>
            During registration, users may be required to provide personal
            details such as name, mobile number, email address, communication
            address, and other relevant information. All collected data is used
            strictly to improve service quality.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Registration Obligations
          </h2>
          <p>
            Customers must ensure that all information provided during
            registration is accurate and complete. False information may lead
            to order cancellation. We do not sell or share customer information
            with third parties.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Information Protection
          </h2>
          <p>
            We maintain appropriate security practices to protect personal and
            transactional data. All user information is safeguarded from
            unauthorized access.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Legal Advisory
          </h2>
          <p>
            As per Supreme Court regulations, online sale of firecrackers is
            restricted. Orders placed through the website/app will be treated
            as enquiries. Our team will contact you within 24 hours to confirm
            the order.
          </p>

          <h2 className="font-semibold text-lg text-[var(--color-primary)] mt-6">
            Account Deletion
          </h2>
          <p>
            Users may request account deletion at any time. Upon deletion, all
            associated data will be permanently removed. This action is
            irreversible. Certain data may be retained for legal or
            administrative purposes.
          </p>

        </section>

        {/* Last Updated */}
        <p className="text-xs text-gray-500 mt-8 text-center">
          Last updated: January {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}