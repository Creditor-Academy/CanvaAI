import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VerifyUserPage = () => {

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState({
    text: "",
    type: ""
  });

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [timer, setTimer] = useState(120);

  const navigate = useNavigate();
  const location = useLocation();

  const email =
  location.state?.email ||
  localStorage.getItem("email");


  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const getMsgColor = () => {
    switch (msg.type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "";
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp) {
      return setMsg({
        text: "Please enter OTP",
        type: "warning"
      });
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-otp`,
        { email, otp }
      );

      console.log(res);
      setMsg({
        text: res.data.message,
        type: "success"
      });

      if (res.data.success) {
        localStorage.removeItem("email");
        setTimeout(() => navigate("/"), 1200);
      }

    } catch (err) {

      setMsg({
        text: err.response?.data?.message || "Verification failed",
        type: "error"
      });

    } finally {
      setLoading(false);
    }
  };
  const handleResend = async () => {

    try {
      setResendLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/resend-otp`,
        {email}
      );

      setMsg({
        text: "OTP resent successfully",
        type: "info"
      });

      setTimer(60);

    } catch (err) {

      setMsg({
        text: "Resend failed. Try later",
        type: "error"
      });

    } finally {
      setResendLoading(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return "";

    const [name, domain] = email.split("@");

    if (name.length <= 2) {
      return name[0] + "****@" + domain;
    }

    return `${name[0]}****${name[name.length - 1]}@${domain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <h2 className="text-2xl font-bold text-center mb-4">
          Email Verification
        </h2>

        <p className="text-center text-gray-600 mb-4">
          Enter OTP sent to{" "}
          <span className="font-semibold text-black">
            {maskEmail(email)}
          </span>
        </p>

        {msg.text && (
          <p
            className={`text-center text-sm mb-3 font-medium ${getMsgColor()}`}
          >
            {msg.text}
          </p>
        )}

        <form onSubmit={handleVerify}>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit OTP"
            maxLength="6"
            className="w-full border p-3 rounded mb-4 focus:ring-2 focus:ring-blue-500"
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

        </form>

        <div className="text-center mt-4 text-sm">

          {timer > 0 ? (
            <p className="text-gray-500">
              Resend in {timer}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default VerifyUserPage;
