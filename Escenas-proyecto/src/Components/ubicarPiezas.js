
const UMBRAL = 60; 

function aplanar(comp) {
  const d = new Uint8ClampedArray(comp.data);
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] < 128) { d[i] = 255; d[i + 1] = 0; d[i + 2] = 255; } // fondo = magenta
  return { w: comp.w, h: comp.h, d };
}


function interior(p) {
  const { w, h, data } = p, xs = [], ys = [];
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] >= 250;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (op(x, y) && op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1)) { xs.push(x); ys.push(y); }
  return { xs, ys };
}

function muestras(p, pts, paso, cw) {
  const idx = [];
  for (let k = 0; k < pts.xs.length; k++)
    if (pts.xs[k] % paso === 0 && pts.ys[k] % paso === 0) idx.push(k);
  const n = idx.length;
  const off = new Int32Array(n), r = new Uint8Array(n), g = new Uint8Array(n), b = new Uint8Array(n);
  idx.forEach((k, i) => {
    const px = pts.xs[k], py = pts.ys[k], j = (py * p.w + px) * 4;
    off[i] = py * cw + px; r[i] = p.data[j]; g[i] = p.data[j + 1]; b[i] = p.data[j + 2];
  });
  return { n, off, r, g, b };
}

function evaluar(C, cub, S, ox, oy, usarCub) {
  const base = oy * C.w + ox, d = C.d, n0 = S.n;
  let n = 0, bad = 0;
  for (let k = 0; k < n0; k++) {
    const idx = base + S.off[k];
    if (usarCub && cub[idx]) continue;
    const j = idx << 2;
    const dif = Math.abs(d[j] - S.r[k]) + Math.abs(d[j + 1] - S.g[k]) + Math.abs(d[j + 2] - S.b[k]);
    n++;
    if (dif > UMBRAL) bad++;
  }
  return { n, bad };
}

function buscar(C, cub, p, pts, usarCub) {
  const maxX = C.w - p.w, maxY = C.h - p.h;
  if (maxX < 0 || maxY < 0 || pts.xs.length === 0) return null;

  const sc = Math.max(1, Math.floor(Math.sqrt(pts.xs.length / 400)));
  const paso = sc === 1 ? 1 : Math.min(4, Math.ceil(sc * 0.75));
  const S = muestras(p, pts, sc, C.w);
  const minN = Math.max(10, Math.floor(S.n * 0.12));

  
  const top = [];
  for (let oy = 0; oy <= maxY; oy += paso)
    for (let ox = 0; ox <= maxX; ox += paso) {
      const r = evaluar(C, cub, S, ox, oy, usarCub);
      if (r.n < minN) continue;
      const score = (r.bad + 1) / r.n;
      const cerca = top.findIndex((t) => Math.abs(t.ox - ox) <= paso * 3 && Math.abs(t.oy - oy) <= paso * 3);
      if (cerca >= 0) {
        if (score < top[cerca].score) top[cerca] = { ox, oy, score };
      } else if (top.length < 5) top.push({ ox, oy, score });
      else {
        let peor = 0;
        for (let i = 1; i < top.length; i++) if (top[i].score > top[peor].score) peor = i;
        if (score < top[peor].score) top[peor] = { ox, oy, score };
      }
    }
  if (!top.length) return null;

  
  const F = muestras(p, pts, Math.max(1, Math.floor(sc / 4)), C.w);
  const minF = Math.max(10, Math.floor(F.n * 0.12));
  let mejor = null;
  for (const t of top)
    for (let dy = -paso - 1; dy <= paso + 1; dy++)
      for (let dx = -paso - 1; dx <= paso + 1; dx++) {
        const ox = t.ox + dx, oy = t.oy + dy;
        if (ox < 0 || oy < 0 || ox > maxX || oy > maxY) continue;
        const r = evaluar(C, cub, F, ox, oy, usarCub);
        if (r.n < minF) continue;
        const score = (r.bad + 1) / r.n;
        if (!mejor || score < mejor.score) mejor = { x: ox, y: oy, score, calidad: r.bad / r.n, visible: r.n / F.n };
      }
  return mejor;
}

export function ubicarPiezas(comp, piezas) {
  const C = aplanar(comp);
  const cub = new Uint8Array(C.w * C.h);
  return piezas.map((p) => {
    const pts = interior(p);
    let r = buscar(C, cub, p, pts, true);
    if (!r || r.calidad > 0.1 || r.visible < 0.5) {
      
      const r2 = buscar(C, cub, p, pts, false);
      if (r2 && (!r || r2.calidad + 0.05 < r.calidad || (r.visible < 0.5 && r2.calidad <= 0.1 && r2.calidad <= r.calidad + 0.05 && r2.visible > r.visible))) r = r2;
    }
    if (!r) return { x: 0, y: 0, calidad: 1, dudosa: true };
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++)
        if (p.data[(y * p.w + x) * 4 + 3] > 10)
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const cx = r.x + x + dx, cy = r.y + y + dy;
              if (cx >= 0 && cy >= 0 && cx < C.w && cy < C.h) cub[cy * C.w + cx] = 1;
            }
    return { x: r.x, y: r.y, calidad: r.calidad, dudosa: r.calidad > 0.2 };
  });
}
