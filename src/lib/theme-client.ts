import {
  resolveThemeClass,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

export function applyThemeMode(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    resolveThemeClass(theme, prefersDark) === "dark"
  );
}

export function cacheThemeMode(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeMode(theme);
  window.dispatchEvent(new Event("actual-reports-theme-change"));
}

export function readCachedThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "light";
}

export function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

export function subscribeToCachedTheme(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("actual-reports-theme-change", onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("actual-reports-theme-change", onChange);
    media.removeEventListener("change", onChange);
  };
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
