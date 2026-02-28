import { useState } from "react";
import Button from "../components/ui/Button";

export default function Contact() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact Form Submitted:", form);
    // later → API call
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">
          Contact Us
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Please drop a message to know more details.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        {/* Left Illustration / Info */}
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

        {/* Right Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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

          <Button type="submit" className="w-full md:w-fit px-10">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}