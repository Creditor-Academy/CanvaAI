import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ForgetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get email from URL
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if email exists in URL
  useEffect(() => {
    if (!email) {
      setError("Invalid reset link ❌");
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return setError("Invalid reset link ❌");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== confirm) {
      return setError("Passwords do not match ❌");
    }

    try {
      setLoading(true);
      setError("");

      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/change-password`, {
        email,
        password,
      });

      setSuccess("Password changed successfully ✅");

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  px-4">

      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-center mb-6">
          Change Password
        </h2>

        {/* Show Email */}
        {email && (
          <p className="text-center text-sm text-gray-600 mb-4">
            Resetting password for:{" "}
            <span className="font-semibold text-indigo-600">
              {email}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* New Password */}
          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          />

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          />

          {/* Error */}
          {error && (
            <p className="text-red-600 text-center text-sm">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-green-600 text-center text-sm">
              {success}
            </p>
          )}

          {/* Button */}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold disabled:opacity-70"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
