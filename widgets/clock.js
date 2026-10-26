(() => {
  const timeElement = document.getElementById("Lviv_z713");
  if (!timeElement) {
    return;
  }

  let settled = false;
  let timeoutId;
  let pollId;

  const showUnavailable = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeoutId);
    window.clearInterval(pollId);
    timeElement.classList.remove("text-4xl");
    timeElement.setAttribute("aria-live", "polite");
    timeElement.setAttribute("role", "status");
    timeElement.textContent = "Сервіс часу тимчасово недоступний";
  };

  const localFormatter = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const checkForTime = () => {
    if (settled) return;
    const provider = window.time_is_widget;
    // tD is the provider's measured client-minus-server epoch difference.
    // No locally invented fallback time: wait for real server synchronization.
    if (!provider || !Number.isFinite(provider.tD)) return;
    const render = () => {
      if (!Number.isFinite(provider.tD)) return;
      const serverEpoch = Date.now() - provider.tD;
      timeElement.textContent = localFormatter.format(new Date(serverEpoch));
    };
    settled = true;
    window.clearTimeout(timeoutId);
    window.clearInterval(pollId);
    render();
    window.setInterval(render, 1000);
  };

  timeoutId = window.setTimeout(showUnavailable, 15000);
  pollId = window.setInterval(checkForTime, 100);

  const providerScript = document.createElement("script");
  providerScript.src = "https://widget.time.is/t.js";
  providerScript.async = true;
  providerScript.onload = () => {
    if (settled) return;
    try {
      if (!window.time_is_widget || typeof window.time_is_widget.init !== "function") {
        showUnavailable();
        return;
      }
      // Use the provider's UTC synchronization; format that real epoch for Lviv.
      // Empty contents prevents its default UTC markup from racing our renderer.
      window.time_is_widget.init({ Lviv_z713: { contents: "" } });
      checkForTime();
    } catch {
      showUnavailable();
    }
  };
  providerScript.onerror = showUnavailable;
  document.head.appendChild(providerScript);
})();
