import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";



const VerifyUserPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const [msg, setMsg] = useState({
    text: "",
    type: ""
  });

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
        return "text-#fbbf24";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-#f59e0b";
      case "info":
        return "text-blue-800 ";
      default:
        return "";
    }
  };
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return; // only number

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move next
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

  // final OTP string
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
        { email, otp: finalOtp }
      );

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
      { email }
    );

    setMsg({
      text: "OTP resent successfully",
      type: "info"
    });

    setTimer(60); // yahi se 60 sec ka reverse countdown start hoga

    // optional: inputs clear
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
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `
        linear-gradient(rgba(5,15,25,0.45), rgba(10,25,50,0.55)),
        url("https://i.pinimg.com/736x/2a/2c/7e/2a2c7e8964d19d971f2fbb2afec18741.jpg")
      `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      <div className="w-full max-w-md p-8 rounded-2xl
      bg-white/20 backdrop-blur-xl border border-white/30
      shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)], text-white
      ">

        <h2 className="text-2xl  font-bold text-center mb-4 tracking-wide">
          Email Verification
        </h2>

        <p className="text-center text-white/80 mb-4">
          Enter OTP sent to{" "}
          <span className="font-semibold text-white">
            {maskEmail(email)}
          </span>
        </p>

        {msg.text && (
          <p className={`text-center text-sm mb-3 font-medium ${getMsgColor()}`}>
            {msg.text}
          </p>
        )}

        <form onSubmit={handleVerify}>

          <div onPaste={handlePaste} className="flex justify-between gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="
      w-12 h-14 text-center text-xl font-semibold
      rounded-md bg-white/10 border border-white/40
      text-white placeholder-white/40
      backdrop-blur-md
      focus:outline-none focus:border-blue-300
      focus:ring-2 focus:ring-blue-400/40
      transition-all"
              />
            ))}
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold tracking-wide
          bg-gradient-to-b from-blue-400 to-blue-900
          shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]
          hover:brightness-110 active:scale-[0.99]
          disabled:opacity-60 transition-all"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

        </form>

        <div className="text-center mt-4 text-sm">

          {timer > 0 ? (
            <p className="text-white/70">
              Resend in {timer}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#f9fafb] hover:underline disabled:opacity-50"
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