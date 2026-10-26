// Міграція Hermes з фактичного Bolt snapshot07; оригінал збережений окремо.
// Твій Хід — ЛР10, кроки 1–4: Swiper + playback control, GLightbox, Typed.js
// Три незалежні init-функції: збій однієї не перериває інші.

document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
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

// ── 2. GLightbox ───────────────────────────────────────────────────────────
function initGallery() {
  if (typeof window.GLightbox !== "function") {
    console.warn("GLightbox не завантажився — залишено звичайні посилання.");
    return;
  }

  let lastTrigger = null;
  document.querySelectorAll(".lab3-gallery-item").forEach((link) => {
    const image = link.querySelector("img");
    if (image?.alt) link.dataset.alt = image.alt;
    link.addEventListener(
      "click",
      () => {
        lastTrigger = link;
      },
      true,
    );
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lightbox = window.GLightbox({
    selector: ".lab3-gallery-item",
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
    modal.setAttribute("aria-label", "Галерея графіки ЛР3");
    modal.querySelector(".gclose")?.setAttribute("aria-label", "Закрити галерею");
    modal.querySelector(".gnext")?.setAttribute("aria-label", "Наступне зображення");
    modal.querySelector(".gprev")?.setAttribute("aria-label", "Попереднє зображення");
  });

  lightbox.on("close", () => {
    lastTrigger?.focus();
  });
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

  let typedInstance = new window.Typed("#typed-text", {
    strings: ["дружніх зустрічей", "сімейних вечорів", "нових знайомств"],
    typeSpeed: 45,
    backSpeed: 25,
    backDelay: 1400,
    loop: true,
    showCursor: true,
    contentType: null,
  });

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
