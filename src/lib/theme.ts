export const THEME_MODES = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_STORAGE_KEY = "actual-reports-theme";

export function isThemeMode(
  value: string | null | undefined
): value is ThemeMode {
  return value != null && THEME_MODES.includes(value as ThemeMode);
}

export function resolveThemeClass(
  theme: ThemeMode,
  prefersDark: boolean
): "light" | "dark" {
  if (theme === "dark") {
    return "dark";
  }
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }
  return "light";
}

export function themeModeLabel(theme: ThemeMode): string {
  switch (theme) {
    case "dark":
      return "Dark";
    case "system":
      return "System";
    default:
      return "Light";
  }
}
