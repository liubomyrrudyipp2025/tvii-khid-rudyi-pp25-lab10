(function () {
  "use strict";

  function calculatePlan(raw) {
    const errors = {};

    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return {
        ok: false,
        errors: {
          players: "Введіть ціле число учасників від 2 до 12.",
          minutes: "Введіть ціле число хвилин від 15 до 240.",
          duration: "Оберіть тривалість партії зі списку.",
          breaks: "Оберіть, чи враховувати перерви.",
        },
      };
    }

    function parseBoundedInteger(value, min, max) {
      if (typeof value !== "string") {
        return null;
      }

      const normalized = value.trim();

      if (
        normalized.length === 0 ||
        normalized.length > 3 ||
        !/^[0-9]+$/.test(normalized)
      ) {
        return null;
      }

      const number = Number(normalized);

      if (
        !Number.isFinite(number) ||
        !Number.isInteger(number) ||
        number < min ||
        number > max
      ) {
        return null;
      }

      return number;
    }

    const players = parseBoundedInteger(raw.players, 2, 12);
    if (players === null) {
      errors.players = "Введіть ціле число учасників від 2 до 12.";
    }

    const minutes = parseBoundedInteger(raw.minutes, 15, 240);
    if (minutes === null) {
      errors.minutes = "Введіть ціле число хвилин від 15 до 240.";
    }

    const allowedDurations = ["15", "30", "45", "60"];
    if (typeof raw.duration !== "string" || !allowedDurations.includes(raw.duration)) {
      errors.duration = "Оберіть тривалість партії зі списку.";
    }

    if (typeof raw.breaks !== "boolean") {
      errors.breaks = "Оберіть, чи враховувати перерви.";
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors: errors };
    }

    // Групи мають збалансований розмір; раунди проходять паралельно.
    const duration = Number(raw.duration);
    const breakMinutes = raw.breaks ? 5 : 0;
    const groupCount = Math.ceil(players / 4);
    const baseGroupSize = Math.floor(players / groupCount);
    const largerGroupCount = players % groupCount;
    const groups = [];

    for (let index = 0; index < groupCount; index += 1) {
      groups.push(baseGroupSize + (index < largerGroupCount ? 1 : 0));
    }

    const rounds = Math.floor((minutes + breakMinutes) / (duration + breakMinutes));
    const used = rounds === 0 ? 0 : rounds * duration + (rounds - 1) * breakMinutes;

    return {
      ok: true,
      errors: {},
      rounds: rounds,
      groups: groups,
      games: rounds * groupCount,
      used: used,
      free: minutes - used,
    };
  }

  if (typeof module === "object" && module !== null && module.exports) {
    module.exports = { calculatePlan: calculatePlan };
  }

  if (
    typeof document === "undefined" ||
    document === null ||
    typeof document.querySelectorAll !== "function"
  ) {
    return;
  }

  function collectLocalElements(root, selector) {
    return Array.from(root.querySelectorAll(selector)).filter(function (node) {
      return node.closest("[data-evening-planner]") === root;
    });
  }

  function allocateUniqueId(preferred, usedIds) {
    let candidate = preferred;
    let suffix = 2;

    while (usedIds.has(candidate)) {
      candidate = preferred + "-" + suffix;
      suffix += 1;
    }

    usedIds.add(candidate);
    return candidate;
  }

  function normalizePlannerIds(roots) {
    const usedIds = new Set();

    Array.from(document.querySelectorAll("[id]")).forEach(function (element) {
      const owner = element.closest("[data-evening-planner]");

      if (!owner || !roots.includes(owner)) {
        usedIds.add(element.id);
      }
    });

    roots.forEach(function (root, rootIndex) {
      const rootBase =
        rootIndex === 0 ? "evening-planner" : "evening-planner-" + (rootIndex + 1);
      const rootId = allocateUniqueId(rootBase, usedIds);
      const idMap = new Map();

      if (root.hasAttribute("id")) {
        idMap.set(root.id, rootId);
      }
      root.id = rootId;

      const idElements = collectLocalElements(root, "[id]");
      idElements.forEach(function (element, elementIndex) {
        const oldId = element.id;
        let logicalId = oldId;

        if (rootIndex > 0) {
          logicalId = logicalId.replace(/^evening-planner-\d+-/, "");
        }

        if (!logicalId) {
          logicalId = "element-" + (elementIndex + 1);
        }

        const preferredId = rootIndex === 0 ? logicalId : rootId + "-" + logicalId;
        const newId = allocateUniqueId(preferredId, usedIds);

        if (!idMap.has(oldId)) {
          idMap.set(oldId, newId);
        }

        element.id = newId;
      });

      const referenceElements = [];
      if (
        root.hasAttribute("for") ||
        root.hasAttribute("aria-labelledby") ||
        root.hasAttribute("aria-describedby")
      ) {
        referenceElements.push(root);
      }
      referenceElements.push.apply(
        referenceElements,
        collectLocalElements(root, "[for], [aria-labelledby], [aria-describedby]"),
      );

      referenceElements.forEach(function (element) {
        if (element.hasAttribute("for")) {
          const oldReference = element.getAttribute("for");
          if (idMap.has(oldReference)) {
            element.setAttribute("for", idMap.get(oldReference));
          }
        }

        ["aria-labelledby", "aria-describedby"].forEach(function (attribute) {
          if (!element.hasAttribute(attribute)) {
            return;
          }

          const references = element
            .getAttribute(attribute)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(function (reference) {
              return idMap.get(reference) || reference;
            });

          element.setAttribute(attribute, references.join(" "));
        });
      });
    });
  }

  function findLocal(root, selector) {
    const matches = collectLocalElements(root, selector);
    return matches.length > 0 ? matches[0] : null;
  }

  function isTag(element, tagName) {
    return Boolean(element && element.tagName === tagName);
  }

  function getPlannerNodes(root) {
    const form = findLocal(root, "form[data-planner-form]");
    const fieldset = findLocal(root, "fieldset[data-planner-fields]");
    const legend = fieldset ? fieldset.querySelector("legend") : null;
    const players = findLocal(root, '[data-field="players"]');
    const minutes = findLocal(root, '[data-field="minutes"]');
    const duration = findLocal(root, '[data-field="duration"]');
    const breaks = findLocal(root, '[data-field="breaks"]');
    const reset = findLocal(root, "[data-planner-reset]");
    const fallback = findLocal(root, "[data-planner-fallback]");
    const results = findLocal(root, "[data-planner-results]");
    const groupDetail = findLocal(root, "[data-group-detail]");
    const zeroMessage = findLocal(root, "[data-zero-message]");
    const invalidMessage = findLocal(root, "[data-planner-invalid]");
    const status = findLocal(root, "[data-planner-status]");

    const fields = {
      players: players,
      minutes: minutes,
      duration: duration,
      breaks: breaks,
    };
    const help = {};
    const error = {};
    const outputs = {};

    ["players", "minutes", "duration", "breaks"].forEach(function (name) {
      help[name] = findLocal(root, '[data-help="' + name + '"]');
      error[name] = findLocal(root, '[data-error="' + name + '"]');
    });

    ["rounds", "groups", "games", "used", "free"].forEach(function (name) {
      outputs[name] = findLocal(root, 'output[data-result="' + name + '"]');
    });

    const requiredNodes = [
      form,
      fieldset,
      legend,
      players,
      minutes,
      duration,
      breaks,
      reset,
      fallback,
      results,
      groupDetail,
      zeroMessage,
      invalidMessage,
      status,
      help.players,
      help.minutes,
      help.duration,
      help.breaks,
      error.players,
      error.minutes,
      error.duration,
      error.breaks,
      outputs.rounds,
      outputs.groups,
      outputs.games,
      outputs.used,
      outputs.free,
    ];

    if (
      requiredNodes.some(function (node) {
        return !node;
      }) ||
      !isTag(form, "FORM") ||
      !isTag(fieldset, "FIELDSET") ||
      !isTag(legend, "LEGEND") ||
      !isTag(players, "INPUT") ||
      !isTag(minutes, "INPUT") ||
      !isTag(duration, "SELECT") ||
      !isTag(breaks, "INPUT") ||
      !isTag(reset, "BUTTON") ||
      players.getAttribute("type") !== "number" ||
      minutes.getAttribute("type") !== "number" ||
      breaks.getAttribute("type") !== "checkbox" ||
      reset.getAttribute("type") !== "button"
    ) {
      return null;
    }

    const eventNodes = [form, players, minutes, duration, breaks, reset];
    if (
      eventNodes.some(function (node) {
        return typeof node.addEventListener !== "function";
      }) ||
      [players, minutes, duration, breaks].some(function (field) {
        return (
          !field.classList ||
          typeof field.classList.add !== "function" ||
          typeof field.classList.remove !== "function"
        );
      })
    ) {
      return null;
    }

    return {
      form: form,
      fieldset: fieldset,
      legend: legend,
      fields: fields,
      reset: reset,
      fallback: fallback,
      results: results,
      groupDetail: groupDetail,
      zeroMessage: zeroMessage,
      invalidMessage: invalidMessage,
      status: status,
      help: help,
      error: error,
      outputs: outputs,
    };
  }

  function initializePlanner(root) {
    if (root.hasAttribute("data-planner-initialized")) {
      return;
    }

    const nodes = getPlannerNodes(root);
    if (!nodes) {
      return;
    }

    let announcementTimer = null;

    function setFieldError(name, message) {
      const field = nodes.fields[name];
      const hasError = Boolean(message);

      field.setAttribute("aria-invalid", hasError ? "true" : "false");
      field.classList.remove("border-error", "border-interactive");
      field.classList.add(hasError ? "border-error" : "border-interactive");

      nodes.error[name].textContent = message || "";
      nodes.error[name].hidden = !hasError;
    }

    function updatePlan() {
      const plan = calculatePlan({
        players: nodes.fields.players.value,
        minutes: nodes.fields.minutes.value,
        duration: nodes.fields.duration.value,
        breaks: nodes.fields.breaks.checked,
      });

      ["players", "minutes", "duration", "breaks"].forEach(function (name) {
        setFieldError(name, plan.errors[name] || "");
      });

      if (!plan.ok) {
        nodes.results.hidden = true;
        nodes.invalidMessage.hidden = false;
        nodes.zeroMessage.hidden = true;
        nodes.groupDetail.textContent = "—";
        return plan;
      }

      nodes.invalidMessage.hidden = true;
      nodes.results.hidden = false;
      nodes.zeroMessage.hidden = plan.rounds !== 0;

      nodes.outputs.rounds.textContent = String(plan.rounds);
      nodes.outputs.groups.textContent = String(plan.groups.length);
      nodes.outputs.games.textContent = String(plan.games);
      nodes.outputs.used.textContent = plan.used + " хв";
      nodes.outputs.free.textContent = plan.free + " хв";

      nodes.groupDetail.textContent =
        "Розподіл учасників: " +
        plan.groups
          .map(function (size, index) {
            return "група " + (index + 1) + " — " + size;
          })
          .join("; ") +
        ".";

      return plan;
    }

    function scheduleAnnouncement(plan) {
      if (announcementTimer !== null) {
        clearTimeout(announcementTimer);
      }

      announcementTimer = setTimeout(function () {
        if (!plan.ok) {
          const firstError = Object.values(plan.errors)[0];
          nodes.status.textContent = firstError
            ? "Перевірте поля. " + firstError
            : "Перевірте поля планувальника.";
          return;
        }

        nodes.status.textContent =
          "Раундів: " +
          plan.rounds +
          "; груп: " +
          plan.groups.length +
          "; партій: " +
          plan.games +
          "; використано " +
          plan.used +
          " хв, вільно " +
          plan.free +
          " хв.";
      }, 400);
    }

    function recalculateAndAnnounce() {
      scheduleAnnouncement(updatePlan());
    }

    ["rounds", "groups", "games", "used", "free"].forEach(function (name) {
      nodes.outputs[name].setAttribute("aria-live", "off");
    });

    nodes.form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    nodes.fields.players.addEventListener("input", recalculateAndAnnounce);
    nodes.fields.minutes.addEventListener("input", recalculateAndAnnounce);
    nodes.fields.players.addEventListener("change", recalculateAndAnnounce);
    nodes.fields.minutes.addEventListener("change", recalculateAndAnnounce);
    nodes.fields.duration.addEventListener("change", recalculateAndAnnounce);
    nodes.fields.breaks.addEventListener("change", recalculateAndAnnounce);

    nodes.reset.addEventListener("click", function () {
      nodes.fields.players.value = "4";
      nodes.fields.minutes.value = "120";
      nodes.fields.duration.value = "30";
      nodes.fields.breaks.checked = true;
      recalculateAndAnnounce();
    });

    nodes.fieldset.disabled = false;
    nodes.legend.textContent = "Параметри ігрового вечора";
    nodes.fallback.hidden = true;
    updatePlan();

    root.setAttribute("data-planner-initialized", "true");
  }

  function initializeAllPlanners() {
    const roots = Array.from(document.querySelectorAll("[data-evening-planner]"));

    normalizePlannerIds(roots);
    roots.forEach(initializePlanner);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAllPlanners, {
      once: true,
    });
  } else {
    initializeAllPlanners();
  }
})();
