/* Gemeinsame Logik: Seed, Klassencode, Ergebniscode, Simulation. */
window.StadtEngine = (function () {
  "use strict";
  const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford, ohne I L O U

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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

  function toBits(n, len) {
    const out = [];
    for (let i = len - 1; i >= 0; i--) out.push((n >> i) & 1);
    return out;
  }

  function fromBits(bits, i, len) {
    let n = 0;
    for (let k = 0; k < len; k++) n = (n << 1) | (bits[i + k] || 0);
    return n;
  }

  function crc5(bits) {
    let c = 0x1f;
    bits.forEach((b) => {
      const bit = (c >> 4) ^ b;
      c = ((c << 1) & 0x1f) ^ (bit ? 0x15 : 0);
    });
    return c & 0x1f;
  }

  function crc8(bits) {
    let c = 0xff;
    bits.forEach((b) => {
      const bit = (c >> 7) ^ b;
      c = ((c << 1) & 0xff) ^ (bit ? 0x07 : 0);
    });
    return c & 0xff;
  }

  function bitsToCode(bits) {
    while (bits.length % 5 !== 0) bits.push(0);
    let s = "";
    for (let i = 0; i < bits.length; i += 5) s += ABC[fromBits(bits, i, 5)];
    return s;
  }

  function codeToBits(str) {
    const s = String(str).toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/I/g, "1").replace(/L/g, "1").replace(/O/g, "0");
    const bits = [];
    for (const ch of s) {
      const n = ABC.indexOf(ch);
      if (n < 0) return null;
      bits.push.apply(bits, toBits(n, 5));
    }
    return bits;
  }

  function encodeClass(seed) {
    seed = seed >>> 0 & 0xfffff;
    const bits = toBits(seed, 20);
    bits.push.apply(bits, toBits(crc5(bits), 5));
    return "K-" + bitsToCode(bits);
  }

  function decodeClass(code) {
    const raw = String(code || "").trim().toUpperCase();
    const bits = codeToBits(raw.replace(/^K-?/, ""));
    if (!bits || bits.length < 25) return null;
    const seed = fromBits(bits, 0, 20);
    const sum = fromBits(bits, 20, 5);
    if (crc5(bits.slice(0, 20)) !== sum) return null;
    return seed;
  }

  function encodeResult(seed, difficulty, choices) {
    const diffs = ["leicht", "standard", "schwer"];
    const d = Math.max(0, diffs.indexOf(difficulty));
    const bits = toBits(seed >>> 0 & 0xfffff, 20);
    bits.push.apply(bits, toBits(d, 2));
    for (let i = 0; i < 13; i++) bits.push.apply(bits, toBits((choices[i] || 0) & 3, 2));
    bits.push.apply(bits, toBits(crc8(bits), 8));
    const body = bitsToCode(bits);
    return "R-" + body.slice(0, 5) + "-" + body.slice(5);
  }

  function decodeResult(code) {
    const bits = codeToBits(String(code || "").replace(/^R-?/i, ""));
    if (!bits || bits.length < 56) return null;
    const payload = bits.slice(0, 48);
    const sum = fromBits(bits, 48, 8);
    if (crc8(payload) !== sum) return null;
    const seed = fromBits(bits, 0, 20);
    const diffs = ["leicht", "standard", "schwer"];
    const difficulty = diffs[fromBits(bits, 20, 2)] || "standard";
    const choices = [];
    for (let i = 0; i < 13; i++) choices.push(fromBits(bits, 22 + i * 2, 2) % 3);
    return { seed, difficulty, choices };
  }

  function applyDelta(st, key, n) {
    if (key === "budget") st.budget = clamp(st.budget - n, -40, 200);
    else st.stats[key] = clamp(st.stats[key] + n);
  }

  function resolveEventEffects(ev, st, scale) {
    let raw = ev.effects ? Object.assign({}, ev.effects) : null;
    if (ev.effectsBy) {
      const flagName = Object.keys(ev.effectsBy)[0];
      const table = ev.effectsBy[flagName];
      raw = table[st.flags[flagName]] || table.default;
    }
    if (ev.bonusIf && ev.effects && ev.id === "foerdergeld") {
      const ok =
        (ev.bonusIf.heat && st.flags.heat === ev.bonusIf.heat) ||
        (ev.bonusIf.trees && st.flags.trees === ev.bonusIf.trees) ||
        (ev.bonusIf.gMin && st.stats.gruen >= ev.bonusIf.gMin);
      if (!ok) {
        raw = { w: 0, g: 1, wi: 1, cost: -8, note: "Es gibt eine kleinere Zuwendung, aber ohne große Vorarbeiten fällt sie bescheidener aus." };
      }
    }
    return {
      w: Math.round((raw.w || 0) * scale),
      g: Math.round((raw.g || 0) * scale),
      wi: Math.round((raw.wi || 0) * scale),
      cost: Math.round((raw.cost || 0) * scale),
      note: raw.note
    };
  }

  function pickEvent(st, rng, year, data) {
    const cfg = data.difficulties[st.difficulty];
    if (rng() > cfg.eventChance) return null;
    const used = new Set((st.eventsLog || []).map((e) => e.id));
    const pool = data.events.filter((ev) => year >= (ev.afterYear || data.years.start) && !used.has(ev.id));
    if (!pool.length) return null;
    const weighted = pool.map((ev) => {
      let w = ev.weight || 1;
      if (ev.prefer) {
        Object.keys(ev.prefer).forEach((flag) => {
          if (ev.prefer[flag].includes(st.flags[flag])) w += 1.2;
        });
      }
      return { ev, w };
    });
    let r = rng() * weighted.reduce((a, x) => a + x.w, 0);
    for (const item of weighted) {
      r -= item.w;
      if (r <= 0) return item.ev;
    }
    return weighted[0].ev;
  }

  function checkKlima(st, scenario) {
    if (scenario.special !== "klima2035") return;
    const ok = st.flags.heat === "strong" || (st.stats.gruen >= 65 && st.flags.heat !== "weak");
    const mid = st.flags.heat === "medium" || st.stats.gruen >= 55;
    st.klima2035 = ok ? "erreicht" : mid ? "gefaehrdet" : "verfehlt";
  }

  function simulate(data, seed, difficulty, choices) {
    const cfg = data.difficulties[difficulty] || data.difficulties.standard;
    const rng = mulberry32(seed >>> 0);
    const st = {
      difficulty: difficulty,
      stats: Object.assign({}, cfg.startStats),
      budget: cfg.budget,
      flags: { weather: "fair" },
      eventsLog: [],
      klima2035: null,
      history: []
    };
    data.scenarios.forEach((s, i) => {
      const idx = Math.max(0, Math.min(2, choices[i] | 0));
      const opt = s.options[idx];
      applyDelta(st, "wohnen", opt.w || 0);
      applyDelta(st, "gruen", opt.g || 0);
      applyDelta(st, "wirtschaft", opt.wi || 0);
      applyDelta(st, "budget", opt.cost || 0);
      Object.assign(st.flags, opt.flags || {});
      checkKlima(st, s);
      st.history.push({
        year: s.year,
        title: s.title,
        place: s.placeLabel,
        label: String(opt.label).replace(/\{([a-z]+)\}/g, (_, id) => (data.terms[id] ? data.terms[id].name : id)),
        flags: Object.assign({}, opt.flags || {})
      });
      const ev = pickEvent(st, rng, s.year, data);
      if (ev) {
        const fx = resolveEventEffects(ev, st, cfg.eventScale);
        applyDelta(st, "wohnen", fx.w);
        applyDelta(st, "gruen", fx.g);
        applyDelta(st, "wirtschaft", fx.wi);
        applyDelta(st, "budget", fx.cost);
        st.eventsLog.push({ id: ev.id, title: ev.title, note: fx.note, year: s.year, fx: fx });
      }
    });
    st.score = computeScore(st.stats, st.budget);
    st.band = bandFor(st.score);
    return st;
  }

  const CHAPTERS = [
    { at: 0, year: 2026, title: "Kapitel 1 · Hafen und Altstadt", text: "Die nächsten Jahre drehen sich um die Hafenwestseite, das Bild der Altstadt und die Wärmeversorgung – Grundlagen für alles, was folgt." },
    { at: 3, year: 2029, title: "Kapitel 2 · Wohnen, Verkehr, Schutz", text: "Wohnraum, Gäste und der Weg durch die Stadt stehen an. Später entscheidest du über den Schutz vor der Ostsee." },
    { at: 7, year: 2033, title: "Kapitel 3 · Küste und Klimaziel", text: "Ufer, Strand und Stadtgrün rücken in den Mittelpunkt. 2035 ist das Jahr des Klimaziels." },
    { at: 10, year: 2036, title: "Kapitel 4 · Alltag und Zukunft", text: "Bahnhof, Läden und Orte für junge Menschen: Wie soll das tägliche Leben in Neustadt aussehen?" }
  ];

  return {
    ABC, mulberry32, clamp, computeScore, bandFor,
    encodeClass, decodeClass, encodeResult, decodeResult,
    applyDelta, resolveEventEffects, pickEvent, checkKlima, simulate,
    CHAPTERS,
    newSeed() {
      const a = new Uint32Array(1);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else a[0] = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      return a[0] & 0xfffff;
    }
  };
})();
