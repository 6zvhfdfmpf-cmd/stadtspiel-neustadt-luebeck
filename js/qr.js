/* Kompakter QR-Code (Byte-Modus, Level L, Version 2–4), ohne externe Dienste. */
window.StadtQR = (function () {
  "use strict";
  const PR = 0x11d;
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (function init() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= PR;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsGenerator(ecLen) {
    let poly = [1];
    for (let i = 0; i < ecLen; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= mul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGenerator(ecLen);
    const ec = new Array(ecLen).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ ec[0];
      ec.shift();
      ec.push(0);
      for (let i = 0; i < ecLen; i++) ec[i] ^= mul(gen[i + 1], factor);
    });
    return ec;
  }

  const VERS = {
    2: { size: 25, data: 34, ec: 10, align: [6, 18] },
    3: { size: 29, data: 55, ec: 15, align: [6, 22] },
    4: { size: 33, data: 80, ec: 20, align: [6, 26] }
  };

  function bitsToBytes(bits) {
    const out = [];
    for (let i = 0; i < bits.length; i += 8) {
      let n = 0;
      for (let b = 0; b < 8; b++) n = (n << 1) | (bits[i + b] || 0);
      out.push(n);
    }
    return out;
  }

  function encodeBytes(str, cap) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c > 255) bytes.push(63);
      else bytes.push(c);
    }
    const bits = [];
    const push = (n, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((n >> i) & 1);
    };
    push(0x4, 4);
    push(bytes.length, 8);
    bytes.forEach((b) => push(b, 8));
    const totalBits = cap * 8;
    const remain = totalBits - bits.length;
    if (remain < 0) return null;
    push(0, Math.min(4, remain));
    while (bits.length % 8 !== 0) bits.push(0);
    const pad = [0xec, 0x11];
    let p = 0;
    while (bits.length / 8 < cap) push(pad[(p++) % 2], 8);
    return bitsToBytes(bits.slice(0, totalBits));
  }

  function placeFinders(m, size) {
    function finder(x, y) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          const inPat = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
            const on = inPat && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
          m[yy][xx] = on ? 1 : 0;
        }
      }
    }
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);
  }

  function placeAlign(m, positions) {
    positions.forEach((y) => {
      positions.forEach((x) => {
        if ((x === 6 && y === 6) || (x === 6 && y === positions[positions.length - 1]) || (y === 6 && x === positions[positions.length - 1])) return;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            m[y + dy][x + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0;
          }
        }
      });
    });
  }

  function placeTiming(m, size) {
    for (let i = 8; i < size - 8; i++) {
      m[6][i] = i % 2 === 0 ? 1 : 0;
      m[i][6] = i % 2 === 0 ? 1 : 0;
    }
  }

  function reserved(size) {
    const r = Array.from({ length: size }, () => Array(size).fill(false));
    function mark(x, y, w, h) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (xx >= 0 && yy >= 0 && xx < size && yy < size) r[yy][xx] = true;
    }
    mark(0, 0, 9, 9);
    mark(size - 8, 0, 8, 9);
    mark(0, size - 8, 9, 8);
    mark(6, 0, 1, size);
    mark(0, 6, size, 1);
    return r;
  }

  function placeData(m, res, data) {
    const size = m.length;
    let bit = 0, dir = -1, col = size - 1;
    const bits = [];
    data.forEach((b) => {
      for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    });
    while (col > 0) {
      if (col === 6) col--;
      for (let i = 0; i < size; i++) {
        const y = dir < 0 ? size - 1 - i : i;
        for (let k = 0; k < 2; k++) {
          const x = col - k;
          if (!res[y][x] && m[y][x] == null) {
            m[y][x] = bits[bit++] || 0;
          }
        }
      }
      dir *= -1;
      col -= 2;
    }
  }

  function maskFn(id) {
    return [
      (x, y) => (x + y) % 2 === 0,
      (x, y) => y % 2 === 0,
      (x, y) => x % 3 === 0,
      (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
      (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
      (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
    ][id];
  }

  function applyMask(src, res, id) {
    const size = src.length;
    const m = src.map((row) => row.slice());
    const fn = maskFn(id);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!res[y][x]) m[y][x] ^= fn(x, y) ? 1 : 0;
      }
    }
    return m;
  }

  function formatBits(mask) {
    // ECC L = 01, mask 3 bits; format BCH
    let data = (0x01 << 3) | mask;
    let d = data << 10;
    const gen = 0x537;
    for (let i = 14; i >= 10; i--) {
      if ((d >> i) & 1) d ^= gen << (i - 10);
    }
    return (data << 10 | d) ^ 0x5412;
  }

  function placeFormat(m, mask) {
    const bits = formatBits(mask);
    const size = m.length;
    const seq = [];
    for (let i = 14; i >= 0; i--) seq.push((bits >> i) & 1);
    const pos = [
      [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
      [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]
    ];
    pos.forEach(([x, y], i) => { m[y][x] = seq[i]; });
    const pos2 = [
      [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4], [8, size - 5], [8, size - 6], [8, size - 7],
      [size - 8, 8], [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8], [size - 3, 8], [size - 2, 8], [size - 1, 8]
    ];
    pos2.forEach(([x, y], i) => { m[y][x] = seq[i]; });
    m[size - 8][8] = 1;
  }

  function scoreMask(m) {
    const size = m.length;
    let s = 0;
    for (let y = 0; y < size; y++) {
      let run = 1;
      for (let x = 1; x <= size; x++) {
        if (x < size && m[y][x] === m[y][x - 1]) run++;
        else { if (run >= 5) s += run - 2; run = 1; }
      }
    }
    for (let x = 0; x < size; x++) {
      let run = 1;
      for (let y = 1; y <= size; y++) {
        if (y < size && m[y][x] === m[y - 1][x]) run++;
        else { if (run >= 5) s += run - 2; run = 1; }
      }
    }
    return s;
  }

  function build(str) {
    let ver = 2;
    if (str.length > 24) ver = 3;
    if (str.length > 44) ver = 4;
    const info = VERS[ver];
    const data = encodeBytes(str, info.data);
    if (!data) return build(str.slice(0, 24));
    const ec = rsEncode(data, info.ec);
    const all = data.concat(ec);
    const size = info.size;
    const base = Array.from({ length: size }, () => Array(size).fill(null));
    placeFinders(base, size);
    placeTiming(base, size);
    placeAlign(base, info.align);
    base[4 * ver + 9] && (base[(4 * ver) + 9][8] = 1);
    const res = reserved(size);
    info.align.forEach((y) => info.align.forEach((x) => {
      if ((x === 6 && y === 6) || (x === 6 && y === info.align[info.align.length - 1]) || (y === 6 && x === info.align[info.align.length - 1])) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) res[y + dy][x + dx] = true;
    }));
    for (let i = 0; i < size; i++) res[i][6] = res[6][i] = true;
    placeData(base, res, all);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (base[y][x] == null) base[y][x] = 0;
    let best = null, bestScore = Infinity, bestId = 0;
    for (let id = 0; id < 8; id++) {
      const masked = applyMask(base, res, id);
      placeFormat(masked, id);
      const sc = scoreMask(masked);
      if (sc < bestScore) { bestScore = sc; best = masked; bestId = id; }
    }
    return { matrix: best, size: size, mask: bestId };
  }

  function toSvg(str, opt) {
    opt = opt || {};
    const q = build(String(str));
    const m = q.matrix, n = q.size;
    const pad = opt.pad == null ? 2 : opt.pad;
    const fg = opt.fg || "#062a38";
    const bg = opt.bg || "#fff6ea";
    let d = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (m[y][x]) d += "M" + (x + pad) + " " + (y + pad) + "h1v1h-1z";
      }
    }
    const dim = n + pad * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + " " + dim + '" shape-rendering="crispEdges" aria-hidden="true"><rect width="' + dim + '" height="' + dim + '" fill="' + bg + '"/><path fill="' + fg + '" d="' + d + '"/></svg>';
  }

  return { build, toSvg };
})();
