/* User-selected decorative Hero; real portrait/landscape assets, never autoplay. */
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
  const update = (mode, message = "") => {
    hero.dataset.heroMode = mode;
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.heroChoice === mode)),
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
    update("photo", message);
  };
  const animate = async () => {
    desired = "video";
    const currentAttempt = ++attempt;
    video.muted = true;
    video.hidden = false;
    const src = phone.matches ? video.dataset.srcMobile : video.dataset.src;
    video.poster = phone.matches ? video.dataset.posterMobile : video.dataset.poster;
    if (video.getAttribute("src") !== src) {
      video.pause();
      video.src = src;
      video.load();
    }
    // A breakpoint can change while the user is in the footer or another tab.
    // Select the new source, but leave decoding paused until visibility resumes.
    if (document.hidden || !inView) {
      update("video");
      return;
    }
    try {
      await video.play();
      if (currentAttempt !== attempt) return;
      if (desired !== "video") {
        video.pause();
        return;
      }
      update("video");
    } catch {
      if (currentAttempt === attempt && desired === "video")
        photo("Відео недоступне. Залишено статичний фон.");
    }
  };
  controls.forEach((c) => {
    c.hidden = false;
  });
  buttons.forEach((b) =>
    b.addEventListener("click", () =>
      b.dataset.heroChoice === "video" ? animate() : photo(),
    ),
  );
  phone.addEventListener("change", () => {
    if (desired === "video") animate();
  });
  video.addEventListener("error", () => {
    if (desired === "video" && video.error)
      photo("Відео недоступне. Залишено статичний фон.");
  });
  const visibility = () => {
    if (desired !== "video") return;
    if (document.hidden || !inView) video.pause();
    else {
      const currentAttempt = attempt;
      video.play().catch(() => {
        if (currentAttempt === attempt && desired === "video")
          photo("Відео призупинено. Можна знову вибрати «Відео».");
      });
    }
  };
  document.addEventListener("visibilitychange", visibility);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      visibility();
    }).observe(hero);
  }
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", (e) => {
      if (e.matches) photo();
    });
  photo();
})();
