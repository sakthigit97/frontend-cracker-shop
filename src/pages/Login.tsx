import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.store";
import { useAlert } from "../store/alert.store";
import Button from "../components/ui/Button";
import { apiFetch, ApiError } from "../services/api";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isForgot, setIsForgot] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const cleanMobile = mobile.trim();
  const isMobileValid = /^[6-9]\d{9}$/.test(cleanMobile);

  const validateForm = () => {
    if (!cleanMobile) {
      showAlert({
        type: "error",
        message: "Please enter your mobile number",
      });
      return false;
    }

    if (!isMobileValid) {
      showAlert({
        type: "error",
        message: "Enter a valid 10-digit mobile number",
      });
      return false;
    }

    if (!password.trim()) {
      showAlert({
        type: "error",
        message: "Please enter your password",
      });
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          mobile: cleanMobile,
          password: password.trim(),
        }),
      });

      const { token, user } = res.data;

      login({
        userId: user.mobile,
        token,
        role: user.role === "admin" ? "ADMIN" : "USER",
        name: user.name || "",
      });

      showAlert({
        type: "success",
        message: "Login successful",
        duration: 1500,
      });

      setTimeout(() => {
        navigate(user.role === "admin" ? "/admin" : "/");
      }, 500);
    } catch (err: any) {
      let message = "Something went wrong. Try again";

      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = "Invalid mobile number or password";
        }
      }

      showAlert({
        type: "error",
        message,
        autoClose: true,
        duration: 3000,
      });

      setLoading(false);
      setPassword("");
    }
  };

  const sendForgotOtp = async () => {
    if (!isMobileValid) {
      showAlert({
        type: "error",
        message: "Enter a valid mobile number",
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

    setLoading(true);

    try {
      await apiFetch("/auth/forgot/send-otp", {
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

  const resetPassword = async () => {
    if (!otp || !password.trim() || !confirmPassword.trim()) {
      showAlert({
        type: "error",
        message: "Enter OTP and new password",
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        type: "error",
        message: "Passwords do not match",
      });
      return;
    }
    setLoading(true);

    try {
      await apiFetch("/auth/forgot/reset", {
        method: "POST",
        body: JSON.stringify({
          mobile: cleanMobile,
          otp,
          password: password.trim(),
        }),
      });

      showAlert({
        type: "success",
        message: "Password updated successfully",
      });

      setIsForgot(false);
      setStep(1);
      setOtp("");
      setPassword("");
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Failed to reset password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--color-surface)] p-6 rounded-xl shadow-sm space-y-4">

        {isForgot && (

          <button

            onClick={() => {
              if (step === 2) setStep(1);
              else setIsForgot(false);
            }}
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
        )}

        <h1 className="text-xl font-bold text-[var(--color-primary)] text-center">
          {isForgot ? "Reset Password" : "Login"}
        </h1>

        {!isForgot && (
          <>
            <div>
              <label className="block text-sm mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, ""))
                }
                maxLength={10}
                placeholder="Enter mobile number"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border rounded-md p-2"
              />
            </div>

            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-sm text-center text-[var(--color-muted)] mt-4">
              New user?{" "}
              <span
                className="text-[var(--color-primary)] font-medium cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Register here
              </span>
            </p>

            <p className="text-sm text-center">
              <span
                className="text-[var(--color-primary)] font-medium cursor-pointer"
                onClick={() => {
                  setIsForgot(true);
                  setStep(1);
                }}
              >
                Forgot Password?
              </span>
            </p>
          </>
        )}

        {isForgot && step === 1 && (
          <>
            <input
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Mobile Number"
              className="w-full border p-2"
            />

            <ReCAPTCHA
              sitekey="6Ld4itMsAAAAAFotYg6ziCo1yb2HVlA8oJodr5M_"
              onChange={(token) => setCaptchaToken(token)}
            />

            <Button onClick={sendForgotOtp} className="w-full">
              Send OTP
            </Button>
          </>
        )}

        {isForgot && step === 2 && (
          <>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
              className="w-full border p-2"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border p-2"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full border p-2"
            />
            <Button onClick={resetPassword} className="w-full">
              Reset Password
            </Button>
          </>
        )}

      </div>
    </div>
  );
}