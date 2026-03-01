import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            Premium quality crackers from Sivakasi.
            Celebrate every occasion with safety and joy.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/about" className="hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>Sivakasi, Tamil Nadu</li>
            <li>📞 +91 98845 95718, </li>
            <li>📧 support@crackershop.com</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Mobile App</h4>
          <p className="text-sm text-white/80 mb-3">
            Order faster using our mobile app
          </p>
          <button
            className="
              bg-[var(--color-accent)]
              text-[var(--color-primary)]
              px-4 py-2
              rounded-md
              text-sm
              font-semibold
              hover:opacity-90
              transition
            "
          >
            Download App
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} Cracker Shop. All rights reserved.
      </div>
    </footer>
  );
}
