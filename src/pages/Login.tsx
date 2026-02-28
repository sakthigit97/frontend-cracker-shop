import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.store";
import { useAlert } from "../store/alert.store";
import Button from "../components/ui/Button";
import { apiFetch, ApiError } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--color-surface)] p-6 rounded-xl shadow-sm space-y-4">

        <h1 className="text-xl font-bold text-[var(--color-primary)] text-center">
          Login
        </h1>

        {/* Mobile */}
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

        {/* Password */}
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

      </div>
    </div>
  );
}