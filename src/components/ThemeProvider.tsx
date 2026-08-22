import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light" | "system" | "skull";
type ResolvedTheme = "dark" | "light";
const STORAGE_KEY = "theme";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "skull") return storedTheme;
    return "light";
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme === "skull" ? "light" : theme;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");

    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const applyTheme = (next: Theme) => {
    const root = document.documentElement;
    root.classList.add("theme-crossfade");
    window.setTimeout(() => root.classList.remove("theme-crossfade"), 700);
    const start = (document as Document & {
      startViewTransition?: (cb: () => void) => void;
    }).startViewTransition;
    if (typeof start === "function") {
      start.call(document, () => setTheme(next));
      return;
    }
    setTheme(next);
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    const root = document.documentElement;

    root.classList.toggle("skull", theme === "skull");
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.dataset.themePreference = theme;
    root.style.colorScheme = resolvedTheme;
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
