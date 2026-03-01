import { useState } from "react";
import Button from "../components/ui/Button";
import { contactUsApi } from "../services/contact.api";
import { useAlert } from "../store/alert.store";

export default function Contact() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showAlert({ type: "error", message: "Name is required" });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      showAlert({
        type: "error",
        message: "Enter valid 10-digit mobile number",
      });
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showAlert({
        type: "error",
        message: "Enter valid email address",
      });
      return;
    }

    try {
      setLoading(true);

      await contactUsApi({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      showAlert({
        type: "success",
        message: "Your message has been sent successfully!",
      });

      setForm({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err?.message || "Failed to send message",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">
          Contact Us
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Please drop a message to know more details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col justify-center items-center text-center gap-6">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3059/3059518.png"
            alt="Support"
            className="w-56 max-w-full"
          />

          <p className="text-sm text-[var(--color-muted)] max-w-sm">
            Our support team is always ready to help you with product enquiries,
            bulk orders, and delivery-related questions.
          </p>

          <div className="text-sm text-[var(--color-muted)] space-y-1">
            <p>📍 Sivakasi, Tamil Nadu</p>
            <p>📞 +91 98845 95718</p>
            <p>📧 support@crackershop.com</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium">
              Shop / Person Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Contact / WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Email ID for Queries
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Message
            </label>
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-fit px-10"
          >
            {loading ? "Sending..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}