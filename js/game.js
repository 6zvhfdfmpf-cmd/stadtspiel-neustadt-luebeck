(function () {
  "use strict";

  const DATA = window.STADTSPIEL;
  const AUDIO = window.StadtAudio;
  const ENGINE = window.StadtEngine;
  const SAVE_KEY = "stadtspiel-save-v4";
  const SCORE_KEY = "stadtspiel-scores-v2";
  const TUTORIAL_KEY = "stadtspiel-tutorial-v3";
  const THEME_KEY = "stadtspiel-theme";
  const STAT_KEYS = [
    { key: "wohnen", short: "w", label: "Wohnen" },
    { key: "gruen", short: "g", label: "Grün & Klima" },
    { key: "wirtschaft", short: "wi", label: "Wirtschaft" }
  ];
  const EVENT_VOICES = {
    sturmflut: { id: "joris", text: "Wer die Küste kennt, baut nicht ohne Schutz." },
    hitzesommer: { id: "helga", text: "Ohne Schatten bleibe ich mittags lieber drinnen." },
    foerdergeld: { id: "nils", text: "Förderung kommt zu denen, die schon etwas vorbereitet haben." },
    tourismusboom: { id: "mona", text: "Ein volles Jahr rettet uns – wenn die Stadt das aushält." },
    baukosten: { id: "britta", text: "Alles wird teurer. Dann muss man genauer wählen." },
    engagement: { id: "tariq", text: "Schön, wenn wir mitreden dürfen – und das auch Folgen hat." }
  };

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
    started: false,
    seed: 0,
    classCode: "",
    choices: [],
    rng: null,
    playerName: "",
    playerDisplay: "",
    playerKlasse: "",
    official: false,
    attempt: 1
  };

  const mapCam = { scale: 1, x: 0, y: 0 };
  const $ = (id) => document.getElementById(id);
  const playEl = () => $("screen-play");
  function isDesktop() {
    return window.matchMedia && window.matchMedia("(min-width: 1024px)").matches;
  }
  function lockKey(name, klasse, classCode) {
    return "stadtspiel-lock-v4:" + (classCode || "") + ":" + (klasse || "") + ":" + (name || "");
  }
  function readLock(name, klasse, classCode) {
    try { return JSON.parse(localStorage.getItem(lockKey(name, klasse, classCode)) || "null"); } catch (e) { return null; }
  }
  function writeLock(name, klasse, classCode, obj) {
    try { localStorage.setItem(lockKey(name, klasse, classCode), JSON.stringify(obj)); } catch (e) {}
  }
  function showStartError(msg) {
    const el = $("start-error");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
  }
  function syncOfficialUi() {
    const has = !!(($("class-code-input") && $("class-code-input").value) || "").trim();
    if ($("diff-wrap")) $("diff-wrap").hidden = has;
    if ($("diff-locked")) $("diff-locked").hidden = !has;
  }

  function clamp(v, min, max) { return ENGINE.clamp(v, min, max); }
  function computeScore(stats, budget) { return ENGINE.computeScore(stats, budget); }
  function bandFor(score) { return ENGINE.bandFor(score); }

  function currentScenario() { return DATA.scenarios[state.current]; }
  function yearNow() {
    const s = currentScenario();
    return s ? s.year : DATA.years.end;
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function signed(n) { return (n > 0 ? "+" : "") + n; }
  function persona(id) { return DATA.personas.find((p) => p.id === id) || { name: "Stimme", role: "" }; }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.id === "screen-" + name);
    });
    const footer = document.querySelector(".site-footer");
    if (footer) footer.hidden = name === "play";
  }

  function formatText(text, onTerm) {
    const parts = String(text).split(/(\{[a-z]+\})/g);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      const m = part.match(/^\{([a-z]+)\}$/);
      if (m) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "term";
        const term = DATA.terms[m[1]];
        btn.textContent = term ? term.name : m[1];
        btn.addEventListener("click", () => onTerm(m[1]));
        frag.appendChild(btn);
      } else if (part) {
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
    const term = DATA.terms[id];
    if (!box || !term) return;
    box.hidden = false;
    box.innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = term.name + ". ";
    box.appendChild(strong);
    box.appendChild(document.createTextNode(term.text));
  }

  function applyDelta(target, key, n) { ENGINE.applyDelta(target, key, n); }

  function optionEffects(opt) {
    return { w: opt.w || 0, g: opt.g || 0, wi: opt.wi || 0, cost: opt.cost || 0 };
  }

  function renderHUD() {
    const y = state.started ? yearNow() : DATA.years.start;
    if ($("hud-year")) $("hud-year").textContent = String(y);
    if ($("hud-budget")) $("hud-budget").textContent = String(state.budget);
    if ($("hud-budget-wrap")) $("hud-budget-wrap").classList.toggle("is-debt", state.budget < 0);
    if ($("hud-progress")) $("hud-progress").textContent = (Math.min(state.current, DATA.scenarios.length - 1) + 1) + " / " + DATA.scenarios.length;
    STAT_KEYS.forEach(({ key }) => {
      const v = state.stats[key];
      document.querySelectorAll('.stat-fill[data-stat="' + key + '"]').forEach((el) => {
        if (!el.closest(".result-stats")) el.style.width = v + "%";
      });
      document.querySelectorAll('.stat-value[data-stat="' + key + '"]').forEach((el) => {
        if (!el.closest(".result-stats")) el.textContent = v;
      });
    });
    const badge = $("hud-class");
    if (badge) badge.remove();
    if (state.started && state.classCode && $("hud-progress")) {
      const el = document.createElement("div");
      el.id = "hud-class";
      el.className = "hud-badge class-badge";
      el.textContent = state.classCode;
      $("hud-progress").insertAdjacentElement("beforebegin", el);
    }
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

  function applyMapFlags(flags, year) {
    const prev = state.flags;
    state.flags = Object.assign({ weather: "fair" }, flags || {});
    if (year) {
      const keep = state.started;
      const cur = state.current;
      state.started = true;
      // yearNow uses current scenario; set attribute directly
      updateMap();
      $("stadt-map").setAttribute("data-year", String(year));
      $("stadt-map").classList.toggle("is-dusk", year >= 2036 && state.flags.weather !== "storm" && state.flags.weather !== "heat");
      state.started = keep;
      state.current = cur;
    } else updateMap();
    state.flags = prev;
    if (!year) updateMap();
  }

  function renderMarkers() {
    document.querySelectorAll("#stadt-map .map-pin").forEach((pin) => {
      const place = pin.getAttribute("data-place");
      const upcoming = DATA.scenarios[state.current] && DATA.scenarios[state.current].place === place;
      const done = DATA.scenarios.some((s, i) => s.place === place && i < state.current);
      pin.classList.toggle("is-active", !!(upcoming && state.started));
      pin.classList.toggle("is-done", done && !upcoming);
      pin.setAttribute("aria-current", upcoming && state.started ? "step" : "false");
    });
  }

  function renderDeltas(fx) {
    const box = $("deltas");
    if (!box) return;
    box.innerHTML = "";
    const items = [
      { n: fx.w, label: "Wohnen" },
      { n: fx.g, label: "Grün" },
      { n: fx.wi, label: "Wirtschaft" },
      { n: -(fx.cost || 0), label: "Kasse" }
    ];
    items.forEach((it) => {
      if (!it.n) return;
      const chip = document.createElement("span");
      chip.className = "delta-chip " + (it.n > 0 ? "up" : "down");
      chip.textContent = it.label + " " + signed(it.n);
      box.appendChild(chip);
    });
  }

  function clearDeltas() {
    const box = $("deltas");
    if (box) box.innerHTML = "";
  }

  function pickVoice(option) {
    const primary = option && option.voice;
    const lines = (DATA.personaLines || []).filter((v) => !primary || v.id === primary.id);
    if (primary && lines.length && Math.random() < 0.45) {
      const line = lines[Math.floor(Math.random() * lines.length)];
      return { id: line.id, text: line.text };
    }
    return primary || (lines.length ? lines[Math.floor(Math.random() * lines.length)] : null);
  }

  function showVoice(voice) {
    const el = $("voice");
    if (!el || !voice) return;
    const p = persona(voice.id);
    el.hidden = false;
    el.querySelector(".voice-who").textContent = p.name + (p.role ? " · " + p.role : "");
    el.querySelector(".voice-text").textContent = voice.text;
  }

  function hideVoice() {
    const el = $("voice");
    if (el) el.hidden = true;
  }

  function setWeather(kind) {
    state.flags.weather = kind || "fair";
    updateMap();
  }

  function setMapAspect(mode) {
    const map = $("stadt-map");
    if (map) map.setAttribute("preserveAspectRatio", mode);
  }

  function applyCam() {
    const g = $("map-pan");
    if (!g) return;
    g.setAttribute("transform", "translate(" + mapCam.x + "," + mapCam.y + ") scale(" + mapCam.scale + ")");
  }

  function resetCam() {
    mapCam.scale = 1;
    mapCam.x = 0;
    mapCam.y = 0;
    applyCam();
  }

  function enterMapPhase() {
    const play = playEl();
    play.classList.add("map-focus");
    play.classList.remove("map-expanded");
    if (isDesktop()) {
      play.classList.add("sheet-open");
      setMapAspect("xMidYMid slice");
    } else {
      play.classList.remove("sheet-open");
      setMapAspect("xMidYMid meet");
    }
    hideEvent();
    hideVoice();
    clearDeltas();
    const fb = $("feedback");
    if (fb) { fb.classList.remove("visible"); fb.textContent = ""; }
    renderScenario();
    renderHUD();
    updateMap();
    renderMarkers();
    const s = currentScenario();
    if ($("peek-year")) $("peek-year").textContent = s ? String(s.year) : "";
    if ($("peek-title")) $("peek-title").textContent = s ? (s.placeLabel + " · Situation öffnen") : "Situation öffnen";
    save();
  }

  function openSheet() {
    const play = playEl();
    play.classList.remove("map-focus", "map-expanded");
    play.classList.add("sheet-open");
    setMapAspect("xMidYMid slice");
    renderScenario();
    renderMarkers();
  }

  function toggleExpand(force) {
    const play = playEl();
    const on = force == null ? !play.classList.contains("map-expanded") : force;
    play.classList.toggle("map-expanded", on);
    $("btn-map-expand").setAttribute("aria-pressed", on ? "true" : "false");
    $("btn-map-expand").setAttribute("aria-label", on ? "Karte schließen" : "Karte vergrößern");
    if (on) setMapAspect("xMidYMid slice");
    else if (play.classList.contains("sheet-open")) setMapAspect("xMidYMid slice");
    else setMapAspect("xMidYMid meet");
  }

  function renderScenario() {
    const s = currentScenario();
    if (!s) return;
    state.selected = null;
    state.revealed = false;
    $("scenario-kicker").textContent = s.year + " · " + s.placeLabel;
    $("scenario-title").textContent = s.title;
    const textEl = $("scenario-text");
    textEl.innerHTML = "";
    textEl.appendChild(formatText(s.text, setTermBox));
    $("term-box").hidden = true;
    const opts = $("options");
    opts.innerHTML = "";
    s.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.dataset.index = String(i);
      const strong = document.createElement("strong");
      strong.textContent = (i + 1) + " · " + plainText(opt.label);
      const span = document.createElement("span");
      span.textContent = plainText(opt.desc || "");
      btn.appendChild(strong);
      btn.appendChild(span);
      btn.addEventListener("click", () => selectOption(i));
      opts.appendChild(btn);
    });
    const action = $("btn-action");
    action.disabled = true;
    action.dataset.mode = "confirm";
    action.textContent = "Entscheidung treffen";
    clearDeltas();
    const fb = $("feedback");
    if (fb) { fb.classList.remove("visible"); fb.textContent = ""; }
  }

  function selectOption(index) {
    if (state.revealed) return;
    state.selected = index;
    document.querySelectorAll("#options .option").forEach((btn, i) => {
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
    const fx = optionEffects(option);
    applyDelta(state, "wohnen", fx.w);
    applyDelta(state, "gruen", fx.g);
    applyDelta(state, "wirtschaft", fx.wi);
    applyDelta(state, "budget", fx.cost);
    Object.assign(state.flags, option.flags || {});
    ENGINE.checkKlima(state, s);
    state.choices[state.current] = state.selected;
    state.history.push({
      year: s.year,
      title: s.title,
      place: s.placeLabel,
      label: plainText(option.label),
      flags: Object.assign({}, option.flags || {}),
      option: state.selected
    });
    state.revealed = true;
    renderDeltas(fx);
    updateMap();
    renderHUD();
    renderMarkers();
    const fb = $("feedback");
    const t = {
      hoch: "Ein kräftiger Schritt – achte darauf, dass die anderen Werte mithalten.",
      solide: "Ein tragfähiger Kompromiss. Die Stadt bleibt im Gleichgewicht.",
      druck: "Die Stadt gerät unter Druck. Spätere Entscheidungen müssen gegensteuern.",
      krise: "Das Gleichgewicht kippt. Ohne Korrektur wird es eng."
    };
    const score = computeScore(state.stats, state.budget);
    fb.textContent = (option.feedback || "") + " " + (t[bandFor(score)] || "");
    fb.classList.add("visible");
    document.querySelectorAll("#options .option").forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.toggle("chosen", i === state.selected);
    });
    const action = $("btn-action");
    action.disabled = false;
    action.dataset.mode = "next";
    action.textContent = "Weiter";
    showVoice(pickVoice(option));
    AUDIO.good();
    save();
  }

  function pickEvent() {
    if (!state.rng) state.rng = ENGINE.mulberry32(state.seed || 1);
    return ENGINE.pickEvent(state, state.rng, yearNow(), DATA);
  }

  function resolveEventEffects(ev) {
    const scale = DATA.difficulties[state.difficulty].eventScale;
    return ENGINE.resolveEventEffects(ev, state, scale);
  }

  function showEvent(ev, fx) {
    const toast = $("year-toast");
    if (toast) toast.hidden = true;
    $("event-title").textContent = ev.title;
    $("event-text").textContent = ev.text + (fx.note ? " " + fx.note : "");
    const box = $("event-deltas");
    box.innerHTML = "";
    [
      { n: fx.w, label: "Wohnen" },
      { n: fx.g, label: "Grün" },
      { n: fx.wi, label: "Wirtschaft" },
      { n: -(fx.cost || 0), label: "Kasse" }
    ].forEach((it) => {
      if (!it.n) return;
      const chip = document.createElement("span");
      chip.className = "delta-chip " + (it.n > 0 ? "up" : "down");
      chip.textContent = it.label + " " + signed(it.n);
      box.appendChild(chip);
    });
    $("event-modal").hidden = false;
    showVoice(EVENT_VOICES[ev.id] || ev.voice);
  }

  function hideEvent() {
    const modal = $("event-modal");
    if (modal) modal.hidden = true;
  }

  function advance() {
    const ev = pickEvent();
    if (ev) {
      const fx = resolveEventEffects(ev);
      applyDelta(state, "wohnen", fx.w);
      applyDelta(state, "gruen", fx.g);
      applyDelta(state, "wirtschaft", fx.wi);
      applyDelta(state, "budget", fx.cost);
      state.eventsLog.push({ id: ev.id, title: ev.title, note: fx.note, year: yearNow(), fx: fx });
      setWeather(ev.weather || "fair");
      renderHUD();
      updateMap();
      save();
      showEvent(ev, fx);
      return;
    }
    goNext();
  }

  function chapterAt(index) {
    return (ENGINE.CHAPTERS || []).find((c) => c.at === index);
  }

  function showChapter(ch, then) {
    $("chapter-kicker").textContent = "Jahr " + ch.year;
    $("chapter-title").textContent = ch.title;
    $("chapter-text").textContent = ch.text;
    $("chapter-modal").hidden = false;
    $("btn-chapter-ok").onclick = function () {
      $("chapter-modal").hidden = true;
      if (then) then();
    };
    AUDIO.year();
  }

  function goNext() {
    hideEvent();
    hideVoice();
    state.current += 1;
    if (state.current >= DATA.scenarios.length) {
      runTimelapse(showResult);
      return;
    }
    AUDIO.year();
    const toast = $("year-toast");
    toast.textContent = "Jahr " + yearNow();
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, reducedMotion() ? 0 : 1100);
    const ch = chapterAt(state.current);
    if (ch) showChapter(ch, enterMapPhase);
    else enterMapPhase();
  }

  function runTimelapse(done) {
    const cap = $("timelapse-caption");
    const play = playEl();
    showScreen("play");
    play.classList.add("map-focus", "map-expanded");
    play.classList.remove("sheet-open");
    setMapAspect("xMidYMid meet");
    resetCam();
    hideVoice();
    const frames = [{ flags: { weather: "fair" }, year: 2026, title: "2026 · Der Anfang" }];
    const acc = { weather: "fair" };
    state.history.forEach((h) => {
      Object.assign(acc, h.flags || {});
      frames.push({ flags: Object.assign({}, acc), year: h.year, title: h.year + " · " + h.title });
    });
    let i = 0;
    const delay = reducedMotion() ? 0 : 520;
    function step() {
      const fr = frames[i];
      const keep = state.flags;
      state.flags = Object.assign({}, fr.flags);
      updateMap();
      $("stadt-map").setAttribute("data-year", String(fr.year));
      if (cap) {
        cap.hidden = false;
        cap.textContent = fr.title;
      }
      state.flags = Object.assign({}, keep);
      i += 1;
      if (i >= frames.length) {
        setTimeout(() => {
          if (cap) cap.hidden = true;
          play.classList.remove("map-expanded", "map-focus");
          updateMap();
          done();
        }, reducedMotion() ? 0 : 700);
        return;
      }
      setTimeout(step, delay);
    }
    step();
  }

  function achievements() {
    const score = computeScore(state.stats, state.budget);
    const spread = Math.max(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft) - Math.min(state.stats.wohnen, state.stats.gruen, state.stats.wirtschaft);
    const list = [];
    if (score >= 80 && spread <= 22) list.push({ title: "Ausgewogene Stadt", text: "Hohe Werte, ohne eine Seite zu opfern." });
    if (state.klima2035 === "erreicht") list.push({ title: "Kurs auf 2035", text: "Das Klimaziel bleibt in Reichweite." });
    if (state.budget >= 40) list.push({ title: "Solider Haushalt", text: "Am Ende bleibt Spielraum in der Stadtkasse." });
    if (state.stats.wohnen >= 70) list.push({ title: "Wohnraum im Blick", text: "Dauerhaftes Wohnen wurde klar priorisiert." });
    if (state.stats.gruen >= 70) list.push({ title: "Grünes Band", text: "Klima und Stadtgrün stehen besonders gut da." });
    if (state.stats.wirtschaft >= 70) list.push({ title: "Starker Standort", text: "Arbeit und Gäste tragen die Stadt." });
    if (state.flags.flood === "hard" || state.flags.flood === "nature") list.push({ title: "Küste im Blick", text: "Du hast den Schutz vor der Ostsee nicht vergessen." });
    return list;
  }

  function endingText(score, band) {
    const s = state.stats;
    const low = STAT_KEYS.reduce((a, b) => (s[a.key] <= s[b.key] ? a : b));
    const high = STAT_KEYS.reduce((a, b) => (s[a.key] >= s[b.key] ? a : b));
    const spread = s[high.key] - s[low.key];
    const titles = {
      hoch: "Eine tragfähige Stadt",
      solide: "Eine Stadt im Gleichgewicht",
      druck: "Eine Stadt unter Druck",
      krise: "Eine Stadt in der Schieflage"
    };
    let text;
    if (band === "hoch") text = "2040 ist Neustadt gut aufgestellt. Die Entscheidungen haben Wirkung gezeigt, ohne eine Seite ganz zu verlieren.";
    else if (band === "solide") text = "2040 steht Neustadt solide da. Es bleibt aber sichtbar, wo du Schwerpunkte gesetzt hast.";
    else if (band === "druck") text = "2040 spürt man die Spannungen: Einige Bereiche tragen die Stadt, andere sind zurückgeblieben.";
    else text = "2040 steht Neustadt unter erheblichem Druck. Zielkonflikte wurden zu einseitig gelöst.";
    if (state.klima2035 === "verfehlt") text += " Das Klimaziel 2035 wurde verfehlt.";
    else if (state.klima2035 === "gefaehrdet") text += " Das Klimaziel 2035 bleibt gefährdet.";
    else if (state.klima2035 === "erreicht") text += " Das Klimaziel 2035 bleibt erreichbar.";
    if (state.budget < 0) text += " Die Stadtkasse ist am Ende im Minus.";
    return { title: titles[band], text: text, high: high, low: low, spread: spread };
  }

  function confettiBurst() {
    if (reducedMotion()) return;
    const root = $("confetti");
    if (!root) return;
    root.hidden = false;
    root.innerHTML = "";
    const colors = ["#f2c35a", "#2f6b4f", "#1b6f86", "#c46a3a", "#fff6ea"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      root.appendChild(p);
    }
    setTimeout(() => { root.hidden = true; root.innerHTML = ""; }, 2200);
  }

  function saveScores(score) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); } catch (e) { list = []; }
    list.unshift({
      score: score,
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

  function resultCode() {
    const score = computeScore(state.stats, state.budget);
    if (state.official && state.playerName && state.playerKlasse) {
      return ENGINE.encodeTicket({
        name: state.playerDisplay || state.playerName,
        klasse: state.playerKlasse,
        seed: state.seed,
        difficulty: state.difficulty,
        choices: state.choices,
        score: score,
        attempt: state.attempt || 1
      });
    }
    return ENGINE.encodeResult(state.seed, state.difficulty, state.choices);
  }

  function renderBreakdown(parts) {
    const box = $("score-breakdown");
    if (!box || !parts) return;
    const row = (label, v, cls) => "<tr" + (cls ? " class=\"" + cls + "\"" : "") + "><td>" + label + "</td><td>" + v + "</td></tr>";
    const num = (n, sign) => {
      const r = Math.round(n * 10) / 10;
      const s = (r > 0 && sign) ? "+" + r : String(r);
      return s.replace(".", ",");
    };
    box.innerHTML = "<table><tbody>" +
      row("Grundwert (Durchschnitt der drei Bereiche)", num(parts.avg)) +
      row("Abzug Ungleichgewicht (Abstand " + Math.round(parts.spread) + ")", "−" + num(parts.balancePenalty).replace("^−", "")) +
      row("Abzug Krise (Werte unter 35 / 20)", "−" + num(parts.crisisPenalty)) +
      row("Abzug leere Kasse", "−" + num(parts.budgetPenalty)) +
      row("Bonus solide Kasse", "+" + num(parts.budgetBonus)) +
      row("Wettbewerbspunkte", String(parts.total), "total") +
      "</tbody></table>";
  }

  function fillShare(code) {
    $("result-code").textContent = code;
    const box = $("result-qr");
    if (box && window.StadtQR) box.innerHTML = StadtQR.toSvg(code, { fg: "#062a38", bg: "#fff6ea" });
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
    if (state.official) {
      hs.hidden = true;
      if (hs.previousElementSibling && hs.previousElementSibling.classList.contains("section-title")) {
        hs.previousElementSibling.hidden = true;
      }
    }

    fillShare(resultCode());
    renderBreakdown(ENGINE.scoreParts(state.stats, state.budget));
    if ($("result-player")) {
      const bits = [];
      if (state.playerDisplay || state.playerName) bits.push(state.playerDisplay || state.playerName);
      if (state.playerKlasse) bits.push("Klasse " + state.playerKlasse);
      $("result-player").textContent = bits.join(" · ");
    }
    if ($("result-points-label")) $("result-points-label").textContent = "Wettbewerbspunkte (0–100)";
    const official = !!state.official;
    if ($("btn-restart")) $("btn-restart").hidden = official;
    if ($("restart-lock")) $("restart-lock").hidden = !official;
    if ($("share-hint")) {
      $("share-hint").textContent = official
        ? "Gib diesen Code an deine Lehrkraft. Er enthält Name, Klasse, Punkte und eine Prüfziffer – wenn etwas vertippt oder geändert wird, erkennt das die Auswertung."
        : "Das war eine Übung ohne Rundencode. Der Code zählt nicht für den Wettbewerb.";
    }
    if (official) {
      writeLock(state.playerName, state.playerKlasse, state.classCode, {
        status: "done",
        score: score,
        ticket: $("result-code").textContent,
        attempt: state.attempt || 1,
        at: new Date().toISOString()
      });
    }

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
      stats: Object.assign({}, state.stats),
      budget: state.budget,
      flags: Object.assign({}, state.flags),
      history: state.history.slice(),
      eventsLog: state.eventsLog.slice(),
      klima2035: state.klima2035,
      started: true,
      revealed: false,
      selected: null,
      seed: state.seed,
      classCode: state.classCode,
      choices: state.choices.slice(),
      playerName: state.playerName,
      playerDisplay: state.playerDisplay,
      playerKlasse: state.playerKlasse,
      official: state.official,
      attempt: state.attempt
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

  function restoreRng() {
    const rng = ENGINE.mulberry32(state.seed >>> 0);
    const tmp = {
      difficulty: state.difficulty,
      flags: { weather: "fair" },
      eventsLog: [],
      stats: Object.assign({}, (DATA.difficulties[state.difficulty] || DATA.difficulties.standard).startStats),
      budget: (DATA.difficulties[state.difficulty] || DATA.difficulties.standard).budget
    };
    for (let i = 0; i < state.current; i++) {
      const s = DATA.scenarios[i];
      const idx = state.choices[i] || 0;
      const opt = s.options[idx];
      ENGINE.applyDelta(tmp, "wohnen", opt.w || 0);
      ENGINE.applyDelta(tmp, "gruen", opt.g || 0);
      ENGINE.applyDelta(tmp, "wirtschaft", opt.wi || 0);
      ENGINE.applyDelta(tmp, "budget", opt.cost || 0);
      Object.assign(tmp.flags, opt.flags || {});
      ENGINE.checkKlima(tmp, s);
      const ev = ENGINE.pickEvent(tmp, rng, s.year, DATA);
      if (ev) {
        const fx = ENGINE.resolveEventEffects(ev, tmp, DATA.difficulties[state.difficulty].eventScale);
        ENGINE.applyDelta(tmp, "wohnen", fx.w);
        ENGINE.applyDelta(tmp, "gruen", fx.g);
        ENGINE.applyDelta(tmp, "wirtschaft", fx.wi);
        ENGINE.applyDelta(tmp, "budget", fx.cost);
        tmp.eventsLog.push({ id: ev.id });
      }
    }
    state.rng = rng;
  }

  function continueGame() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return; }
    if (!data) return;
    Object.assign(state, data);
    state.started = true;
    state.revealed = false;
    state.selected = null;
    if (!state.choices) state.choices = [];
    restoreRng();
    showScreen("play");
    enterMapPhase();
  }

  const TUTORIAL = [
    { title: "Das ist deine Karte", text: "Hier siehst du Neustadt an der Ostsee: Hafen, Altstadt, Bahnhof und Pelzerhaken. Am Computer liegt die Karte links. Sie verändert sich mit deinen Entscheidungen.", spot: "map" },
    { title: "So triffst du Entscheidungen", text: "Jede Situation hat drei Wege. Klicke einen an oder drücke die Tasten 1, 2 oder 3. Mit Enter bestätigst du. Die Folgen siehst du erst danach.", spot: "" },
    { title: "Fairer Wettbewerb", text: "Mit dem Rundencode erlebt die ganze Klasse dieselben Ereignisse. Jede Person spielt die Runde auf diesem Rechner nur einmal. Am Ende bekommst du einen Wertungs-Code für die Lehrkraft.", spot: "" },
    { title: "Jahr, Kasse, Werte", text: "Jahr, Stadtkasse und die drei Werte bleiben im Blick. Die Punkte belohnen eine ausgewogene Stadt – nicht nur einen einzelnen Spitzenwert.", spot: "hud" }
  ];

  function tutorialDone() {
    try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch (e) { return false; }
  }
  function markTutorialDone() {
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch (e) {}
  }

  function startTutorial(done) {
    let step = 0;
    const box = $("tutorial");
    const play = playEl();
    function render() {
      const t = TUTORIAL[step];
      $("tutorial-step").textContent = "Schritt " + (step + 1) + " von " + TUTORIAL.length;
      $("tutorial-title").textContent = t.title;
      $("tutorial-text").textContent = t.text;
      play.classList.toggle("spot-map", t.spot === "map");
      play.classList.toggle("spot-hud", t.spot === "hud");
      $("btn-tutorial-next").textContent = step === TUTORIAL.length - 1 ? "Los geht’s" : "Weiter";
    }
    function close() {
      box.hidden = true;
      play.classList.remove("spot-map", "spot-hud");
      markTutorialDone();
      if (done) done();
    }
    $("btn-tutorial-next").onclick = function () {
      if (step >= TUTORIAL.length - 1) close();
      else { step += 1; render(); }
    };
    $("btn-tutorial-skip").onclick = close;
    box.hidden = false;
    render();
  }

  function beginPlay() {
    const first = function () {
      const ch = chapterAt(0);
      if (ch) showChapter(ch, enterMapPhase);
      else enterMapPhase();
    };
    if (!tutorialDone()) startTutorial(first);
    else first();
  }

  function startGame(diff) {
    showStartError("");
    const raw = ($("class-code-input") && $("class-code-input").value || "").trim();
    const nameRaw = ($("player-name") && $("player-name").value) || "";
    const classRaw = ($("player-class") && $("player-class").value) || "";
    let seed;
    let official = false;
    if (raw) {
      seed = ENGINE.decodeClass(raw);
      if (seed == null) {
        $("class-code-input").classList.add("is-invalid");
        showStartError("Dieser Rundencode ist ungültig. Bitte genau so übernehmen, wie ihn deine Lehrkraft angegeben hat.");
        return;
      }
      $("class-code-input").classList.remove("is-invalid");
      const name = ENGINE.normalizeName(nameRaw);
      const klasse = ENGINE.normalizeKlasse(classRaw);
      if (!name) { showStartError("Bitte trag einen Namen ein."); return; }
      if (!klasse) { showStartError("Bitte trag deine Klasse ein, zum Beispiel 8a oder 10b."); return; }
      const code = ENGINE.encodeClass(seed);
      const lock = readLock(name, klasse, code);
      if (lock && lock.status === "done") {
        showStartError("Du hast diese Runde auf diesem Rechner schon gespielt" + (lock.score != null ? " (" + lock.score + " Punkte)." : ".") + " Ein zweiter Versuch zählt nicht für den Wettbewerb.");
        return;
      }
      if (lock && lock.status === "started" && hasSave()) {
        continueGame();
        return;
      }
      official = true;
      diff = "standard";
      state.playerName = name;
      state.playerDisplay = nameRaw.trim();
      state.playerKlasse = klasse;
      state.official = true;
      state.attempt = 1;
    } else {
      seed = ENGINE.newSeed();
      state.playerName = ENGINE.normalizeName(nameRaw);
      state.playerDisplay = nameRaw.trim();
      state.playerKlasse = ENGINE.normalizeKlasse(classRaw);
      state.official = false;
      state.attempt = 1;
    }
    const cfg = DATA.difficulties[diff] || DATA.difficulties.standard;
    state.difficulty = official ? "standard" : diff;
    state.current = 0;
    state.stats = Object.assign({}, cfg.startStats);
    state.budget = cfg.budget;
    state.flags = { weather: "fair" };
    state.history = [];
    state.eventsLog = [];
    state.selected = null;
    state.revealed = false;
    state.klima2035 = null;
    state.started = true;
    state.seed = seed;
    state.classCode = ENGINE.encodeClass(seed);
    state.choices = [];
    state.rng = ENGINE.mulberry32(seed >>> 0);
    if (state.official) {
      writeLock(state.playerName, state.playerKlasse, ENGINE.encodeClass(seed), {
        status: "started",
        attempt: state.attempt,
        at: new Date().toISOString()
      });
    }
    resetCam();
    clearSave();
    showScreen("play");
    playEl().classList.add("map-focus");
    playEl().classList.remove("sheet-open", "map-expanded");
    renderHUD();
    updateMap();
    beginPlay();
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

  function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    const btn = $("btn-theme");
    if (btn) {
      btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", t === "dark" ? "Helles Design" : "Dunkles Design");
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b1c28" : "#0b4a5c");
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "dark" || saved === "light") applyTheme(saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
    else applyTheme("light");
  }

  function initMapGestures() {
    const stage = $("map-stage");
    if (!stage) return;
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.target.closest && e.target.closest(".map-controls")) return;
      dragging = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;
      ox = mapCam.x;
      oy = mapCam.y;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (mapCam.scale > 1.02 || moved) {
        mapCam.x = ox + dx;
        mapCam.y = oy + dy;
        applyCam();
      }
    });
    const end = () => { dragging = false; };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("click", (e) => {
      if (moved) { e.stopPropagation(); moved = false; }
    }, true);
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const next = clamp(mapCam.scale + (e.deltaY < 0 ? 0.15 : -0.15), 1, 2.6);
      mapCam.scale = next;
      if (next === 1) { mapCam.x = 0; mapCam.y = 0; }
      applyCam();
    }, { passive: false });
  }

  function init() {
    AUDIO.load();
    initTheme();
    const soundBtn = $("btn-sound");
    const syncSound = () => {
      soundBtn.setAttribute("aria-pressed", AUDIO.isOn() ? "true" : "false");
      const label = AUDIO.isOn() ? "Ton an" : "Ton aus";
      soundBtn.setAttribute("aria-label", label);
      const s = soundBtn.querySelector(".visually-hidden");
      if (s) s.textContent = label;
    };
    syncSound();
    soundBtn.addEventListener("click", () => {
      AUDIO.set(!AUDIO.isOn());
      syncSound();
      if (AUDIO.isOn()) AUDIO.tap();
    });
    $("btn-theme").addEventListener("click", () => {
      const now = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(now);
    });

    initDifficulty();
    initMapGestures();
    syncOfficialUi();
    if ($("class-code-input")) {
      $("class-code-input").addEventListener("input", syncOfficialUi);
    }
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
    $("btn-peek").addEventListener("click", () => { AUDIO.tap(); openSheet(); });
    $("btn-map-expand").addEventListener("click", () => toggleExpand());
    $("btn-map-in").addEventListener("click", () => {
      mapCam.scale = clamp(mapCam.scale + 0.25, 1, 2.6);
      applyCam();
    });
    $("btn-map-out").addEventListener("click", () => {
      mapCam.scale = clamp(mapCam.scale - 0.25, 1, 2.6);
      if (mapCam.scale === 1) { mapCam.x = 0; mapCam.y = 0; }
      applyCam();
    });
    $("btn-copy-code").addEventListener("click", async () => {
      const code = $("result-code").textContent;
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(code);
        $("btn-copy-code").textContent = "Kopiert";
        setTimeout(() => { $("btn-copy-code").textContent = "Code kopieren"; }, 1600);
      } catch (e) {
        $("btn-copy-code").textContent = "Bitte markieren und kopieren";
      }
    });
    $("btn-export-png").addEventListener("click", async () => {
      const canvas = StadtExport.draw({
        score: computeScore(state.stats, state.budget),
        band: bandFor(computeScore(state.stats, state.budget)),
        title: $("result-kicker").textContent,
        text: $("result-text").textContent,
        stats: state.stats,
        budget: state.budget,
        choices: state.history,
        code: $("result-code").textContent,
        name: state.playerDisplay || state.playerName,
        klasse: state.playerKlasse
      });
      try { await StadtExport.downloadCanvas(canvas, "stadtspiel-neustadt-2040.png"); }
      catch (e) { $("btn-export-png").textContent = "Speichern nicht möglich"; }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && playEl() && playEl().classList.contains("map-expanded")) {
        toggleExpand(false);
        return;
      }
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const hidden = (id) => { const el = $(id); return !el || el.hidden; };
      if (!hidden("tutorial")) return;
      if (!hidden("glossary")) return;
      if (!hidden("event-modal")) {
        if (e.key === "Enter") { e.preventDefault(); goNext(); }
        return;
      }
      if (!hidden("chapter-modal")) {
        if (e.key === "Enter") { e.preventDefault(); $("btn-chapter-ok").click(); }
        return;
      }
      if (!playEl() || !playEl().classList.contains("active") || !state.started) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        e.preventDefault();
        if (!state.revealed) selectOption(Number(e.key) - 1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onAction();
      }
    });

    document.querySelectorAll("#stadt-map .map-pin").forEach((pin) => {
      const go = () => {
        const s = currentScenario();
        if (!state.started || !s || pin.getAttribute("data-place") !== s.place) return;
        if (playEl().classList.contains("map-expanded")) toggleExpand(false);
        openSheet();
        AUDIO.tap();
      };
      pin.addEventListener("click", go);
      pin.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
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
