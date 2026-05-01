import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAlert } from "../store/alert.store";
import { apiFetch } from "../services/api";
import { useConfigStore } from "../store/config.store";
import { INDIA_STATES } from "../utils/states";
import ReCAPTCHA from "react-google-recaptcha";

export default function Register() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
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
  const sendOtp = async () => {

    if (!mobile) {
      showAlert({
        type: "error",
        message: "Please enter your mobile number",
      });
      return;
    }

    if (!isMobileValid) {
      showAlert({
        type: "error",
        message: "Enter a valid 10-digit mobile number",
      });
      return;
    }

    if (!captchaToken) {
      showAlert({
        type: "error",
        message: "Please complete CAPTCHA verification",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await apiFetch("/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({
          mobile: cleanMobile,
          captchaToken,
        }),
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

    if (!otp) {
      showAlert({
        type: "error",
        message: "Please enter OTP",
      });
      return;
    }

    if (!form.password || !form.confirmPassword) {
      showAlert({
        type: "error",
        message: "Please enter password",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      showAlert({
        type: "error",
        message: "Passwords do not match",
      });
      return;
    }

    if (
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
      <div className="flex items-center gap-3 mb-4">
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

        <h1 className="text-xl font-bold text-[var(--color-primary)]">
          Register
        </h1>
      </div>

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

          <div className="mb-4 flex justify-center">
            <ReCAPTCHA
              sitekey="6Ld4itMsAAAAAFotYg6ziCo1yb2HVlA8oJodr5M_"
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <Button
            className="w-full"
            onClick={sendOtp}
            disabled={loading}
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

          <select
            value={form.state}
            onChange={(e) =>
              setForm({ ...form, state: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3 bg-white"
          >
            <option value="">Select State</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

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