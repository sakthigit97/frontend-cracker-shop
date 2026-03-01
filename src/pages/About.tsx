export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">
          About Us
        </h1>
        <p className="text-[var(--color-muted)] max-w-2xl mx-auto">
          One of the leading wholesale and retail crackers stores in Sivakasi,
          serving customers across India with quality and trust.
        </p>
      </div>

      {/* About Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-4">
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Greetings from <span className="font-semibold text-[var(--color-primary)]">Sivakasi Pyro Park</span>.
          We are one of the leading wholesale and retail crackers stores in Sivakasi.
          Any special occasion is incomplete without crackling sounds and vibrant colors.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          We are a one-stop shop for all your cracker needs, catering to both
          wholesale and retail customers. As one of the biggest online retailers
          for the past 10 years, we ensure 100% guaranteed products and excellent
          customer service.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Celebrate every happy occasion with our high-quality crackers.
          For orders and enquiries, call or WhatsApp us at{" "}
          <span className="font-medium text-[var(--color-primary)]">
            98845 95718
          </span>.
        </p>
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceCard
          title="Safe Payment"
          description="Pay with secure and trusted payment methods."
          icon="💳"
        />

        <ServiceCard
          title="Quick Delivery"
          description="Delivery at your convenient time and date."
          icon="🚚"
        />

        <ServiceCard
          title="24/7 Help Center"
          description="Our support team is always ready to help you."
          icon="☎️"
        />
      </div>

      {/* Key Points */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-4">
          Why Choose Us
        </h2>

        <ul className="space-y-3 text-sm text-[var(--color-muted)]">
          <li>• Easy-to-use website and mobile app for online enquiries.</li>
          <li>• Delivery available all over India.</li>
          <li>• 2 to 5 days delivery with utmost care.</li>
          <li>• Attractive discounts on all products.</li>
          <li>• High-quality crackers sourced from trusted manufacturers.</li>
          <li>• Guaranteed service and 100% customer satisfaction.</li>
        </ul>
      </div>
    </div>
  );
}

function ServiceCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center space-y-3">
      <div className="text-4xl">{icon}</div>
      <h3 className="font-semibold text-[var(--color-primary)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}