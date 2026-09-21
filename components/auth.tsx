"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthCtx = createContext<{
  loggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}>({ loggedIn: false, login: () => false, logout: () => {} });

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLoggedIn(localStorage.getItem("kd_auth") === "1"); } catch {}
    setReady(true);
  }, []);

  const login = (email: string, pass: string) => {
    if (email === "kariadiamond@gmail.com" && pass === "KariaDiamond") {
      localStorage.setItem("kd_auth", "1");
      setLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("kd_auth");
    setLoggedIn(false);
  };

  if (!ready) return null;

  return (
    <AuthCtx.Provider value={{ loggedIn, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
