import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAlert } from "../store/alert.store";
import { apiFetch } from "../services/api";
import { useConfigStore } from "../store/config.store";

export default function Register() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCodeUsed, setReferralCodeUsed] = useState("");
  const config = useConfigStore((s) => s.config);
  const isReferralEnabled = config?.isReferralEnabled ?? false;

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const cleanMobile = mobile.trim();
  const isMobileValid = /^[6-9]\d{9}$/.test(cleanMobile);
  const passwordsMatch =
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  const sendOtp = async () => {
    if (!isMobileValid) {
      showAlert({
        type: "error",
        message: "Enter a valid 10-digit mobile number",
      });
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      await apiFetch("/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile: cleanMobile }),
      });

      showAlert({
        type: "success",
        message: "OTP sent successfully",
      });

      setStep(2);
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Failed to send OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (
      !otp ||
      !passwordsMatch ||
      !form.name ||
      !form.address ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      showAlert({
        type: "error",
        message: "Please complete all required fields correctly",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await apiFetch("/auth/register/verify", {
        method: "POST",
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: otp.trim(),
          name: form.name.trim(),
          password: form.password,
          address: form.address.trim(),
          city: form.city?.trim(),
          state: form.state?.trim(),
          pincode: form.pincode?.trim(),
          referralCodeUsed: referralCodeUsed.trim() || undefined,
        }),
      });

      showAlert({
        type: "success",
        message: "Registration successful. Please login.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-[var(--color-surface)] border rounded-xl">
      <h1 className="text-xl font-bold text-[var(--color-primary)] mb-4">
        Register
      </h1>

      {step === 1 && (
        <>
          <label className="block text-sm mb-1">
            Mobile Number
          </label>
          <input
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, ""))
            }
            maxLength={10}
            className="w-full border rounded-md p-2 mb-4"
          />

          <Button
            className="w-full"
            onClick={sendOtp}
            disabled={!isMobileValid || loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            placeholder="OTP"
            value={otp}
            maxLength={6}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <textarea
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            placeholder="State"
            value={form.state}
            onChange={(e) =>
              setForm({ ...form, state: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />

          <input
            placeholder="Pincode"
            value={form.pincode}
            maxLength={6}
            onChange={(e) =>
              setForm({
                ...form,
                pincode: e.target.value.replace(/\D/g, ""),
              })
            }
            className="w-full border rounded-md p-2 mb-3"
          />
          {isReferralEnabled && (
            <>
              <input
                placeholder="Referral Code (Optional)"
                value={referralCodeUsed}
                onChange={(e) =>
                  setReferralCodeUsed(e.target.value.toUpperCase())
                }
                className="w-full border rounded-md p-2 mb-3"
              />

              <p className="text-xs text-gray-500 mb-3">
                Enter referral code if someone invited you (optional)
              </p>
            </>
          )}
          <Button
            className="w-full"
            onClick={verifyOtpAndRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </>
      )}
    </div>
  );
}