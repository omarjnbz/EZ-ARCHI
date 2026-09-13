"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type Theme = "light" | "dark";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "ez-archi-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Sync from whatever the blocking inline script (see layout.tsx head) already
  // applied to <html class="dark">, so React's first render matches the DOM.
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // storage unavailable — theme just won't persist across reloads
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/** Runs synchronously before paint (inlined in <head>) to avoid a flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("${STORAGE_KEY}");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;
