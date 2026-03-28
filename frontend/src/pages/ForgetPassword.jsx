import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();

  // Get email from URL
  const email = new URLSearchParams(window.location.search).get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setError("Invalid or expired reset link");
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) return setError("Invalid reset link");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      setError("");

      // PATCH request with query email
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/change-password?email=${email}`,
        {
          newPassword: password,
        }
      );

      setSuccess("Password updated successfully");

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          Reset Your Password
        </h2>

        {email && (
          <p className="text-center text-sm text-gray-600 mb-4">
            Resetting password for:
            <span className="font-semibold text-indigo-600"> {email}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-600 text-sm p-2 rounded text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;