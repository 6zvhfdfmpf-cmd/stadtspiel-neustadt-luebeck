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

  function scoreParts(stats, budget) {
    const vals = [stats.wohnen, stats.gruen, stats.wirtschaft];
    const avg = (vals[0] + vals[1] + vals[2]) / 3;
    const spread = Math.max(...vals) - Math.min(...vals);
    const balancePenalty = Math.max(0, spread - 20) * 0.45;
    let crisisPenalty = 0;
    for (const v of vals) {
      if (v < 35) crisisPenalty += (35 - v) * 0.65;
      if (v < 20) crisisPenalty += (20 - v) * 0.5;
    }
    const budgetPenalty = budget < 0 ? Math.min(18, Math.abs(budget) * 0.3) : 0;
    const budgetBonus = budget > 0 ? Math.min(8, budget * 0.08) : 0;
    const raw = avg - balancePenalty - crisisPenalty - budgetPenalty + budgetBonus;
    return {
      avg: avg,
      spread: spread,
      balancePenalty: balancePenalty,
      crisisPenalty: crisisPenalty,
      budgetPenalty: budgetPenalty,
      budgetBonus: budgetBonus,
      raw: raw,
      total: clamp(raw)
    };
  }

  function computeScore(stats, budget) {
    return scoreParts(stats, budget).total;
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


  function normalizeName(s) {
    let t = String(s || "").trim();
    t = t.replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
    t = t.replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE");
    t = t.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return t.slice(0, 16).toUpperCase();
  }

  function normalizeKlasse(s) {
    const t = String(s || "").toUpperCase().replace(/KLASSE/g, "").replace(/JG\.?/g, "").replace(/[\s./]/g, "");
    const m = t.match(/^(\d{1,2})([A-Z])$/);
    return m ? m[1] + m[2] : "";
  }

  function strCrc8(str) {
    const bits = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i) & 0xff;
      for (let b = 7; b >= 0; b--) bits.push((c >> b) & 1);
    }
    return crc8(bits);
  }

  function encodeTicket(info) {
    const name = normalizeName(info.name);
    const klasse = normalizeKlasse(info.klasse);
    const r = encodeResult(info.seed, info.difficulty, info.choices);
    const score = clamp(info.score);
    const att = Math.max(1, Math.min(9, info.attempt || 1));
    const payload = [name, klasse, r, String(score).padStart(3, "0"), String(att)].join("/");
    const crc = bitsToCode(toBits(strCrc8(payload), 8));
    return "W/" + payload + "/" + crc;
  }

  function decodeTicket(code) {
    const raw = String(code || "").trim().replace(/\s+/g, "");
    if (!raw) return null;
    if (/^R-/i.test(raw) || (!/^W\//i.test(raw) && raw.replace(/-/g, "").length <= 16)) {
      const game = decodeResult(raw);
      if (!game) return null;
      return { official: false, name: "", klasse: "", attempt: 1, scoreClaim: null, game: game, ticket: raw.toUpperCase() };
    }
    const parts = raw.split("/");
    if (parts.length !== 7 || parts[0].toUpperCase() !== "W") return null;
    const name = normalizeName(parts[1]);
    const klasse = normalizeKlasse(parts[2]);
    const r = parts[3];
    const scoreClaim = parseInt(parts[4], 10);
    const attempt = parseInt(parts[5], 10);
    const crc = parts[6].toUpperCase();
    const payload = [name, klasse, r.toUpperCase(), String(scoreClaim).padStart(3, "0"), String(attempt)].join("/");
    const expect = bitsToCode(toBits(strCrc8(payload), 8));
    if (crc !== expect) return { error: "checksum", ticket: raw };
    const game = decodeResult(r);
    if (!game) return { error: "result", ticket: raw };
    return {
      official: true,
      name: name,
      klasse: klasse,
      attempt: attempt,
      scoreClaim: scoreClaim,
      game: game,
      ticket: "W/" + payload + "/" + expect
    };
  }

  function verifyTicket(data, ticket) {
    const dec = decodeTicket(ticket);
    if (!dec || dec.error) return dec || { error: "format" };
    const sim = simulate(data, dec.game.seed, dec.game.difficulty, dec.game.choices);
    const parts = scoreParts(sim.stats, sim.budget);
    sim.parts = parts;
    const officialScore = parts.total;
    if (dec.official && dec.scoreClaim !== officialScore) {
      return { error: "score", ticket: dec.ticket, dec: dec, sim: sim, officialScore: officialScore };
    }
    return { ok: true, dec: dec, sim: sim, officialScore: officialScore, parts: parts };
  }

  function compareEntries(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.spread || 0) !== (b.spread || 0)) return (a.spread || 0) - (b.spread || 0);
    if ((b.budget || 0) !== (a.budget || 0)) return (b.budget || 0) - (a.budget || 0);
    const na = String(a.name || "");
    const nb = String(b.name || "");
    return na.localeCompare(nb, "de");
  }

  function rankEntries(rows, topN) {
    const list = rows.slice().sort(compareEntries);
    let lastKey = null, lastRank = 0;
    list.forEach((row, i) => {
      const key = [row.score, row.spread || 0, row.budget || 0].join("|");
      if (key !== lastKey) {
        lastRank = i + 1;
        lastKey = key;
      }
      row.rank = lastRank;
      row.advances = lastRank <= (topN || 3);
    });
    return list;
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
    st.parts = scoreParts(st.stats, st.budget);
    st.score = st.parts.total;
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
    ABC, mulberry32, clamp, scoreParts, computeScore, bandFor,
    encodeClass, decodeClass, encodeResult, decodeResult,
    normalizeName, normalizeKlasse, encodeTicket, decodeTicket, verifyTicket,
    compareEntries, rankEntries,
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
