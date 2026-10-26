/* Ephemeral educational interaction only: no checkout, backend or persistence. */
(() => {
  "use strict";
  const selected = new Set();
  const cards = Array.from(document.querySelectorAll("[data-demo-card]"));
  const buttons = Array.from(document.querySelectorAll("button[data-demo-add]"));
  const badges = document.querySelectorAll("[data-cart-count]");
  const status = document.querySelector("[data-demo-status]");
  const search = document.querySelector("[data-demo-search]");
  const originalLabels = new Map(
    buttons.map((button) => [button, button.textContent.trim()]),
  );
  const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("uk").trim();
  const renderSelection = () => {
    badges.forEach((badge) => {
      badge.textContent = String(selected.size);
    });
    buttons.forEach((button) => {
      const pressed = selected.has(button.dataset.demoAdd);
      button.setAttribute("aria-pressed", String(pressed));
      button.textContent = pressed
        ? "Прибрати з демо-кошика"
        : originalLabels.get(button);
    });
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.demoAdd;
      if (!cards.some((card) => card.dataset.demoCard === id)) return;
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      renderSelection();
    });
  });
  if (search) {
    const filter = () => {
      const query = normalize(search.value);
      let visible = 0;
      cards.forEach((card) => {
        card.hidden = !normalize(card.dataset.demoTitle || "").includes(query);
        if (!card.hidden) visible += 1;
      });
      if (status) status.hidden = visible > 0;
    };
    search.addEventListener("input", filter);
    filter();
  }
  renderSelection();

  // Native details/summary owns opening, keyboard activation and open state.
  // JS only enhances dismissal; links/disclosures still work when JS is absent.
  const disclosures = Array.from(
    document.querySelectorAll("details[data-mobile-menu], details[data-service-menu]"),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = disclosures.filter((details) => details.open);
    if (!open.length) return;
    const active =
      open.find((details) => details.contains(document.activeElement)) || open.at(-1);
    open.forEach((details) => {
      details.open = false;
    });
    active.querySelector("summary")?.focus();
  });
  document.addEventListener("click", (event) => {
    disclosures.forEach((details) => {
      if (!details.open) return;
      if (!details.contains(event.target) || event.target.closest("a[href]"))
        details.open = false;
    });
  });
})();
