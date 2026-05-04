import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import LoadingPage from "@/components/canva/components/LoadingPage";

const AuthContext = createContext();

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null: loading
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile to check role
  const fetchUserProfile = useCallback(async () => {
    try {
      const profileData = await api.getProfile();
      setUser(profileData);
      setIsAdmin(profileData?.role === 'admin');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // api.js 401 handler already covers token rejection + redirect.
      // For other errors (network, 500s) just clear user data without logging out.
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        // Token exists but is expired — clear it immediately
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      } else {
        setIsAuthenticated(true);
        fetchUserProfile();
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = useCallback(async (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  }, []);

  if (isAuthenticated === null || isLoading) {
    // You can show a loading indicator here while the token check is in progress
    return <LoadingPage />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
