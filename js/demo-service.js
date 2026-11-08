/* Browser-local demonstration only: no passwords, payments or remote requests. */
(() => {
  "use strict";
  const KEY = "tvii-khid-demo-service-v1";
  const games = [
    {
      name: "Острів стратегів",
      image: "assets/images/game-demo-1.svg",
      description: "Вигадана навчальна гра про спільну експедицію та планування ходів.",
    },
    {
      name: "Кодові пригоди",
      image: "assets/images/game-demo-2.svg",
      description:
        "Вигадана навчальна гра про асоціації, підказки й командне спілкування.",
    },
    {
      name: "Вечір відкриттів",
      image: "assets/images/game-demo-3.svg",
      description: "Вигадана навчальна гра з простими завданнями для дружнього вечора.",
    },
  ];
  const plans = {
    standard: "Стандартний демо-бокс",
    family: "Сімейний демо-бокс",
    company: "Демо-бокс для компанії",
  };
  const blank = () => ({ version: 1, profiles: [], active: null });
  let data = blank();
  let persistent = true;
  const nickname = (value) => String(value).normalize("NFKC").trim();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || raw.version !== 1 || !Array.isArray(raw.profiles)) return blank();
      const profiles = raw.profiles
        .filter(
          (p) =>
            p &&
            typeof p.id === "string" &&
            /^[a-z0-9-]{1,80}$/i.test(p.id) &&
            typeof p.name === "string" &&
            nickname(p.name).length >= 2 &&
            p.name.length <= 40,
        )
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          name: nickname(p.name),
          subscription:
            p.subscription &&
            Object.hasOwn(plans, p.subscription.plan) &&
            ["active", "paused", "cancelled"].includes(p.subscription.status)
              ? {
                  plan: p.subscription.plan,
                  status: p.subscription.status,
                  game:
                    Number.isInteger(p.subscription.game) &&
                    p.subscription.game >= 0 &&
                    p.subscription.game < games.length
                      ? p.subscription.game
                      : 0,
                  skip: p.subscription.skip === true,
                }
              : null,
        }));
      return {
        version: 1,
        profiles,
        active: profiles.some((p) => p.id === raw.active) ? raw.active : null,
      };
    } catch {
      persistent = false;
      return blank();
    }
  }
  data = load();
  const current = () => data.profiles.find((p) => p.id === data.active) || null;
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      persistent = false;
    }
  }
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  function message(text) {
    all("[data-service-message]").forEach((e) => {
      e.textContent = text;
    });
  }
  function render() {
    const user = current();
    all("[data-account-link]").forEach((e) => {
      e.textContent = user ? "Кабінет: " + user.name : "Увійти / реєстрація";
    });
    all("[data-guest-only]").forEach((e) => {
      e.hidden = !!user;
    });
    all("[data-member-only]").forEach((e) => {
      e.hidden = !user;
    });
    all("[data-profile-name]").forEach((e) => {
      e.textContent = user?.name || "Гість";
    });
    all("[data-storage-warning]").forEach((e) => {
      e.hidden = persistent;
    });
    const select = $("[data-profile-select]");
    if (select) {
      const previous = select.value;
      select.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Оберіть локальний профіль";
      select.append(placeholder);
      data.profiles.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.append(option);
      });
      if (data.profiles.some((p) => p.id === previous)) select.value = previous;
      $("[data-login-button]").disabled = data.profiles.length === 0;
    }
    const sub = user?.subscription;
    const live = sub && sub.status !== "cancelled";
    const labels = {
      active: "Активна демо-підписка",
      paused: "Демо-підписку призупинено",
      cancelled: "Демо-підписку скасовано",
    };
    all("[data-subscription-status]").forEach((e) => {
      e.textContent = !user
        ? "Увійдіть або створіть локальний демо-профіль."
        : sub
          ? labels[sub.status]
          : "У вас ще немає демо-підписки.";
    });
    all("[data-enroll-panel]").forEach((e) => {
      e.hidden = !!live;
    });
    all("[data-subscription-controls]").forEach((e) => {
      e.hidden = !live;
    });
    all("[data-subscription-plan]").forEach((e) => {
      e.textContent = sub ? plans[sub.plan] : "—";
    });
    all("[data-subscription-game]").forEach((e) => {
      e.textContent = sub ? games[sub.game].name : "—";
    });
    all("[data-next-delivery]").forEach((e) => {
      e.textContent = !sub
        ? "—"
        : sub.status === "paused"
          ? "На паузі — доставки немає"
          : sub.status === "cancelled"
            ? "Скасовано — доставки немає"
            : sub.skip
              ? "Наступний демо-бокс пропущено"
              : "Наступний демо-бокс заплановано (без справжньої доставки)";
    });
    const pause = $("[data-sub-pause]");
    if (pause)
      pause.textContent =
        sub?.status === "paused"
          ? "Відновити демо-підписку"
          : "Призупинити демо-підписку";
    const skip = $("[data-sub-skip]");
    if (skip) {
      skip.textContent = sub?.skip
        ? "Повернути наступний демо-бокс"
        : "Пропустити наступний демо-бокс";
      skip.disabled = sub?.status !== "active";
    }
    const replace = $("[data-sub-replace]");
    if (replace) replace.disabled = sub?.status !== "active";
    all("[data-enroll-button]").forEach((e) => {
      e.disabled = !user;
    });
  }
  $("[data-register-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("[data-register-name]");
    const name = nickname(input.value);
    if (name.length < 2 || name.length > 40) {
      message("Введіть псевдонім від 2 до 40 символів.");
      input.focus();
      return;
    }
    if (
      data.profiles.some(
        (p) => p.name.toLocaleLowerCase("uk") === name.toLocaleLowerCase("uk"),
      )
    ) {
      message("Такий локальний профіль уже є. Оберіть його у формі входу.");
      return;
    }
    if (data.profiles.length >= 10) {
      message(
        "Досягнуто ліміту 10 демо-профілів. Можна очистити тільки демо-дані нижче.",
      );
      return;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ||
      "demo-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
    data.profiles.push({ id, name, subscription: null });
    data.active = id;
    persist();
    input.value = "";
    render();
    message("Демо-профіль створено. Ви увійшли локально, без пароля.");
    $("[data-profile-heading]")?.focus();
  });
  $("[data-login-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("[data-profile-select]").value;
    if (!data.profiles.some((p) => p.id === id)) {
      message("Спочатку оберіть існуючий профіль.");
      return;
    }
    data.active = id;
    persist();
    render();
    message("Ви увійшли в локальний демо-профіль.");
    $("[data-profile-heading]")?.focus();
  });
  $("[data-logout]")?.addEventListener("click", () => {
    data.active = null;
    persist();
    render();
    message("Ви вийшли. Демо-профіль залишився тільки в цьому браузері.");
  });
  $("[data-clear-demo]")?.addEventListener("click", () => {
    $("[data-clear-confirm]").hidden = false;
  });
  $("[data-clear-no]")?.addEventListener("click", () => {
    $("[data-clear-confirm]").hidden = true;
  });
  $("[data-clear-yes]")?.addEventListener("click", () => {
    data = blank();
    try {
      localStorage.removeItem(KEY);
    } catch {
      persistent = false;
    }
    $("[data-clear-confirm]").hidden = true;
    render();
    message(
      "Локальні демо-профілі й підписки видалено. Тему та інші дані сайту не змінено.",
    );
  });
  $("[data-enroll-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = current();
    const plan = $("[data-plan-select]").value;
    if (!user || !Object.hasOwn(plans, plan)) {
      message("Для демо-оформлення спочатку увійдіть.");
      return;
    }
    user.subscription = { plan, status: "active", game: 0, skip: false };
    persist();
    render();
    message("Демо-підписку оформлено локально. Оплати й справжньої доставки немає.");
  });
  function changeSubscription(action) {
    const sub = current()?.subscription;
    if (!sub || sub.status === "cancelled") return;
    if (action === "pause") sub.status = sub.status === "paused" ? "active" : "paused";
    else if (action === "cancel") sub.status = "cancelled";
    else if (sub.status !== "active") return;
    else if (action === "skip") sub.skip = !sub.skip;
    else if (action === "replace") sub.game = (sub.game + 1) % games.length;
    persist();
    render();
    message("Зміни демо-підписки збережено тільки в цьому браузері.");
  }
  for (const action of ["pause", "cancel", "skip", "replace"])
    $("[data-sub-" + action + "]")?.addEventListener("click", () =>
      changeSubscription(action),
    );
  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) {
      data = load();
      render();
    }
  });

  const quiz = $("[data-full-quiz]");
  if (quiz) {
    const steps = [...quiz.querySelectorAll("[data-quiz-step]")];
    const result = quiz.querySelector("[data-quiz-result]");
    const next = quiz.querySelector("[data-quiz-next]");
    const back = quiz.querySelector("[data-quiz-back]");
    const error = quiz.querySelector("[data-quiz-error]");
    let step = 0;
    const show = (focus) => {
      steps.forEach((e, i) => {
        e.hidden = i !== step;
        e.disabled = i !== step;
      });
      quiz.querySelector("[data-quiz-progress]").textContent =
        "Питання " + (step + 1) + " із 5";
      back.disabled = step === 0;
      next.textContent = step === 4 ? "Показати гру" : "Далі";
      error.textContent = "";
      if (focus) steps[step].querySelector("legend").focus();
    };
    quiz.addEventListener("submit", (event) => {
      event.preventDefault();
      const chosen = steps[step].querySelector("input:checked");
      if (!chosen) {
        error.textContent = "Оберіть одну відповідь, щоб продовжити.";
        steps[step].querySelector("input").focus();
        return;
      }
      if (step < 4) {
        step += 1;
        show(true);
        return;
      }
      const random = globalThis.crypto?.getRandomValues
        ? crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
        : Math.random();
      const game = games[Math.floor(random * games.length)];
      quiz.querySelector("[data-quiz-game]").textContent = game.name;
      quiz.querySelector("[data-quiz-description]").textContent = game.description;
      const image = quiz.querySelector("[data-quiz-image]");
      image.src = game.image;
      image.alt = "Умовна ілюстрація: " + game.name;
      const list = quiz.querySelector("[data-quiz-answers]");
      list.replaceChildren();
      steps.forEach((field) => {
        const li = document.createElement("li");
        li.textContent =
          field.querySelector("legend").textContent +
          " — " +
          field.querySelector("input:checked").parentElement.textContent.trim();
        list.append(li);
      });
      quiz.querySelector("[data-quiz-fields]").hidden = true;
      result.hidden = false;
      render();
      quiz.querySelector("[data-quiz-result-title]").focus();
    });
    back.addEventListener("click", () => {
      if (step > 0) {
        step -= 1;
        show(true);
      }
    });
    quiz.querySelector("[data-quiz-restart]").addEventListener("click", () => {
      quiz.reset();
      step = 0;
      result.hidden = true;
      quiz.querySelector("[data-quiz-fields]").hidden = false;
      show(true);
    });
    show(false);
  }
  const header = document.querySelector("body > header");
  if (header) {
    const measure = () =>
      document.documentElement.style.setProperty(
        "--site-header-height",
        Math.ceil(header.getBoundingClientRect().height) + "px",
      );
    measure();
    if (globalThis.ResizeObserver) new ResizeObserver(measure).observe(header);
    else window.addEventListener("resize", measure);
  }
  render();
})();
