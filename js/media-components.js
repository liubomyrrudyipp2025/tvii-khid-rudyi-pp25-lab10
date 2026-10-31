// Міграція Hermes з фактичного Bolt snapshot07; оригінал збережений окремо.
// Твій Хід — ЛР10, кроки 1–4: Swiper + playback control, GLightbox, Typed.js
// Три незалежні init-функції: збій однієї не перериває інші.

document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
  initStockGallery();
  initGallery();
  initTyped();
});

// ── 1. Swiper + playback control ───────────────────────────────────────────
function initSwiper() {
  if (typeof window.Swiper === "undefined") {
    console.warn("Swiper не завантажився.");
    return;
  }

  const reviewsSection = document.getElementById("reviews");
  const toggleBtn = document.getElementById("reviewsToggle");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const isReducedMotion = () => motionQuery.matches;

  // Зберігаємо параметри; у reduced-motion вимикаємо лише початковий запуск.
  const autoplayConfig = {
    enabled: !isReducedMotion(),
    delay: 3500,
    disableOnInteraction: false,
    // Вбудована пауза Swiper обробляє лише mouse pointer.
    // syncPlayback додатково узгоджує інші причини паузи.
    pauseOnMouseEnter: true,
  };

  const swiper = new Swiper(".reviews-swiper", {
    slidesPerView: 1,
    spaceBetween: 16,
    // speed:0 у reduced-motion дає миттєву зміну без CSS-анімацій
    speed: isReducedMotion() ? 0 : 300,
    loop: true,
    autoplay: autoplayConfig,
    a11y: {
      slideRole: "article",
      prevSlideMessage: "Попередній відгук",
      nextSlideMessage: "Наступний відгук",
      firstSlideMessage: "Перший відгук",
      lastSlideMessage: "Останній відгук",
      paginationBulletMessage: "Перейти до відгуку {{index}}",
      slideLabelMessage: "{{index}} з {{slidesLength}}",
    },
    pagination: {
      el: ".reviews-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".reviews-button-next",
      prevEl: ".reviews-button-prev",
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    breakpoints: {
      320: { slidesPerView: 1, spaceBetween: 16 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 24 },
    },
  });

  // ── Стан ──
  let manualPaused = false;
  let hoverPaused = false;
  let focusPaused = false;

  // ── syncPlayback: єдина точка рішення start/stop ──
  // autoplay дозволено тільки якщо немає жодного активного інгібітора
  function syncPlayback() {
    if (!swiper.autoplay) return;

    const shouldPlay =
      !manualPaused &&
      !hoverPaused &&
      !focusPaused &&
      !isReducedMotion() &&
      document.visibilityState === "visible";

    if (shouldPlay) {
      swiper.autoplay.start();
    } else {
      swiper.autoplay.stop();
    }
  }

  // ── Видимість сторінки ──
  document.addEventListener("visibilitychange", syncPlayback);

  // ── hover (лише mouse pointer, не touch) ──
  if (reviewsSection) {
    reviewsSection.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      hoverPaused = true;
      syncPlayback();
    });
    reviewsSection.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      hoverPaused = false;
      syncPlayback();
    });

    // ── keyboard focus всередині #reviews ──
    reviewsSection.addEventListener("focusin", () => {
      focusPaused = true;
      syncPlayback();
    });
    reviewsSection.addEventListener("focusout", (e) => {
      // focusout спрацьовує до focusin наступного елемента;
      // перевіряємо, чи фокус залишився у секції
      if (!reviewsSection.contains(e.relatedTarget)) {
        focusPaused = false;
        syncPlayback();
      }
    });
  }

  // ── prefers-reduced-motion: динамічна зміна ──
  motionQuery.addEventListener("change", (e) => {
    swiper.params.speed = e.matches ? 0 : 300;
    if (e.matches) {
      // Перейшли до reduce: зупиняємо та ховаємо кнопку
      swiper.autoplay.stop();
      toggleBtn.setAttribute("hidden", "");
    } else {
      // Повернулись до no-preference: поважаємо manualPaused
      toggleBtn.removeAttribute("hidden");
      syncPlayback();
    }
  });

  // ── Кнопка #reviewsToggle ──
  // Показуємо лише після успішної ініціалізації і лише при no-reduce
  if (toggleBtn) {
    if (!isReducedMotion()) {
      toggleBtn.removeAttribute("hidden");
    }

    toggleBtn.addEventListener("click", () => {
      manualPaused = !manualPaused;
      toggleBtn.setAttribute("aria-pressed", String(manualPaused));
      toggleBtn.textContent = manualPaused
        ? "Продовжити автопрокрутку"
        : "Зупинити автопрокрутку";
      // Натискання кнопок навігації/пагінації НЕ скасовують паузу —
      // вони не торкаються manualPaused.
      syncPlayback();
    });
  }
}

// Photo carousel: manual navigation only; native buttons own Enter/Space.
function initStockGallery() {
  const section = document.querySelector(".stock-gallery");
  if (!section || typeof window.Swiper !== "function") return;
  const view = section.querySelector(".stock-swiper");
  const pages = [...section.querySelectorAll(".stock-pagination button")];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const swiper = new window.Swiper(view, {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    autoplay: false,
    speed: motion.matches ? 0 : 300,
    a11y: { slideLabelMessage: "Фото {{index}} з {{slidesLength}}" },
  });
  const sync = () =>
    pages.forEach((b, i) =>
      b.setAttribute("aria-pressed", String(i === swiper.realIndex)),
    );
  swiper.on("slideChange", sync);
  section
    .querySelector(".stock-prev")
    .addEventListener("click", () => swiper.slidePrev());
  section
    .querySelector(".stock-next")
    .addEventListener("click", () => swiper.slideNext());
  pages.forEach((b, i) => b.addEventListener("click", () => swiper.slideToLoop(i)));
  view.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation(); // Focused photo arrows must not reach the reviews keyboard module.
    e.key === "ArrowRight" ? swiper.slideNext() : swiper.slidePrev();
  });
  motion.addEventListener("change", () => {
    swiper.params.speed = motion.matches ? 0 : 300;
  });
  section.querySelector(".stock-controls").hidden = false;
  sync();
}

// ── 2. GLightbox ───────────────────────────────────────────────────────────
function initGallery() {
  const trigger = document.getElementById("heroIllustration");
  if (!trigger || typeof window.GLightbox !== "function") return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const variants = [
    ["./assets/images/lab3/hero-dark-desktop.jpg", "Настільні ігри в сутінках"],
    ["./assets/images/lab3/hero-light-desktop.jpg", "Світлий ігровий простір"],
    ["./assets/images/lab3/hero-dark-mobile.jpg", "Затишний вечір за грою"],
    ["./assets/images/hero-light-mobile.webp", "Гра у світлих барвах"],
  ];
  const lightbox = window.GLightbox({
    elements: variants.map(([href, title]) => ({
      href,
      title,
      alt: title,
      type: "image",
      description:
        "Ілюстрація до концепції сервісу настільних ігор, не фото реального закладу.",
    })),
    openEffect: reducedMotion ? "none" : "fade",
    closeEffect: reducedMotion ? "none" : "fade",
    slideEffect: reducedMotion ? "none" : "fade",
    touchNavigation: true,
    keyboardNavigation: true,
    loop: true,
    zoomable: true,
    draggable: true,
    autoplayVideos: false,
  });
  lightbox.on("open", () => {
    const modal = document.querySelector(".glightbox-container");
    if (!modal) return;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Ілюстрації ігрового вечора");
    const close = modal.querySelector(".gclose");
    close?.setAttribute("aria-label", "Закрити галерею");
    modal.querySelector(".gnext")?.setAttribute("aria-label", "Наступне зображення");
    modal.querySelector(".gprev")?.setAttribute("aria-label", "Попереднє зображення");
    close?.focus();
  });
  lightbox.on("close", () => trigger.focus());
  trigger.addEventListener("click", () => {
    const light = document.documentElement.dataset.theme === "light";
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    lightbox.openAt((mobile ? 2 : 0) + (light ? 1 : 0));
  });
  trigger.hidden = false;
}

// ── 3. Typed.js ────────────────────────────────────────────────────────────
function initTyped() {
  const textEl = document.getElementById("typed-text");
  const toggleBtn = document.getElementById("typingToggle");

  if (!textEl || !toggleBtn) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (motionQuery.matches) {
    return;
  }

  if (typeof window.Typed === "undefined") {
    console.warn("Typed.js не завантажився — збережено статичний fallback.");
    return;
  }

  // Typed 2.0.12 caches initial content and replays it at every loop's begin().
  // Keep the HTML fallback, but let the real constructor cache an empty string.
  const fallback = textEl.textContent;
  const strings = ["дружніх зустрічей", "сімейних вечорів", "нових знайомств"];
  // Overlaid full lines reserve the actual font/wrap footprint, including cursor.
  // Keep the live prefix and Typed target together; never measure a partial phrase.
  const paragraph = textEl.parentElement;
  const prefix = textEl.previousSibling?.textContent || "";
  const line = document.createElement("span");
  line.className = "typed-line";
  line.append(...paragraph.childNodes);
  paragraph.append(line);
  strings.forEach((phrase) => {
    const reserve = document.createElement("span");
    reserve.className = "typed-reserve";
    reserve.setAttribute("aria-hidden", "true");
    reserve.textContent = `${prefix}${phrase}|`;
    paragraph.append(reserve);
  });
  let typedInstance;
  try {
    textEl.textContent = "";
    typedInstance = new window.Typed("#typed-text", {
      strings,
      typeSpeed: 45,
      backSpeed: 25,
      backDelay: 1400,
      loop: true,
      showCursor: true,
      contentType: null,
    });
  } catch {
    textEl.textContent = fallback;
    textEl.parentElement.querySelector(".typed-cursor")?.remove();
    console.warn("Typed.js недоступний — збережено статичний fallback.");
    return;
  }

  let isPaused = false;
  toggleBtn.removeAttribute("hidden");

  toggleBtn.addEventListener("click", () => {
    if (isPaused) {
      typedInstance.start();
      isPaused = false;
      toggleBtn.setAttribute("aria-pressed", "false");
      toggleBtn.textContent = "Зупинити анімацію тексту";
    } else {
      typedInstance.stop();
      isPaused = true;
      toggleBtn.setAttribute("aria-pressed", "true");
      toggleBtn.textContent = "Продовжити анімацію тексту";
    }
  });

  motionQuery.addEventListener("change", (e) => {
    if (!e.matches) return;

    typedInstance?.destroy(); // Повторний reduce уже міг знищити екземпляр.
    typedInstance = null;

    const cursor = document.querySelector(".typed-cursor");
    cursor?.remove();

    textEl.textContent = "дружніх зустрічей";
    toggleBtn.setAttribute("hidden", "");
    toggleBtn.setAttribute("aria-pressed", "false");
    toggleBtn.textContent = "Зупинити анімацію тексту";
    isPaused = false;
  });
}
