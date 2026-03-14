import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const processedTokenRef = useRef(null);

  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setForgotMsg("Please enter your email first");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotMsg("");
      await api.forgetPassword(formData.email);
      setForgotMsg("Reset link sent to your email");
    } catch (err) {
      setForgotMsg(err.response?.data?.msg || "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    const googleToken = searchParams.get("googleToken");
    const authToken = token || googleToken;

    if (!authToken) return;
    if (processedTokenRef.current === authToken) return;

    processedTokenRef.current = authToken;

    const authenticate = async () => {
      try {
        setIsLoading(true);
        const response = await api.verifyToken(authToken);

        if (response.success && response.token) {
          await login(response.token);
          navigate("/home", { replace: true });
        } else {
          throw new Error(response.msg || "Invalid session");
        }
      } catch (err) {
        setError("Authentication failed. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 2500);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, [searchParams, login, navigate]);

  const toggleForm = () => {
    setIsSignup((prev) => !prev);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      username: ""
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;

      if (isSignup) {
        response = await api.register(formData);
        await api.sendOTP(formData.email);
        localStorage.setItem("email", formData.email);
        navigate("/verify", { state: { email: formData.email } });
        return;
      } else {
        response = await api.login(formData);
        console.log("Login response:", response);
        if (response.unverified) {
          localStorage.setItem("email", formData.email);
          navigate("/verify", { state: { email: formData.email } });
          return;
        }


        if (response?.unverified) {

          localStorage.setItem("email", formData.email);

          navigate("/verify", {
            state: { email: formData.email }
          });

          return;
        }
      }

      await login(response.token);
      navigate("/home");
    } catch (err) {
      alert(
        (isSignup ? "Signup" : "Login") +
          " failed! " +
          (err.message || "Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (searchParams.get("token") || searchParams.get("googleToken")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">
          {isLoading && (
            <>
              <div className="w-16 h-16 border-4 border-gray-100 border-t-indigo-500 rounded-full mx-auto mb-5 animate-spin" />
              <h2 className="text-xl font-semibold">Verifying session...</h2>
            </>
          )}

          {error && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto flex items-center justify-center mb-5">
                <XCircle className="text-white" />
              </div>
              <p>{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#0c4a6ecc,#1e40afcc,#0ea5e9cc)] p-6">

      <motion.div
  initial={{ opacity: 0, y: 60, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
  className="relative max-w-[900px] w-full min-h-[560px] bg-white rounded-[30px] shadow-2xl overflow-hidden"
>

        {/* LOGIN PANEL */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex items-center justify-center px-12 transition-all duration-700 ${isSignup ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <div className="w-full">

            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Welcome Back
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none pr-10 focus:ring-2 focus:ring-indigo-400"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <button
                type="submit"
                className="bg-[#fbbf24] text-black py-3 rounded-full font-semibold hover:bg-[#f59e0b] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto"/> : "Sign In"}
              </button>

            </form>

            <button
              onClick={handleForgotPassword}
              className="text-sm text-indigo-800 mt-4 w-full text-center hover:underline"
            >
              {forgotLoading ? "Sending..." : "Forgot Password?"}
            </button>

            {forgotMsg && <p className="text-sm text-center mt-2">{forgotMsg}</p>}

            {/* GOOGLE BUTTON WITH ANIMATION */}
            <button
              onClick={handleGoogleAuth}
              className="group mt-5 border px-6 py-3 rounded-full flex items-center gap-3 justify-center w-full
              bg-white hover:bg-gray-50
              transition-all duration-300
              hover:shadow-lg
              hover:scale-[1.04]
              active:scale-[0.97]"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 48 48"
              >
                <path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.7 2.6 29.8 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.4 5.7C12 13 17.6 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.7-.4-4H24v7.6h12.7c-.3 1.9-1.9 4.7-5.5 6.6l8.5 6.6c4.9-4.5 7.7-11.1 7.7-18.8z"/>
                <path fill="#FBBC05" d="M10.1 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.4-5.7C1 17.7 0 20.8 0 24s1 6.3 2.7 9.6l7.4-4.7z"/>
                <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-8.5-6.6c-2.3 1.6-5.3 2.7-7.5 2.7-6.4 0-12-4.3-13.9-10.1l-7.4 5.7C6.6 42.6 14.6 48 24 48z"/>
              </svg>

              <span className="font-medium text-gray-700">
                Continue with Google
              </span>
            </button>

          </div>
        </div>

        {/* SIGNUP PANEL */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex items-center justify-center px-12 transition-all duration-700 ${isSignup ? "translate-x-full opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="w-full">

            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Create Account
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" required />

              <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" required />

              <input name="email" placeholder="Email" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" required />

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none pr-10 focus:ring-2 focus:ring-indigo-400"
                  required
                />

                <button
                  type="button"
                  onClick={()=>setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <button
                type="submit"
                className="bg-[#fbbf24] text-black py-3 rounded-full font-semibold hover:bg-[#f59e0b] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto"/> : "Sign Up"}
              </button>

            </form>

          </div>
        </div>

        {/* OVERLAY PANEL */}
        <div className={`absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(135deg,#2180b7,#798fda)] text-white flex flex-col items-center justify-center text-center px-10 transition-all duration-700 ${isSignup ? "-translate-x-full" : ""}`}>

          {isSignup ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
              <p className="mb-6">To keep connected with us please login</p>
              <button onClick={toggleForm} className="border border-white px-8 py-2 rounded-full hover:bg-white hover:text-indigo-600 transition">
                Sign In
              </button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Hello, User!</h2>
              <p className="mb-6">Enter your details and start journey with us</p>
              <button onClick={toggleForm} className="border border-white px-8 py-2 rounded-full hover:bg-white hover:text-indigo-600 transition">
                Sign Up
              </button>
            </>
          )}

        </div>

      </motion.div>

    </div>
  );
};

export default AuthPage;
