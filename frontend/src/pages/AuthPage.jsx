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
  const processedTokenRef = useRef(null);

  // Handle token-based authentication from LMS
  useEffect(() => {
    const token = searchParams.get('token');

    // Skip if no token or if we've already processed this token
    if (!token || processedTokenRef.current === token) {
      return;
    }

    // Mark this token as being processed
    processedTokenRef.current = token;

    const handleTokenAuth = async () => {
      // Clear any existing token first to prevent AuthContext from using an old one
      localStorage.removeItem('token');

      setIsLoading(true);
      setError(null);

      try {
        // Verify the token with the backend
        const response = await api.verifyToken(token);

        if (response.success && response.token) {
          // Store the token in localStorage and wait for profile fetch
          await login(response.token);

          if (response.created) {
            // New user - show welcome message before redirecting
            setMessage('Account created and authenticated! Redirecting...');
            setTimeout(() => {
              navigate('/home', { replace: true });
            }, 1000);
          } else {
            // Existing user - redirect immediately to Create page
            navigate('/home', { replace: true });
          }
        } else {
          setError(response.msg || 'Invalid or expired session');
          // Redirect to landing page after showing error
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        setError(err.message || 'Invalid or expired session');

        // Redirect to home after showing error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleTokenAuth();
  }, [searchParams, login, navigate]); // Dependencies are now stable

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
      } else {
        response = await api.login(formData);
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
  if (searchParams.get('token')) {
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
      </div>
    </div>
  );
};

export default AuthPage;


