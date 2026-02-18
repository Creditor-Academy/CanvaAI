import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const ForgetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

      // ✅ API SERVICE FUNCTION CALL
      const res = await api.resetpassword(email, password);

      if (res.success) {
        setSuccess("Password changed successfully ✅");

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(res.message || "Something went wrong");
      }

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-center mb-6">
          Change Password
        </h2>

        {email && (
          <p className="text-center text-sm text-gray-600 mb-4">
            Resetting password for:{" "}
            <span className="font-semibold text-indigo-600">
              {email}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />

          {error && (
            <p className="text-red-600 text-center text-sm">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-600 text-center text-sm">
              {success}
            </p>
          )}

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
