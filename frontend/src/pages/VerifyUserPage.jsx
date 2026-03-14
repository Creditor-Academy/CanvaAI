import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VerifyUserPage = () => {

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

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

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;

    const newOtp = paste.split("");
    setOtp(newOtp);

    newOtp.forEach((num, i) => {
      if (inputsRef.current[i]) inputsRef.current[i].value = num;
    });

    inputsRef.current[Math.min(paste.length - 1, 5)]?.focus();
  };

  const finalOtp = otp.join("");

  const handleVerify = async (e) => {

    e.preventDefault();

    if (finalOtp.length !== 6) {
      setMsg({
        text: "Enter complete OTP",
        type: "warning"
      });
      return;
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

    if (!email) return;

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
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();

    } catch (err) {

      setMsg({
        text: err.response?.data?.message || "Failed to resend OTP",
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

    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg,#0c4a6ecc,#1e40afcc,#0ea5e9cc)"
      }}
    >

      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex">

        {/* LEFT SIDE */}
        <div className="w-1/2 bg-white p-10">

          <h2 className="text-3xl font-bold text-center mb-3 text-gray-800">
            Verify Email
          </h2>

          <p className="text-center text-gray-500 mb-6">
            Enter OTP sent to <br />
            <span className="font-semibold text-gray-700">
              {maskEmail(email)}
            </span>
          </p>

          {msg.text && (
            <p className={`text-center text-sm mb-4 font-medium ${getMsgColor()}`}>
              {msg.text}
            </p>
          )}

          <form onSubmit={handleVerify}>

            <div
              onPaste={handlePaste}
              className="flex justify-between gap-3 mb-6"
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength="1"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 text-center text-lg font-semibold rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              ))}
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold bg-yellow-400 hover:bg-yellow-500 transition"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

          </form>

          <div className="text-center mt-5 text-sm">

            {timer > 0 ? (
              <p className="text-gray-500">
                Resend in {timer}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-blue-600 hover:underline"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 flex flex-col items-center justify-center text-white p-10 bg-[linear-gradient(135deg,#2180b7,#798fda)]">

          <h2 className="text-3xl font-bold mb-3">
            Hello, User!
          </h2>

          <p className="text-center opacity-90">
            Verify with OTP to continue your journey with us.
          </p>

        </div>

      </div>

    </div>
  );
};

export default VerifyUserPage;