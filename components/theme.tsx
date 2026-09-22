"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({
  dark: false,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kd_theme");
      if (saved === "dark") {
        setDark(true);
        document.documentElement.classList.add("dark");
      }
    } catch {}
    setReady(true);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("kd_theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  if (!ready) return null;

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}
