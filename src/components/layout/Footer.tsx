import { Link } from "react-router-dom";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { useConfigStore } from "../../store/config.store";

export default function Footer() {
  const config = useConfigStore((s) => s.config);

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

            {config?.adminAddress && (
              <li>{config.adminAddress}</li>
            )}
            {config?.adminMobile && (
              <li>
                <a
                  href={`tel:+91${config.adminMobile}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <FaPhoneAlt />
                  <span>+91 {config.adminMobile}</span>
                </a>
              </li>
            )}

            {config?.adminWhatsapp && (
              <li>
                <a
                  href={`https://wa.me/91${config.adminWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline text-green-300"
                >
                  <FaWhatsapp />
                  <span>+91 {config.adminWhatsapp}</span>
                </a>
              </li>
            )}

            {config?.additionalContact && (
              <li>
                <a
                  href={`tel:+91${config.additionalContact}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <FaPhoneAlt />
                  <span>+91 {config.additionalContact}</span>
                </a>
              </li>
            )}

            {config?.adminEmail && (
              <li>
                <a
                  href={`mailto:${config.adminEmail}`}
                  className="hover:underline"
                >
                  📧 {config.adminEmail}
                </a>
              </li>
            )}

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
