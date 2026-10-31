/* Apply the only stored preference before styles/first paint. No form storage. */
(() => {
  "use strict";
  const root = document.documentElement;
  let theme = "dark";
  try {
    if (localStorage.getItem("tvii-khid-theme") === "light") theme = "light";
  } catch {
    // Storage can be unavailable; the in-memory switch still works.
  }
  root.dataset.theme = theme;
  const apply = () => {
    const light = root.dataset.theme === "light";
    const button = document.getElementById("themeToggle");
    button?.setAttribute("aria-pressed", String(light));
    const logo = document.querySelector("[data-brand-logo]");
    if (logo)
      logo.src = light ? "./assets/images/logo-light.svg" : "./assets/images/logo.svg";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", light ? "#FAF8F5" : "#0B132B");
  };
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.getElementById("themeToggle")?.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem("tvii-khid-theme", root.dataset.theme);
      } catch {
        // Preference is optional; never persist any other user input.
      }
      apply();
      document.dispatchEvent(new CustomEvent("themechange"));
    });
    // A mobile menu must not remain over the destination after navigation.
    document.querySelectorAll("header details nav a").forEach((link) => {
      link.addEventListener("click", () =>
        link.closest("details").removeAttribute("open"),
      );
    });
  });
})();
