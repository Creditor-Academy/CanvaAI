import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser]       = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── FIX 1: useRef instead of useState ─────────────────────────────────────
  // A ref mutation never triggers a re-render, so it cannot cause the
  // "new hasFetchedProfile value → new useCallback ref → useEffect fires"
  // loop that the useState version created.
  const fetchedRef = useRef(false);

  // ── FIX 2: No guard state in deps ─────────────────────────────────────────
  // fetchUserProfile has a stable identity across renders because its deps
  // array is empty. Calling setUser/setIsAdmin/setIsLoading does NOT recreate
  // this function, so no useEffect will re-trigger as a side-effect.
  const fetchUserProfile = useCallback(async () => {
    if (fetchedRef.current) return;   // already in-flight or done — bail out
    fetchedRef.current = true;        // claim the slot synchronously

    try {
      const profileData = await api.getProfile();
      setUser(profileData);
      setIsAdmin(profileData?.role === "admin");
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      setIsAdmin(false);
      // Allow a retry on the next explicit login() call
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []); // ← empty deps: stable reference, no loop possible

  // ── FIX 3: Single useEffect ────────────────────────────────────────────────
  // The original file had this block written TWICE, scheduling two parallel
  // profile fetches on mount. One block is enough.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchUserProfile();
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [fetchUserProfile]);
  // fetchUserProfile is stable (empty deps), so this effect runs exactly once.

  // ── FIX 4: login() resets the ref so the new token gets a fresh fetch ─────
  const login = useCallback(async (token) => {
    localStorage.setItem("token", token);
    fetchedRef.current = false;       // allow fetchUserProfile to run again
    setIsAuthenticated(true);
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    fetchedRef.current = false;       // reset so re-login works cleanly
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  }, []);

  if (isAuthenticated === null || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};