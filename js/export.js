/* Ergebnis als Bild speichern, nur im Browser, ohne externe Dienste. */
window.StadtExport = (function () {
  "use strict";

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function bar(ctx, x, y, w, h, pct, color) {
    ctx.fillStyle = "rgba(11,74,92,0.12)";
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    const pw = Math.max(8, (w * pct) / 100);
    ctx.fillStyle = color;
    roundRect(ctx, x, y, pw, h, h / 2);
    ctx.fill();
  }

  function draw(opts) {
    const w = 1080, h = 1680;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#4f90b3");
    g.addColorStop(0.22, "#8ec4d8");
    g.addColorStop(0.48, "#fff6ea");
    g.addColorStop(1, "#ebd7b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#fffaf1";
    roundRect(ctx, 60, 70, w - 120, h - 140, 36);
    ctx.shadowColor = "rgba(6,42,56,0.18)";
    ctx.shadowBlur = 28;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#0b4a5c";
    ctx.font = "700 28px 'Nunito Sans', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STADTSPIEL  ·  NEUSTADT IN HOLSTEIN", w / 2, 140);

    ctx.font = "700 52px Fraunces, Georgia, serif";
    ctx.fillStyle = "#142228";
    ctx.fillText("Deine Stadtplanung · 2040", w / 2, 210);

    const score = opts.score || 0;
    ctx.beginPath();
    ctx.arc(w / 2, 360, 92, 0, Math.PI * 2);
    ctx.fillStyle = opts.band === "hoch" ? "#1f7a5c" : opts.band === "krise" ? "#c44b38" : opts.band === "druck" ? "#c46a3a" : "#17687c";
    ctx.fill();
    ctx.fillStyle = "#fff6ea";
    ctx.font = "700 72px Fraunces, Georgia, serif";
    ctx.fillText(String(score), w / 2, 385);
    ctx.font = "700 22px 'Nunito Sans', sans-serif";
    ctx.fillText("Punkte", w / 2, 418);

    ctx.fillStyle = "#3b4f57";
    ctx.font = "600 28px 'Nunito Sans', sans-serif";
    ctx.fillText(opts.title || "Auswertung", w / 2, 500);

    const wrap = (text, max, font, x, y, lineH, color) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      const words = String(text || "").split(/\s+/);
      let line = "", yy = y;
      words.forEach((word) => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > max) {
          ctx.fillText(line, x, yy);
          line = word;
          yy += lineH;
        } else line = test;
      });
      if (line) ctx.fillText(line, x, yy);
      return yy;
    };

    let y = wrap(opts.text || "", 860, "400 26px 'Nunito Sans', sans-serif", 110, 545, 36, "#142228");
    y += 36;
    ctx.textAlign = "left";
    const stats = opts.stats || {};
    const rows = [
      ["Wohnen", stats.wohnen || 0, "#c46a3a"],
      ["Grün & Klima", stats.gruen || 0, "#2a6b4d"],
      ["Wirtschaft", stats.wirtschaft || 0, "#1b6f86"]
    ];
    rows.forEach((row) => {
      ctx.fillStyle = "#3b4f57";
      ctx.font = "800 22px 'Nunito Sans', sans-serif";
      ctx.fillText(row[0], 110, y + 18);
      bar(ctx, 340, y, 520, 22, row[1], row[2]);
      ctx.textAlign = "right";
      ctx.fillText(String(row[1]), 970, y + 18);
      ctx.textAlign = "left";
      y += 48;
    });

    y += 10;
    ctx.fillStyle = "#5b7179";
    ctx.font = "600 24px 'Nunito Sans', sans-serif";
    ctx.fillText("Kasse am Ende: " + (opts.budget != null ? opts.budget : "–"), 110, y);
    y += 50;

    if (opts.choices && opts.choices.length) {
      ctx.fillStyle = "#0b4a5c";
      ctx.font = "700 26px Fraunces, Georgia, serif";
      ctx.fillText("Entscheidungen", 110, y);
      y += 34;
      ctx.font = "400 22px 'Nunito Sans', sans-serif";
      ctx.fillStyle = "#142228";
      opts.choices.slice(0, 8).forEach((c) => {
        const line = (c.year || "") + "  " + (c.label || "");
        const t = line.length > 62 ? line.slice(0, 60) + "…" : line;
        ctx.fillText(t, 110, y);
        y += 30;
      });
      if (opts.choices.length > 8) {
        ctx.fillStyle = "#5b7179";
        ctx.fillText("… und " + (opts.choices.length - 8) + " weitere", 110, y);
        y += 30;
      }
    }

    y = Math.max(y + 30, 1320);
    ctx.fillStyle = "#0b4a5c";
    ctx.font = "700 22px 'Nunito Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Ergebniscode", 110, y);
    ctx.font = "800 36px 'Nunito Sans', ui-monospace, monospace";
    ctx.fillStyle = "#062a38";
    ctx.fillText(opts.code || "", 110, y + 48);

    ctx.font = "400 18px 'Nunito Sans', sans-serif";
    ctx.fillStyle = "#5b7179";
    ctx.fillText("Lokal erzeugt · ohne Server · StadtSpiel", 110, 1568);

    return canvas;
  }

  function downloadCanvas(canvas, name) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Bild konnte nicht erzeugt werden")); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name || "stadtspiel-neustadt-2040.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        resolve();
      }, "image/png");
    });
  }

  return { draw, downloadCanvas };
})();
