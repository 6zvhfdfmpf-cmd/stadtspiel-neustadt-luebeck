(function () {
  "use strict";

  const DATA = window.STADTSPIEL;
  const STAT_KEYS = [
    { key: "wohnen", label: "Wohnen" },
    { key: "gruen", label: "Grün & Klima" },
    { key: "wirtschaft", label: "Wirtschaft" }
  ];

  const state = {
    current: 0,
    stats: { ...DATA.startStats },
    selected: null,
    revealed: false,
    history: []
  };

  const $ = (id) => document.getElementById(id);

  function clamp(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  function computeScore(stats) {
    const vals = [stats.wohnen, stats.gruen, stats.wirtschaft];
    const avg = (vals[0] + vals[1] + vals[2]) / 3;
    const spread = Math.max(...vals) - Math.min(...vals);
    const balancePenalty = Math.max(0, spread - 20) * 0.45;
    let crisisPenalty = 0;
    for (const v of vals) {
      if (v < 35) crisisPenalty += (35 - v) * 0.65;
      if (v < 20) crisisPenalty += (20 - v) * 0.5;
    }
    return clamp(avg - balancePenalty - crisisPenalty);
  }

  function bandFor(score) {
    if (score >= 70) return "hoch";
    if (score >= 55) return "solide";
    if (score >= 40) return "druck";
    return "krise";
  }

  function level(v) {
    if (v >= 70) return "high";
    if (v >= 40) return "mid";
    return "low";
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.id === "screen-" + name);
    });
    const meta = $("progress-meta");
    const footer = document.querySelector(".site-footer");
    if (name === "game") {
      meta.hidden = false;
      if (footer) footer.hidden = true;
    } else {
      meta.hidden = true;
      if (footer) footer.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatText(text, onTerm) {
    const parts = text.split(/(\{[a-z]+\})/g);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      const m = part.match(/^\{([a-z]+)\}$/);
      if (m && DATA.terms[m[1]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "term";
        btn.textContent = DATA.terms[m[1]].name;
        btn.setAttribute("aria-expanded", "false");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          onTerm(m[1], btn);
        });
        frag.appendChild(btn);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });
    return frag;
  }

  function updateStats() {
    STAT_KEYS.forEach(({ key }) => {
      const v = state.stats[key];
      const fill = document.querySelector('.stat-fill[data-stat="' + key + '"]');
      const val = document.querySelector('.stat-value[data-stat="' + key + '"]');
      if (fill) fill.style.width = v + "%";
      if (val) val.textContent = v;
    });
    const sky = $("skyline");
    if (sky) {
      sky.dataset.wohnen = level(state.stats.wohnen);
      sky.dataset.gruen = level(state.stats.gruen);
      sky.dataset.wirtschaft = level(state.stats.wirtschaft);
    }
  }

  function signed(n) {
    return (n > 0 ? "+" : "") + n;
  }

  function renderDeltas(option) {
    const box = $("deltas");
    box.innerHTML = "";
    if (!option) return;
    STAT_KEYS.forEach(({ key, label }) => {
      const n = option[key === "gruen" ? "g" : key === "wirtschaft" ? "wi" : "w"];
      const chip = document.createElement("span");
      chip.className = "delta-chip " + (n > 0 ? "up" : n < 0 ? "down" : "zero");
      chip.textContent = signed(n) + " " + label;
      box.appendChild(chip);
    });
  }

  function clearDeltas() {
    $("deltas").innerHTML = "";
  }

  function setTermBox(id, trigger) {
    const box = $("term-box");
    document.querySelectorAll(".term").forEach((t) => t.setAttribute("aria-expanded", "false"));
    if (!id) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const term = DATA.terms[id];
    if (box.dataset.open === id) {
      box.hidden = true;
      box.innerHTML = "";
      delete box.dataset.open;
      return;
    }
    box.hidden = false;
    box.dataset.open = id;
    box.innerHTML = "<strong>" + term.name + ":</strong> " + term.text;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  function renderScenario() {
    const list = DATA.scenarios;
    const s = list[state.current];
    state.selected = null;
    state.revealed = false;

    $("scenario-num").textContent = "Situation " + (state.current + 1) + " von " + list.length;
    $("progress-meta").textContent = (state.current + 1) + " / " + list.length;
    $("scenario-title").textContent = s.title;

    const textEl = $("scenario-text");
    textEl.innerHTML = "";
    textEl.appendChild(formatText(s.text, setTermBox));
    setTermBox(null);
    delete $("term-box").dataset.open;

    const opts = $("options");
    opts.innerHTML = "";
    s.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML = "<strong></strong><span></span>";
      btn.querySelector("strong").textContent = opt.label;
      btn.querySelector("span").textContent = opt.desc;
      btn.addEventListener("click", () => selectOption(i));
      opts.appendChild(btn);
    });

    const fb = $("feedback");
    fb.classList.remove("visible");
    fb.textContent = "";
    clearDeltas();

    const action = $("btn-action");
    action.disabled = true;
    action.textContent = "Entscheidung treffen";
    action.dataset.mode = "confirm";
    action.classList.remove("btn-gold");

    updateStats();
  }

  function selectOption(index) {
    if (state.revealed) return;
    state.selected = index;
    const buttons = $("options").querySelectorAll(".option");
    buttons.forEach((btn, i) => {
      const on = i === index;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $("btn-action").disabled = false;
  }

  function confirmChoice() {
    if (state.selected == null || state.revealed) return;
    const option = DATA.scenarios[state.current].options[state.selected];
    state.revealed = true;

    $("options").querySelectorAll(".option").forEach((btn) => {
      btn.disabled = true;
    });

    state.stats.wohnen = clamp(state.stats.wohnen + option.w);
    state.stats.gruen = clamp(state.stats.gruen + option.g);
    state.stats.wirtschaft = clamp(state.stats.wirtschaft + option.wi);
    updateStats();
    renderDeltas(option);

    const fb = $("feedback");
    fb.textContent = option.feedback;
    fb.classList.add("visible");

    state.history.push({
      title: DATA.scenarios[state.current].title,
      label: option.label
    });

    const action = $("btn-action");
    action.disabled = false;
    action.dataset.mode = "next";
    action.classList.add("btn-gold");
    action.textContent = state.current >= DATA.scenarios.length - 1 ? "Zur Auswertung" : "Weiter";
    action.focus();
  }

  function nextScenario() {
    if (!state.revealed) return;
    state.current += 1;
    if (state.current >= DATA.scenarios.length) {
      showResult();
    } else {
      renderScenario();
    }
  }

  function lowestStat() {
    return STAT_KEYS.reduce((a, b) => (state.stats[a.key] <= state.stats[b.key] ? a : b));
  }

  function showResult() {
    showScreen("result");
    const score = computeScore(state.stats);
    const band = bandFor(score);
    const seal = $("final-score");
    seal.textContent = score;
    seal.dataset.band = band;

    STAT_KEYS.forEach(({ key }) => {
      const fill = document.querySelector('.result-stats .stat-fill[data-stat="' + key + '"]');
      const val = document.querySelector('.result-stats .stat-value[data-stat="' + key + '"]');
      if (fill) fill.style.width = state.stats[key] + "%";
      if (val) val.textContent = state.stats[key];
    });

    const spread =
      Math.max(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft) -
      Math.min(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft);
    const low = lowestStat();

    let text = "";
    if (band === "hoch") {
      text = "Sehr gute Balance! Du hast die Zielkonflikte weitgehend im Blick behalten. In einer überschaubaren Stadt wie Neustadt sind solche Entscheidungen oft direkt im Alltag spürbar.";
    } else if (band === "solide") {
      text = "Solide Planung. Einige Bereiche könnten noch besser ausbalanciert werden – gerade weil Wohnen, Klima und Wirtschaft hier nah beieinanderliegen.";
    } else if (band === "druck") {
      text = "Die Stadt steht unter Druck. Einzelne Entscheidungen waren nachvollziehbar, aber zusammen entstehen deutliche Zielkonflikte.";
    } else {
      text = "Die Stadt gerät ins Ungleichgewicht. Ein Bereich wurde stark gemacht, andere kommen unter die Räder.";
    }

    if (band !== "hoch" && spread >= 30) {
      text += " Die Werte liegen weit auseinander (Unterschied: " + spread + " Punkte) – das belastet die Gesamtnote.";
    }
    if (state.stats[low.key] < 35) {
      text += " Besonders unter Druck ist „" + low.label + "“ (" + state.stats[low.key] + ").";
    }

    $("result-text").textContent = text;

    const ul = $("choice-list");
    ul.innerHTML = "";
    state.history.forEach((h, i) => {
      const li = document.createElement("li");
      li.innerHTML = "<strong></strong><span></span>";
      li.querySelector("strong").textContent = i + 1 + ". " + h.title;
      li.querySelector("span").textContent = h.label;
      ul.appendChild(li);
    });
  }

  function startGame() {
    state.current = 0;
    state.stats = { ...DATA.startStats };
    state.selected = null;
    state.revealed = false;
    state.history = [];
    showScreen("game");
    renderScenario();
  }

  function restart() {
    showScreen("start");
    state.current = 0;
    state.stats = { ...DATA.startStats };
    state.history = [];
    updateStats();
  }

  function init() {
    $("btn-start").addEventListener("click", startGame);
    $("btn-action").addEventListener("click", () => {
      if ($("btn-action").dataset.mode === "next") nextScenario();
      else confirmChoice();
    });
    $("btn-restart").addEventListener("click", restart);
    updateStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
