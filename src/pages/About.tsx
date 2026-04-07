import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-3">

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
          Greetings from{" "}
          <span className="font-semibold text-[var(--color-primary)]">
            Sivakasi Pyro Park
          </span>
          . We are one of the leading wholesale and retail crackers stores in
          Sivakasi. Any special occasion is incomplete without crackling sounds
          and vibrant colors.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          We proudly introduce the <span className="font-medium">first ever
            online portal designed for crackers estimation</span>. With
          experience of over a decade in this industry, we understand the needs
          of both wholesale and retail customers.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Our user-friendly website and mobile app make it easy for customers
          to browse products and place enquiries online. We carefully choose
          quality products from multiple trusted brands to ensure the best
          experience for our customers.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Our crackers service is available all over the year, helping customers
          celebrate every special occasion with joy and safety.
        </p>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          For orders and enquiries, call or WhatsApp us at{" "}
          <span className="font-medium text-[var(--color-primary)]">
            98845 95718
          </span>
          .
        </p>
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceCard
          title="Safe Payment"
          description="Pay with secure and trusted business current accounts."
          icon="💳"
        />

        <ServiceCard
          title="Quick Delivery"
          description="Orders will be delivered within a week. Outside Tamil Nadu delivery may take 2 to 4 weeks depending on the location."
          icon="🚚"
        />
      </div>

      {/* Key Points */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-4">
          Why Choose Us
        </h2>

        <ul className="space-y-3 text-sm text-[var(--color-muted)]">
          <li>• First ever online portal designed for crackers estimation.</li>
          <li>• Experience of over a decade in the crackers industry.</li>
          <li>• User-friendly website and mobile app for online enquiries.</li>
          <li>• Carefully chosen quality products from multi brands.</li>
          <li>• Delivery available all over India.</li>
          <li>• Attractive discounts on all products.</li>
          <li>• Guaranteed service and customer satisfaction.</li>
          <li>• Crackers service available throughout the year.</li>
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