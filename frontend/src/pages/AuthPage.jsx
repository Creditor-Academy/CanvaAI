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
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });


  const processedTokenRef = useRef(null);


  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google?mode=${isSignup ? "signup" : "login"}`;
  };


 const handleForgotPassword = async () => {
  if (!formData.email) {
    setForgotMsg("Please enter your email first");
    setTimeout(() => setForgotMsg(""), 3000);
    return;
  }

  try {
    setForgotLoading(true);
    setForgotMsg("");
    await api.forgetPassword(formData.email);
    setForgotMsg("Reset link sent to your email");

    setTimeout(() => {
      setForgotMsg("");
    }, 5000);

  } catch (err) {
    setForgotMsg(err.response?.data?.msg || "Failed to send reset link");

    setTimeout(() => {
      setForgotMsg("");
    }, 3000);
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
    setErrors({
      email: "",
      password: ""
    });
    setForgotMsg("");
    setError(null);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;


    setFormData({ ...formData, [name]: value });


    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (!emailRegex.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Enter a valid email address" }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    }


    if (name === "password") {
      if (value.includes(" ")) {
        setErrors((prev) => ({ ...prev, password: "Password cannot contain spaces" }));
      } else if (value.length < 3) {
        setErrors((prev) => ({ ...prev, password: "Password must be at least 3 characters" }));
      } else {
        setErrors((prev) => ({ ...prev, password: "" }));
      }
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (errors.email || errors.password) {
      return;
    }


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
        if (response?.unverified) {
          localStorage.setItem("email", formData.email);
          navigate("/verify", { state: { email: formData.email } });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-400 to-blue-300 px-4">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">
          {isLoading && (
            <>
              <div className="w-16 h-16 border-4 border-gray-100 border-t-indigo-500 rounded-full mx-auto mb-5 animate-spin" />
              <h2 className="text-lg sm:text-xl font-semibold">Verifying session...</h2>
            </>
          )}


          {error && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto flex items-center justify-center mb-5">
                <XCircle className="text-white" />
              </div>
              <p className="text-sm sm:text-base">{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0c4a6ecc,#1e40afcc,#0ea5e9cc)] px-4 py-6 sm:px-6 sm:py-8 md:p-6 flex items-center justify-center">
      <motion.div
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full pt-6 md:pt-0 max-w-[95%] sm:max-w-[650px] md:max-w-[780px] lg:max-w-[820px] min-h-[540px] md:min-h-[540px] h-auto bg-white rounded-[30px] shadow-2xl overflow-hidden"
      >
        {/* LOGIN PANEL */}
        <div className={`absolute top-0 left-0 h-auto md:h-full w-full pt-6 md:pt-0 md:w-1/2 flex items-center justify-center px-6 md:px-10 transition-all duration-700 ${isSignup ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <div className="w-full pt-6 md:pt-0">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Welcome Back
            </h2>


            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 md:py-2.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}


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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <div className="w-full flex justify-end mt-1">
  <button
    type="button"
    onClick={handleForgotPassword}
    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
  >
    {forgotLoading ? (
      <>
        <Loader2 className="animate-spin" size={14} />
        Sending...
      </>
    ) : (
      "Forgot Password?"
    )}
  </button>
</div>

              <button
                type="submit"
                className="bg-[#fbbf24] text-black py-3 md:py-2.5 rounded-full font-semibold hover:bg-[#f59e0b] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Sign In"}
              </button>
            </form>


           {forgotMsg && (
  <div className="fixed top-8 right-8 z-50 animate-slideIn">
    <div className="bg-white border border-blue-300 shadow-2xl rounded-2xl px-8 py-5 flex items-center gap-4 min-w-[320px]">
      
      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
        ✓
      </div>

      <div>
        <p className="text-sm text-gray-500">Password Reset</p>
        <p className="text-base font-semibold text-gray-800">
          {forgotMsg}
        </p>
      </div>

    </div>
  </div>
)}


            <button
              onClick={handleGoogleAuth}
              className="group mt-5 border px-6 py-3 rounded-full flex items-center gap-3 justify-center w-full bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-lg hover:scale-[1.04] active:scale-[0.97]"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 48 48"
              >
                <path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.7 2.6 29.8 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.4 5.7C12 13 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.7-.4-4H24v7.6h12.7c-.3 1.9-1.9 4.7-5.5 6.6l8.5 6.6c4.9-4.5 7.7-11.1 7.7-18.8z" />
                <path fill="#FBBC05" d="M10.1 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.4-5.7C1 17.7 0 20.8 0 24s1 6.3 2.7 9.6l7.4-4.7z" />
                <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-8.5-6.6c-2.3 1.6-5.3 2.7-7.5 2.7-6.4 0-12-4.3-13.9-10.1l-7.4 5.7C6.6 42.6 14.6 48 24 48z" />
              </svg>
              <span className="font-medium text-gray-700">
                Sign in with Google
              </span>
            </button>


            <p className="text-sm text-center mt-6 md:hidden">
              Don't have an account?{" "}
              <button
                onClick={toggleForm}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>


        {/* SIGNUP PANEL */}
        <div className={`absolute top-0 left-0 h-auto md:h-full w-full pt-10 md:pt-0 md:w-1/2 flex items-center justify-center py-4 px-8 md:px-12 transition-all duration-700 ${isSignup ? "md:translate-x-full opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="w-full md:max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Create Account
            </h2>


            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange}
                className="w-full px-4 py-3 md:py-2.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" required />
              <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange}
                className="w-full px-4 py-3 md:py-2.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" required />
              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 md:py-2.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}


              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}


              <button
                type="submit"
                className="bg-[#fbbf24] text-black py-3 mt-2 md:py-2.5 rounded-full font-semibold hover:bg-[#f59e0b] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Sign Up"}
              </button>
            </form>


            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-3 text-gray-500 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>


            <button
              onClick={handleGoogleAuth}
              className="group mt-2 border px-6 py-3 rounded-full flex items-center gap-3 justify-center w-full bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-lg hover:scale-[1.04] active:scale-[0.97]"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 48 48"
              >
                <path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.7 2.6 29.8 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.4 5.7C12 13 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.7-.4-4H24v7.6h12.7c-.3 1.9-1.9 4.7-5.5 6.6l8.5 6.6c4.9-4.5 7.7-11.1 7.7-18.8z" />
                <path fill="#FBBC05" d="M10.1 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.4-5.7C1 17.7 0 20.8 0 24s1 6.3 2.7 9.6l7.4-4.7z" />
                <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-8.5-6.6c-2.3 1.6-5.3 2.7-7.5 2.7-6.4 0-12-4.3-13.9-10.1l-7.4 5.7C6.6 42.6 14.6 48 24 48z" />
              </svg>
              <span className="font-medium text-gray-700">Sign up with Google</span>
            </button>


            <p className="text-sm text-center mt-6 md:hidden">
              Already have an account?{" "}
              <button onClick={toggleForm} className="text-indigo-600 font-semibold hover:underline">
                Sign In
              </button>
            </p>
          </div>
        </div>


        {/* OVERLAY PANEL */}
        <div className={`hidden md:flex absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(135deg,#2180b7,#798fda)] text-white flex-col items-center justify-center text-center px-8 lg:px-10 transition-all duration-700 ${isSignup ? "-translate-x-full" : ""}`}>
          {isSignup ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
              <p className="mb-6 max-w-[280px]">To keep connected with us please login</p>
              <button onClick={toggleForm} className="border border-white px-8 py-2 rounded-full hover:bg-white hover:text-indigo-600 transition">
                Sign In
              </button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Hello, User!</h2>
              <p className="mb-6 max-w-[280px]">Enter your details and start journey with us</p>
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