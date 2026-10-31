/* User-selected decorative Hero. Photo first; no video request before opt-in. */
(() => {
  "use strict";
  const hero = document.querySelector("[data-hero-scene]");
  if (!hero) return;
  const video = hero.querySelector("[data-hero-video]");
  const controls = [...hero.querySelectorAll("[data-hero-controls]")];
  const buttons = [...hero.querySelectorAll("button[data-hero-choice]")];
  const statuses = [...hero.querySelectorAll("[data-hero-status]")];
  const phone = window.matchMedia("(max-width: 767px)");
  let desired = "photo";
  let inView = true;
  let attempt = 0;
  const canPlay = () => desired === "video" && !document.hidden && inView;
  const update = (message = "") => {
    hero.dataset.heroMode = desired;
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.heroChoice === desired)),
    );
    statuses.forEach((s) => {
      s.textContent = message;
    });
  };
  const photo = (message = "") => {
    desired = "photo";
    attempt += 1;
    video.pause();
    video.hidden = true;
    update(message);
  };
  const sync = async () => {
    const currentAttempt = ++attempt;
    if (desired !== "video") return;
    const light = document.documentElement.dataset.theme === "light";
    const src = light
      ? phone.matches
        ? video.dataset.srcLightMobile
        : video.dataset.srcLight
      : phone.matches
        ? video.dataset.srcMobile
        : video.dataset.src;
    video.poster = light
      ? phone.matches
        ? video.dataset.posterLightMobile
        : video.dataset.posterLight
      : phone.matches
        ? video.dataset.posterMobile
        : video.dataset.poster;
    video.muted = true;
    video.hidden = false;
    if (video.getAttribute("src") !== src) {
      video.pause();
      video.src = src;
      video.load();
    }
    update();
    if (!canPlay()) {
      video.pause();
      return;
    }
    try {
      await video.play();
      // A pending play may resolve after photo/offscreen/visibility changes.
      // Never stop a newer valid video request because an older one completed.
      if (!canPlay()) video.pause();
      if (currentAttempt !== attempt) return;
    } catch {
      if (currentAttempt === attempt && canPlay())
        photo("Відео недоступне. Залишено статичний фон.");
    }
  };
  controls.forEach((c) => {
    c.hidden = false;
  });
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.heroChoice === "photo") photo();
      else {
        desired = "video";
        sync();
      }
    }),
  );
  phone.addEventListener("change", sync);
  document.addEventListener("themechange", sync);
  document.addEventListener("visibilitychange", sync);
  video.addEventListener("error", () => {
    if (desired === "video" && video.error)
      photo("Відео недоступне. Залишено статичний фон.");
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }).observe(hero);
  }
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", (e) => {
      if (e.matches) photo();
    });
  photo();
})();
