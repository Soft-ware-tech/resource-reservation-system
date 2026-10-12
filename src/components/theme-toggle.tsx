"use client";

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("resource-reservation-theme", nextTheme);
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="icon-button"
      onClick={toggleTheme}
      title="Toggle color theme"
      type="button"
    >
      <span aria-hidden="true" className="theme-icon theme-sun">☼</span>
      <span aria-hidden="true" className="theme-icon theme-moon">☾</span>
    </button>
  );
}
