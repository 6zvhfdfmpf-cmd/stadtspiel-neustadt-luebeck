/* WebAudio, standardmäßig aus. Kleine, lizenzfreie Klänge. */
window.StadtAudio = (function () {
  "use strict";
  let ctx = null;
  let enabled = false;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, gain) {
    const c = ac();
    if (!c || !enabled) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.02);
  }

  function noise(start, dur, gain, freq) {
    const c = ac();
    if (!c || !enabled) return;
    const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    const src = c.createBufferSource();
    src.buffer = n;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq || 400;
    const g = c.createGain();
    g.gain.setValueAtTime(gain || 0.04, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(c.currentTime + start);
    src.stop(c.currentTime + start + dur + 0.02);
  }

  return {
    isOn() { return enabled; },
    set(on) {
      enabled = !!on;
      if (enabled) ac();
      try { localStorage.setItem("stadtspiel-sound", enabled ? "1" : "0"); } catch (e) {}
    },
    load() {
      try { enabled = localStorage.getItem("stadtspiel-sound") === "1"; } catch (e) { enabled = false; }
      return enabled;
    },
    tap() { tone(520, 0, 0.06, "triangle", 0.03); },
    confirm() { tone(392, 0, 0.09, "sine", 0.045); tone(523, 0.07, 0.12, "sine", 0.05); },
    year() { tone(330, 0, 0.08, "sine", 0.04); tone(440, 0.08, 0.12, "sine", 0.04); },
    event() { tone(220, 0, 0.18, "triangle", 0.05); tone(174, 0.1, 0.2, "sine", 0.04); },
    storm() { noise(0, 0.7, 0.06, 350); tone(90, 0, 0.5, "sine", 0.03); },
    good() { tone(523, 0, 0.12, "sine", 0.05); tone(659, 0.1, 0.12, "sine", 0.05); tone(784, 0.2, 0.22, "sine", 0.06); },
    bad() { tone(311, 0, 0.18, "triangle", 0.05); tone(233, 0.12, 0.25, "sine", 0.05); },
    bubble() { tone(880, 0, 0.07, "square", 0.015); }
  };
})();
