import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    username: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const processedTokenRef = useRef(null);

  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
  }


  const handleForgotPassword = async () => {
    if (!formData.email) {
      setForgotMsg("❌ Please enter your email first");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotMsg("");

      await api.forgetPassword(formData.email);

      setForgotMsg("Reset link sent to your email");

    } catch (err) {
      setForgotMsg(
        err.response?.data?.msg || "❌ Failed to send reset link"
      );
    } finally {
      setForgotLoading(false);
    }
  };


  // Handle token-based authentication from LMS
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
        setError(null);

        // Verify token from backend (recommended)
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
    setIsSignup(!isSignup);
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      if (isSignup) {
        response = await api.register(formData);

        await api.sendOTP(formData.email);
        localStorage.setItem("email", formData.email);

        navigate('/verify', { state: { email: formData.email } });
        return;
      } else {
        response = await api.login(formData);
        console.log("Login response:", response);
        if (response.unverified) {

          localStorage.setItem("email", formData.email);

          navigate("/verify", {
            state: { email: formData.email }
          });

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
      navigate('/home');
    } catch (err) {
      console.error('Login/Signup error:', err);
      alert(
        (isSignup ? 'Signup' : 'Login') + ' failed! ' +
        (err.message || 'Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading or message state when verifying token
  if (searchParams.get('token') || searchParams.get('googleToken')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">
          {isLoading && (
            <>
              <div className="w-16 h-16 border-4 border-gray-100 border-t-indigo-500 rounded-full mx-auto mb-5 animate-spin" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                Verifying your session...
              </h2>
              <p className="text-sm text-gray-500">
                Please wait while we authenticate you
              </p>
            </>
          )}

          {message && !isLoading && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-5 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-green-500 mb-3">
                {message}
              </h2>
            </>
          )}

          {error && !isLoading && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-5 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-red-500 mb-3">
                Authentication Failed
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {error}
              </p>
              <p className="text-xs text-gray-400">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500">
            {isSignup ? 'Sign up to get started' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isSignup && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={isSignup}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={isSignup}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className=" cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:text-indigo-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          {!isSignup && (
            <div className="flex justify-end -mt-3">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition disabled:opacity-70"
              >
                {forgotLoading ? "Sending..." : "Forgot Password?"}
              </button>
              {forgotMsg && (
                <span className="ml-4 text-sm font-medium text-gray-600">
                  {forgotMsg}
                </span>
              )}
            </div>
          )}


          <button
            type="submit"
            disabled={isLoading}
            className="relative h-12 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-80 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            ) : (
              <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            onClick={toggleForm}
            className="bg-transparent border-none text-indigo-500 text-sm font-semibold cursor-pointer px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {isSignup ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <button
  onClick={handleGoogleAuth}
  type="button"
  className="mt-5 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
>
  {/* Google Icon */}
  <svg
    width="20"
    height="20"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.86-6.86C35.9 2.18 30.32 0 24 0 14.82 0 6.84 5.16 2.69 12.7l7.98 6.2C12.6 13.14 17.85 9.5 24 9.5z"
    />
    <path
      fill="#34A853"
      d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.4c-.54 2.92-2.2 5.4-4.68 7.08l7.26 5.64C43.97 36.98 46.1 31.3 46.1 24.5z"
    />
    <path
      fill="#FBBC05"
      d="M10.67 28.9a14.5 14.5 0 010-9.8l-7.98-6.2A24.04 24.04 0 000 24c0 3.87.93 7.53 2.69 10.7l7.98-5.8z"
    />
    <path
      fill="#EA4335"
      d="M24 48c6.32 0 11.63-2.08 15.5-5.64l-7.26-5.64c-2.02 1.36-4.6 2.18-8.24 2.18-6.15 0-11.4-3.64-13.33-8.9l-7.98 6.2C6.84 42.84 14.82 48 24 48z"
    />
  </svg>

  <span className="text-sm sm:text-base">
    Continue with Google
  </span>
</button>
      </div>
    </div>
  );
};

export default AuthPage;