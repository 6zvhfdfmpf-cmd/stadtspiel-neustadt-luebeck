(function () {
  "use strict";

  const DATA = window.STADTSPIEL;
  const AUDIO = window.StadtAudio;
  const SAVE_KEY = "stadtspiel-save-v2";
  const SCORE_KEY = "stadtspiel-scores-v2";
  const STAT_KEYS = [
    { key: "wohnen", short: "w", label: "Wohnen" },
    { key: "gruen", short: "g", label: "Grün & Klima" },
    { key: "wirtschaft", short: "wi", label: "Wirtschaft" }
  ];

  const state = {
    difficulty: "standard",
    current: 0,
    stats: { wohnen: 50, gruen: 50, wirtschaft: 50 },
    budget: 80,
    flags: {},
    history: [],
    eventsLog: [],
    selected: null,
    revealed: false,
    klima2035: null,
    started: false
  };

  const $ = (id) => document.getElementById(id);

  function clamp(v, min, max) {
    if (min == null) min = 0;
    if (max == null) max = 100;
    return Math.max(min, Math.min(max, Math.round(v)));
  }

  function computeScore(stats, budget) {
    const vals = [stats.wohnen, stats.gruen, stats.wirtschaft];
    const avg = (vals[0] + vals[1] + vals[2]) / 3;
    const spread = Math.max(...vals) - Math.min(...vals);
    const balancePenalty = Math.max(0, spread - 20) * 0.45;
    let crisisPenalty = 0;
    for (const v of vals) {
      if (v < 35) crisisPenalty += (35 - v) * 0.65;
      if (v < 20) crisisPenalty += (20 - v) * 0.5;
    }
    if (budget < 0) crisisPenalty += Math.min(18, Math.abs(budget) * 0.3);
    return clamp(avg - balancePenalty - crisisPenalty);
  }

  function bandFor(score) {
    if (score >= 70) return "hoch";
    if (score >= 55) return "solide";
    if (score >= 40) return "druck";
    return "krise";
  }

  function currentScenario() {
    return DATA.scenarios[state.current];
  }

  function yearNow() {
    const s = currentScenario();
    return s ? s.year : DATA.years.end;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function signed(n) {
    return (n > 0 ? "+" : "") + n;
  }

  function persona(id) {
    return DATA.personas.find((p) => p.id === id) || { name: "Stimme", role: "Stadt" };
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.id === "screen-" + name);
    });
    const footer = document.querySelector(".site-footer");
    if (footer) footer.hidden = name === "play" || name === "result";
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  function formatText(text, onTerm) {
    const parts = String(text).split(/(\{[a-z]+\})/g);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      const m = part.match(/^\{([a-z]+)\}$/);
      if (m && DATA.terms[m[1]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "term";
        btn.textContent = DATA.terms[m[1]].name;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          AUDIO.tap();
          onTerm(m[1], btn);
        });
        frag.appendChild(btn);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });
    return frag;
  }

  function plainText(text) {
    return String(text).replace(/\{([a-z]+)\}/g, (_, id) => (DATA.terms[id] ? DATA.terms[id].name : id));
  }

  function setTermBox(id) {
    const box = $("term-box");
    if (!box) return;
    if (!id || box.dataset.open === id) {
      box.hidden = true;
      box.innerHTML = "";
      delete box.dataset.open;
      return;
    }
    const term = DATA.terms[id];
    box.hidden = false;
    box.dataset.open = id;
    box.innerHTML = "<strong>" + term.name + ":</strong> " + term.text;
  }

  function applyDelta(target, key, n) {
    if (key === "budget") target.budget = clamp(target.budget - n, -40, 200);
    else target.stats[key] = clamp(target.stats[key] + n);
  }

  function optionEffects(opt) {
    return { w: opt.w || 0, g: opt.g || 0, wi: opt.wi || 0, cost: opt.cost || 0 };
  }

  function renderHUD() {
    const y = state.started ? yearNow() : DATA.years.start;
    $("hud-year").textContent = String(y);
    $("hud-budget").textContent = String(state.budget);
    $("hud-budget-wrap").classList.toggle("is-debt", state.budget < 0);
    $("hud-progress").textContent = state.started
      ? Math.min(state.current + 1, DATA.scenarios.length) + " / " + DATA.scenarios.length
      : "";
    STAT_KEYS.forEach(({ key }) => {
      const v = state.stats[key];
      document.querySelectorAll('.stat-fill[data-stat="' + key + '"]').forEach((el) => {
        el.style.width = v + "%";
      });
      document.querySelectorAll('.stat-value[data-stat="' + key + '"]').forEach((el) => {
        if (el.closest(".result-stats")) return;
        el.textContent = v;
      });
    });
  }

  function updateMap() {
    const map = $("stadt-map");
    if (!map) return;
    const flags = state.flags;
    const keys = ["hafen", "altstadt", "heat", "holiday", "traffic", "flood", "housing", "path", "beach", "trees", "transit", "retail", "youth", "weather"];
    keys.forEach((k) => {
      if (flags[k]) map.setAttribute("data-" + k, flags[k]);
      else map.removeAttribute("data-" + k);
    });
    const year = state.started ? yearNow() : DATA.years.start;
    map.setAttribute("data-year", String(year));
    const late = year >= 2036;
    map.classList.toggle("is-dusk", late && flags.weather !== "storm" && flags.weather !== "heat");
  }

  function renderMarkers() {
    document.querySelectorAll(".map-pin").forEach((pin) => {
      const place = pin.getAttribute("data-place");
      const idx = DATA.scenarios.findIndex((s) => s.place === place && DATA.scenarios.indexOf(s) === state.current);
      const done = DATA.scenarios.some((s, i) => s.place === place && i < state.current);
      const upcoming = DATA.scenarios[state.current] && DATA.scenarios[state.current].place === place;
      pin.classList.toggle("is-active", !!(upcoming && state.started));
      pin.classList.toggle("is-done", done && !upcoming);
      pin.setAttribute("aria-current", upcoming && state.started ? "step" : "false");
    });
  }

  function renderDeltas(fx) {
    const box = $("deltas");
    box.innerHTML = "";
    if (!fx) return;
    const items = [
      [fx.w, "Wohnen"],
      [fx.g, "Grün & Klima"],
      [fx.wi, "Wirtschaft"],
      [-fx.cost, "Kasse"]
    ];
    items.forEach(([n, label]) => {
      if (!n) return;
      const chip = document.createElement("span");
      chip.className = "delta-chip " + (n > 0 ? "up" : "down");
      chip.textContent = signed(n) + " " + label;
      box.appendChild(chip);
    });
  }

  function clearDeltas() {
    $("deltas").innerHTML = "";
  }

  function showVoice(voice) {
    const el = $("voice");
    if (!voice) {
      el.hidden = true;
      return;
    }
    const p = persona(voice.id);
    el.hidden = false;
    el.querySelector(".voice-who").textContent = p.name + " · " + p.role;
    el.querySelector(".voice-text").textContent = "„" + voice.text + "“";
    AUDIO.bubble();
  }

  function hideVoice() {
    $("voice").hidden = true;
  }

  function setWeather(kind) {
    state.flags.weather = kind || "fair";
    updateMap();
  }

  function renderScenario() {
    const s = currentScenario();
    state.selected = null;
    state.revealed = false;
    setWeather("fair");
    hideVoice();
    clearDeltas();
    $("feedback").classList.remove("visible");
    $("feedback").textContent = "";
    setTermBox(null);
    delete $("term-box").dataset.open;

    $("scenario-kicker").textContent = s.year + " · " + s.placeLabel;
    $("scenario-title").textContent = s.title;
    const textEl = $("scenario-text");
    textEl.innerHTML = "";
    textEl.appendChild(formatText(s.text, setTermBox));

    const opts = $("options");
    opts.innerHTML = "";
    s.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("aria-pressed", "false");
      const strong = document.createElement("strong");
      strong.appendChild(formatText(opt.label, setTermBox));
      const span = document.createElement("span");
      span.textContent = opt.desc + (opt.cost ? "  ·  Kasse " + signed(-opt.cost) : "");
      btn.appendChild(strong);
      btn.appendChild(span);
      btn.addEventListener("click", () => selectOption(i));
      opts.appendChild(btn);
    });

    const action = $("btn-action");
    action.disabled = true;
    action.textContent = "Entscheidung treffen";
    action.dataset.mode = "confirm";
    action.classList.remove("btn-gold");

    $("sheet").classList.add("is-open");
    $("sheet").setAttribute("aria-hidden", "false");
    renderHUD();
    updateMap();
    renderMarkers();
    save();
  }

  function selectOption(index) {
    if (state.revealed) return;
    state.selected = index;
    $("options").querySelectorAll(".option").forEach((btn, i) => {
      const on = i === index;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $("btn-action").disabled = false;
    AUDIO.tap();
  }

  function confirmChoice() {
    if (state.selected == null || state.revealed) return;
    const s = currentScenario();
    const option = s.options[state.selected];
    state.revealed = true;
    $("options").querySelectorAll(".option").forEach((btn) => { btn.disabled = true; });

    const fx = optionEffects(option);
    applyDelta(state, "wohnen", fx.w);
    applyDelta(state, "gruen", fx.g);
    applyDelta(state, "wirtschaft", fx.wi);
    applyDelta(state, "budget", fx.cost);
    Object.assign(state.flags, option.flags || {});
    state.history.push({
      year: s.year,
      title: s.title,
      place: s.placeLabel,
      label: plainText(option.label),
      feedback: option.feedback,
      fx: fx
    });

    if (s.special === "klima2035") {
      const ok = state.flags.heat === "strong" || (state.stats.gruen >= 65 && state.flags.heat !== "weak");
      const mid = state.flags.heat === "medium" || state.stats.gruen >= 55;
      state.klima2035 = ok ? "erreicht" : mid ? "gefaehrdet" : "verfehlt";
    }

    renderHUD();
    updateMap();
    renderDeltas(fx);
    const fb = $("feedback");
    let msg = option.feedback;
    if (s.special === "klima2035") {
      const t = {
        erreicht: " Das Klimaziel 2035 rückt in greifbare Nähe.",
        gefaehrdet: " Das Klimaziel 2035 steht auf der Kippe.",
        verfehlt: " Das Klimaziel 2035 wird mit diesem Kurs voraussichtlich verfehlt."
      };
      msg += t[state.klima2035] || "";
    }
    if (state.budget < 0) msg += " Die Stadtkasse rutscht ins Minus.";
    fb.textContent = msg;
    fb.classList.add("visible");
    showVoice(option.voice);

    const action = $("btn-action");
    action.disabled = false;
    action.dataset.mode = "next";
    action.classList.add("btn-gold");
    action.textContent = "Weiter";
    action.focus();
    AUDIO.confirm();
    save();
  }

  function pickEvent() {
    const cfg = DATA.difficulties[state.difficulty];
    if (Math.random() > cfg.eventChance) return null;
    const year = yearNow();
    const used = new Set(state.eventsLog.map((e) => e.id));
    const pool = DATA.events.filter((ev) => year >= (ev.afterYear || DATA.years.start) && !used.has(ev.id));
    if (!pool.length) return null;
    const weighted = [];
    pool.forEach((ev) => {
      let w = ev.weight || 1;
      if (ev.prefer) {
        Object.keys(ev.prefer).forEach((flag) => {
          if (ev.prefer[flag].includes(state.flags[flag])) w += 1.2;
        });
      }
      weighted.push({ ev, w });
    });
    const sum = weighted.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * sum;
    for (const item of weighted) {
      r -= item.w;
      if (r <= 0) return item.ev;
    }
    return weighted[0].ev;
  }

  function resolveEventEffects(ev) {
    const scale = DATA.difficulties[state.difficulty].eventScale;
    let raw = ev.effects ? { ...ev.effects } : null;
    if (ev.effectsBy) {
      const flagName = Object.keys(ev.effectsBy)[0];
      const table = ev.effectsBy[flagName];
      raw = table[state.flags[flagName]] || table.default;
    }
    if (ev.bonusIf && ev.effects) {
      const ok =
        (ev.bonusIf.heat && state.flags.heat === ev.bonusIf.heat) ||
        (ev.bonusIf.trees && state.flags.trees === ev.bonusIf.trees) ||
        (ev.bonusIf.gMin && state.stats.gruen >= ev.bonusIf.gMin);
      if (!ok && ev.id === "foerdergeld") {
        raw = { w: 0, g: 1, wi: 1, cost: -8, note: "Es gibt eine kleinere Zuwendung, aber ohne große Vorarbeiten fällt sie bescheidener aus." };
      }
    }
    const fx = {
      w: Math.round((raw.w || 0) * scale),
      g: Math.round((raw.g || 0) * scale),
      wi: Math.round((raw.wi || 0) * scale),
      cost: Math.round((raw.cost || 0) * scale),
      note: raw.note
    };
    return fx;
  }

  function showEvent(ev, fx) {
    const toast = $("year-toast");
    if (toast) toast.hidden = true;
    $("event-title").textContent = ev.title;
    $("event-text").textContent = ev.text + " " + (fx.note || "");
    const box = $("event-deltas");
    box.innerHTML = "";
    [
      [fx.w, "Wohnen"],
      [fx.g, "Grün & Klima"],
      [fx.wi, "Wirtschaft"],
      [-fx.cost, "Kasse"]
    ].forEach(([n, label]) => {
      if (!n) return;
      const chip = document.createElement("span");
      chip.className = "delta-chip " + (n > 0 ? "up" : "down");
      chip.textContent = signed(n) + " " + label;
      box.appendChild(chip);
    });
    $("event-modal").hidden = false;
    $("event-modal").classList.add("is-open");
    if (ev.weather === "storm") AUDIO.storm();
    else AUDIO.event();
  }

  function hideEvent() {
    $("event-modal").hidden = true;
    $("event-modal").classList.remove("is-open");
    setWeather("fair");
  }

  function advance() {
    const ev = pickEvent();
    if (ev) {
      const fx = resolveEventEffects(ev);
      applyDelta(state, "wohnen", fx.w);
      applyDelta(state, "gruen", fx.g);
      applyDelta(state, "wirtschaft", fx.wi);
      applyDelta(state, "budget", fx.cost);
      state.eventsLog.push({ id: ev.id, title: ev.title, note: fx.note, year: yearNow(), fx });
      setWeather(ev.weather || "fair");
      renderHUD();
      updateMap();
      save();
      showEvent(ev, fx);
      return;
    }
    goNext();
  }

  function goNext() {
    hideEvent();
    hideVoice();
    state.current += 1;
    if (state.current >= DATA.scenarios.length) {
      showResult();
      return;
    }
    AUDIO.year();
    const toast = $("year-toast");
    toast.textContent = "Jahr " + yearNow();
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, reducedMotion() ? 0 : 1100);
    renderScenario();
  }

  function achievements() {
    const score = computeScore(state.stats, state.budget);
    const spread =
      Math.max(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft) -
      Math.min(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft);
    const list = [];
    if (score >= 70 && spread < 30) list.push({ id: "balance", title: "Ausgewogene Bucht", text: "Hohe Note bei geringer Schieflage." });
    if (state.stats.gruen >= 75) list.push({ id: "klima", title: "Grünes Neustadt", text: "Klima und Natur hatten klaren Vorrang." });
    if (state.stats.wohnen >= 75) list.push({ id: "sozial", title: "Stadt zum Wohnen", text: "Dauerhaftes Wohnen wurde stark gemacht." });
    if (state.stats.wirtschaft >= 75) list.push({ id: "wirtschaft", title: "Starker Standort", text: "Betriebe und Tourismus wurden priorisiert." });
    if (state.klima2035 === "erreicht") list.push({ id: "ziel2035", title: "Kurs auf 2035", text: "Das Klimaziel blieb in Reichweite." });
    if (state.flags.flood && state.flags.flood !== "minimal") list.push({ id: "kueste", title: "Blick auf die Küste", text: "Hochwasserschutz wurde ernst genommen." });
    if (state.flags.youth === "strong") list.push({ id: "jugend", title: "Stadt für Junge", text: "Treffpunkte und Mitbestimmung bekamen Raum." });
    if (state.budget >= 40) list.push({ id: "kasse", title: "Solide Kasse", text: "Am Ende bleibt Handlungsspielraum." });
    if (state.budget < 0) list.push({ id: "schulden", title: "Klamm haushalten", text: "Die Stadtkasse steht im Minus." });
    if (state.eventsLog.some((e) => e.id === "sturmflut")) list.push({ id: "sturm", title: "Die Flut erlebt", text: "Eine Sturmflut hat eure Vorsorge geprüft." });
    return list;
  }

  function endingText(score, band) {
    const s = state.stats;
    const low = STAT_KEYS.reduce((a, b) => (s[a.key] <= s[b.key] ? a : b));
    const high = STAT_KEYS.reduce((a, b) => (s[a.key] >= s[b.key] ? a : b));
    const spread = s[high.key] - s[low.key];
    let title, text;
    if (band === "hoch") {
      title = "Die ausgewogene Bucht";
      text = "Sehr gute Balance! Du hast die Zielkonflikte über die Jahre im Blick behalten. In einer überschaubaren Stadt wie Neustadt sind solche Entscheidungen oft direkt im Alltag spürbar.";
    } else if (band === "solide") {
      title = "Solide, mit Spannungen";
      text = "Solide Planung. Einige Bereiche könnten noch besser ausbalanciert werden – gerade weil Wohnen, Klima und Wirtschaft hier nah beieinanderliegen.";
    } else if (band === "druck") {
      title = "Stadt unter Druck";
      text = "Die Stadt steht unter Druck. Einzelne Entscheidungen waren nachvollziehbar, aber zusammen entstehen deutliche Zielkonflikte.";
    } else {
      title = "Schieflage an der Bucht";
      text = "Die Stadt gerät ins Ungleichgewicht. Ein Bereich wurde stark gemacht, andere kommen unter die Räder.";
    }
    if (band !== "hoch" && spread >= 30) {
      text += " Die Werte liegen weit auseinander (Unterschied: " + spread + " Punkte) – das belastet die Gesamtnote.";
    }
    if (s[low.key] < 35) text += " Besonders unter Druck ist „" + low.label + "“ (" + s[low.key] + ").";
    if (state.budget < 0) text += " Die leere Kasse engt künftige Spielräume ein.";
    if (state.klima2035 === "verfehlt") text += " Das Klimaziel 2035 wurde voraussichtlich verfehlt.";
    if (state.klima2035 === "erreicht") text += " Beim Klimaziel 2035 lagst du auf einem guten Kurs.";
    return { title, text, score, band, low, high, spread };
  }

  function confettiBurst() {
    if (reducedMotion()) return;
    const root = $("confetti");
    root.innerHTML = "";
    root.hidden = false;
    const colors = ["#f2c35a", "#2f6b4f", "#1b6f86", "#c46a3a", "#fff6ea"];
    for (let i = 0; i < 48; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.transform = "rotate(" + Math.random() * 180 + "deg)";
      root.appendChild(p);
    }
    setTimeout(() => { root.hidden = true; root.innerHTML = ""; }, 2200);
  }

  function saveScores(score) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); } catch (e) { list = []; }
    list.unshift({
      score,
      difficulty: state.difficulty,
      at: new Date().toISOString(),
      klima: state.klima2035
    });
    list = list.slice(0, 8);
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(list)); } catch (e) {}
    return list;
  }

  function loadScores() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); } catch (e) { return []; }
  }

  function showResult() {
    state.started = false;
    clearSave();
    showScreen("result");
    const score = computeScore(state.stats, state.budget);
    const band = bandFor(score);
    const end = endingText(score, band);
    $("final-score").textContent = score;
    $("final-score").dataset.band = band;
    $("result-kicker").textContent = end.title;
    $("result-text").textContent = end.text;
    $("result-budget").textContent = "Kasse am Ende: " + state.budget;
    STAT_KEYS.forEach(({ key }) => {
      const fill = document.querySelector('.result-stats .stat-fill[data-stat="' + key + '"]');
      const val = document.querySelector('.result-stats .stat-value[data-stat="' + key + '"]');
      if (fill) fill.style.width = state.stats[key] + "%";
      if (val) val.textContent = state.stats[key];
    });

    const trade = $("tradeoff");
    trade.textContent =
      "Deine stärkste Seite war „" + end.high.label + "“ (" + state.stats[end.high.key] +
      "), die schwächste „" + end.low.label + "“ (" + state.stats[end.low.key] +
      "). Genau darin steckt der typische Zielkonflikt: Was dem einen Bereich hilft, kann einem anderen schaden.";

    const ach = achievements();
    const ulA = $("achievement-list");
    ulA.innerHTML = "";
    if (!ach.length) {
      const li = document.createElement("li");
      li.textContent = "Keine besondere Auszeichnung – ein neuer Versuch kann anders ausgehen.";
      ulA.appendChild(li);
    } else {
      ach.forEach((a) => {
        const li = document.createElement("li");
        li.innerHTML = "<strong></strong><span></span>";
        li.querySelector("strong").textContent = a.title;
        li.querySelector("span").textContent = a.text;
        ulA.appendChild(li);
      });
    }

    const ev = $("event-list");
    ev.innerHTML = "";
    if (!state.eventsLog.length) {
      ev.parentElement.hidden = true;
    } else {
      ev.parentElement.hidden = false;
      state.eventsLog.forEach((e) => {
        const li = document.createElement("li");
        li.innerHTML = "<strong></strong><span></span>";
        li.querySelector("strong").textContent = e.year + " · " + e.title;
        li.querySelector("span").textContent = e.note;
        ev.appendChild(li);
      });
    }

    const ul = $("choice-list");
    ul.innerHTML = "";
    state.history.forEach((h) => {
      const li = document.createElement("li");
      li.innerHTML = "<strong></strong><span></span>";
      li.querySelector("strong").textContent = h.year + " · " + h.title;
      li.querySelector("span").textContent = h.label;
      ul.appendChild(li);
    });

    const rq = $("reflect-list");
    rq.innerHTML = "";
    DATA.reflections.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q;
      rq.appendChild(li);
    });

    const scores = saveScores(score);
    const hs = $("highscore-list");
    hs.innerHTML = "";
    scores.forEach((row) => {
      const li = document.createElement("li");
      const d = row.at ? new Date(row.at) : null;
      const when = d ? d.toLocaleDateString("de-DE") : "";
      const diff = (DATA.difficulties[row.difficulty] || {}).label || row.difficulty;
      li.textContent = row.score + " Punkte · " + diff + (when ? " · " + when : "");
      hs.appendChild(li);
    });

    if (band === "hoch") {
      AUDIO.good();
      confettiBurst();
    } else if (band === "krise") AUDIO.bad();
    else AUDIO.year();
  }

  function snapshot() {
    return {
      difficulty: state.difficulty,
      current: state.current,
      stats: { ...state.stats },
      budget: state.budget,
      flags: { ...state.flags },
      history: state.history.slice(),
      eventsLog: state.eventsLog.slice(),
      klima2035: state.klima2035,
      started: true,
      revealed: false,
      selected: null
    };
  }

  function save() {
    if (!state.started || state.current >= DATA.scenarios.length) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) {}
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function continueGame() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return; }
    if (!data) return;
    Object.assign(state, data);
    state.started = true;
    state.revealed = false;
    state.selected = null;
    showScreen("play");
    renderScenario();
  }

  function startGame(diff) {
    const cfg = DATA.difficulties[diff] || DATA.difficulties.standard;
    state.difficulty = diff;
    state.current = 0;
    state.stats = { ...cfg.startStats };
    state.budget = cfg.budget;
    state.flags = { weather: "fair" };
    state.history = [];
    state.eventsLog = [];
    state.selected = null;
    state.revealed = false;
    state.klima2035 = null;
    state.started = true;
    clearSave();
    showScreen("play");
    renderScenario();
    AUDIO.year();
  }

  function restart() {
    showScreen("start");
    state.started = false;
    $("btn-continue").hidden = !hasSave();
    renderHUD();
    updateMap();
  }

  function openGlossary() {
    const box = $("glossary-list");
    box.innerHTML = "";
    Object.keys(DATA.terms).forEach((id) => {
      const t = DATA.terms[id];
      const dt = document.createElement("dt");
      dt.textContent = t.name;
      const dd = document.createElement("dd");
      dd.textContent = t.text;
      box.appendChild(dt);
      box.appendChild(dd);
    });
    $("glossary").hidden = false;
  }

  function onAction() {
    const mode = $("btn-action").dataset.mode;
    if (mode === "next") advance();
    else confirmChoice();
  }

  function initDifficulty() {
    const wrap = $("diff-buttons");
    wrap.innerHTML = "";
    Object.keys(DATA.difficulties).forEach((key) => {
      const d = DATA.difficulties[key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "diff-btn" + (key === "standard" ? " selected" : "");
      btn.dataset.diff = key;
      btn.innerHTML = "<strong></strong><span></span>";
      btn.querySelector("strong").textContent = d.label;
      btn.querySelector("span").textContent = d.hint;
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        AUDIO.tap();
      });
      wrap.appendChild(btn);
    });
  }

  function selectedDifficulty() {
    const el = document.querySelector(".diff-btn.selected");
    return (el && el.dataset.diff) || "standard";
  }

  function init() {
    AUDIO.load();
    const soundBtn = $("btn-sound");
    const syncSound = () => {
      soundBtn.setAttribute("aria-pressed", AUDIO.isOn() ? "true" : "false");
      soundBtn.textContent = AUDIO.isOn() ? "Ton an" : "Ton aus";
    };
    syncSound();
    soundBtn.addEventListener("click", () => {
      AUDIO.set(!AUDIO.isOn());
      syncSound();
      if (AUDIO.isOn()) AUDIO.tap();
    });

    initDifficulty();
    $("btn-start").addEventListener("click", () => startGame(selectedDifficulty()));
    $("btn-continue").hidden = !hasSave();
    $("btn-continue").addEventListener("click", continueGame);
    $("btn-action").addEventListener("click", onAction);
    $("btn-event-ok").addEventListener("click", goNext);
    $("btn-restart").addEventListener("click", restart);
    $("btn-print").addEventListener("click", () => window.print());
    $("btn-glossary").addEventListener("click", () => { AUDIO.tap(); openGlossary(); });
    $("btn-glossary-close").addEventListener("click", () => { $("glossary").hidden = true; });
    $("glossary").addEventListener("click", (e) => {
      if (e.target.id === "glossary") $("glossary").hidden = true;
    });

    document.querySelectorAll(".map-pin").forEach((pin) => {
      pin.addEventListener("click", () => {
        const s = currentScenario();
        if (!state.started || !s || pin.getAttribute("data-place") !== s.place) return;
        $("sheet").classList.add("is-open");
        AUDIO.tap();
      });
    });

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }

    renderHUD();
    updateMap();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
