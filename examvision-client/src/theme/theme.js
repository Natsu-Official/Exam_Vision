export const DEFAULT_THEME = {
  bg: "#0b1220",
  fg: "#e5e7eb",
};

export function loadTheme() {
  try {
    const raw = localStorage.getItem("examvision_theme");
    if (!raw) return DEFAULT_THEME;
    const t = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...t };
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme) {
  document.documentElement.style.setProperty("--ev-bg", theme.bg);
  document.documentElement.style.setProperty("--ev-fg", theme.fg);
  localStorage.setItem("examvision_theme", JSON.stringify(theme));
}