import { useCallback, useEffect, useRef, useState } from "react";
   import { ubicarPiezas } from "./ubicarPiezas";


const NUMEROS = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 8]; // frente -> fondo
const RUTA = "/Material/1x/Piezas/1x/";
const COMPLETO = "/Material/castillo.png";
const archivo = (n) => encodeURI(`${RUTA}Recurso ${n}.png`);
const SNAP = 24;   // distancia para que la pieza encaje
const PAD = 16;    // margen del escenario
const GAP = 24;    // separación entre tablero y bandeja
const BANDEJA = 1.3; // ancho de la bandeja = 1.3 x ancho del castillo

const cargarImagen = (src) =>
  new Promise((ok, fallo) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fallo(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });

const lienzo = (img) => {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx;
};


function recortar(img) {
  const ctx = lienzo(img), w = img.naturalWidth, h = img.naturalHeight;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  return { w: bw, h: bh, data: ctx.getImageData(x0, y0, bw, bh).data, tx: x0, ty: y0, iw: w, ih: h };
}

function acomodar(lista, W, H) {
  const TW = Math.round(W * BANDEJA);
  const x0 = PAD + W + GAP;
  let x = 0, y = 0, fila = 0;
  const mezcladas = [...lista].sort(() => Math.random() - 0.5);
  const pos = {};
  mezcladas.forEach((p) => {
    if (x + p.w > TW && x > 0) { x = 0; y += fila + 10; fila = 0; }
    pos[p.id] = { x: x0 + x, y: PAD + y };
    x += p.w + 10; fila = Math.max(fila, p.h);
  });
  const TH = y + fila;
  return { pos, SW: x0 + TW + PAD, SH: Math.max(H, TH) + PAD * 2 };
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Escena2() {
  const [info, setInfo] = useState(null); // { W, H, SW, SH }
  const [piezas, setPiezas] = useState([]);
  const [escala, setEscala] = useState(1);
  const [guia, setGuia] = useState(true);
  const [pista, setPista] = useState(null);
  const [movs, setMovs] = useState(0);
  const [seg, setSeg] = useState(0);
  const [dudosas, setDudosas] = useState([]);
  const [error, setError] = useState("");

  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const base = useRef([]);
  const drag = useRef(null);
  const zTop = useRef(100);

  const repartir = useCallback((lista, W, H) => {
    const { pos, SW, SH } = acomodar(lista, W, H);
    zTop.current = 100;
    setInfo({ W, H, SW, SH });
    setPiezas(lista.map((p) => ({ ...p, ...pos[p.id], z: ++zTop.current, locked: false, dragging: false })));
  }, []);

  
  useEffect(() => {
    (async () => {
      try {
        const imgs = await Promise.all(NUMEROS.map((n) => cargarImagen(archivo(n))));
        const rec = imgs.map(recortar);
        const completo = await cargarImagen(COMPLETO).catch(() => null);
        let W, H, homes;

        if (completo) {
          W = completo.naturalWidth; H = completo.naturalHeight;
          const ctx = lienzo(completo);
          const comp = { w: W, h: H, data: ctx.getImageData(0, 0, W, H).data };
          homes = ubicarPiezas(comp, rec);
        } else if (rec.every((r) => r.iw === rec[0].iw && r.ih === rec[0].ih)) {
          W = rec[0].iw; H = rec[0].ih;
          homes = rec.map((r) => ({ x: r.tx, y: r.ty, dudosa: false }));
        } else {
          throw new Error("Falta el castillo completo: guarda su PNG en public/Material/castillo.png (exportado a 1x).");
        }

        base.current = rec.map((r, i) => ({
          ...r, id: `p${NUMEROS[i]}`, n: NUMEROS[i], src: archivo(NUMEROS[i]),
          hx: PAD + homes[i].x, hy: PAD + homes[i].y, zFinal: NUMEROS.length - i,
        }));
        setDudosas(homes.map((h, i) => (h.dudosa ? NUMEROS[i] : null)).filter(Boolean));
        repartir(base.current, W, H);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [repartir]);

  
  useEffect(() => {
    if (!info || !wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setEscala(Math.min(e.contentRect.width / info.SW, 1.5)));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [info]);

  const colocadas = piezas.filter((p) => p.locked).length;
  const gano = piezas.length > 0 && colocadas === piezas.length;

  useEffect(() => {
    if (!info || gano) return;
    const t = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [info, gano]);

  const local = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    const k = r.width / info.SW;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };

  const alPresionar = (e) => {
    const { x, y } = local(e);
    const hit = piezas
      .filter((p) => !p.locked)
      .sort((a, b) => b.z - a.z)
      .find((p) => {
        const lx = Math.floor(x - p.x), ly = Math.floor(y - p.y);
        return lx >= 0 && ly >= 0 && lx < p.w && ly < p.h && p.data[(ly * p.w + lx) * 4 + 3] > 10;
      });
    if (!hit) return;
    stageRef.current.setPointerCapture(e.pointerId);
    drag.current = { id: hit.id, dx: x - hit.x, dy: y - hit.y };
    const z = ++zTop.current;
    setPiezas((ps) => ps.map((p) => (p.id === hit.id ? { ...p, z, dragging: true } : p)));
  };

  const alMover = (e) => {
    if (!drag.current) return;
    const { x, y } = local(e);
    const { id, dx, dy } = drag.current;
    setPiezas((ps) => ps.map((p) => (p.id === id ? { ...p, x: x - dx, y: y - dy } : p)));
  };

  const alSoltar = () => {
    if (!drag.current) return;
    const { id } = drag.current;
    drag.current = null;
    setMovs((m) => m + 1);
    setPiezas((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        return Math.hypot(p.x - p.hx, p.y - p.hy) < SNAP
          ? { ...p, x: p.hx, y: p.hy, z: p.zFinal, locked: true, dragging: false }
          : { ...p, dragging: false };
      })
    );
  };

  const reiniciar = () => { repartir(base.current, info.W, info.H); setMovs(0); setSeg(0); setPista(null); };

  const darPista = () => {
    const libres = piezas.filter((p) => !p.locked);
    if (!libres.length) return;
    setPista(libres[Math.floor(Math.random() * libres.length)].id);
    setTimeout(() => setPista(null), 2000);
  };

  if (error)
    return <div className="container py-4"><div className="alert alert-danger mb-0">{error}</div></div>;
  if (!info)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-3 mb-0">Preparando las piezas…</p>
      </div>
    );

  const { W, H, SW, SH } = info;
  const estiloPieza = (p) => ({
    width: p.w, height: p.h, backgroundImage: `url("${p.src}")`, backgroundRepeat: "no-repeat",
    backgroundSize: `${p.iw}px ${p.ih}px`, backgroundPosition: `-${p.tx}px -${p.ty}px`,
  });

  return (
    <div className="container-fluid py-3">
      <style>{`
        .pz { position:absolute; pointer-events:none; transition:left .15s ease-out, top .15s ease-out, transform .15s;
              filter:drop-shadow(0 3px 4px rgba(40,30,20,.35)); }
        .pz.arrastrando { transition:transform .15s; transform:scale(1.03); filter:drop-shadow(0 10px 12px rgba(40,30,20,.45)); }
        .pz.fija { filter:none; }
        .pz-pista { position:absolute; pointer-events:none; border:3px dashed #0d6efd; border-radius:6px;
                    animation:pz-pulso .7s ease-in-out infinite alternate; }
        @keyframes pz-pulso { from{opacity:.25} to{opacity:1} }
      `}</style>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h1 className="h4 mb-0">Arma el castillo</h1>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="badge text-bg-secondary fs-6">{fmt(seg)}</span>
          <span className="badge text-bg-secondary fs-6">{movs} movs</span>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="guia" checked={guia} onChange={(e) => setGuia(e.target.checked)} />
            <label className="form-check-label" htmlFor="guia">Silueta</label>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={darPista} disabled={gano}>Pista</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={reiniciar}>Reiniciar</button>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="progress flex-grow-1" style={{ height: 8 }}>
          <div className="progress-bar bg-success" style={{ width: `${(colocadas / piezas.length) * 100}%` }} />
        </div>
        <small className="text-body-secondary">{colocadas} de {piezas.length}</small>
      </div>

      {dudosas.length > 0 && (
        <div className="alert alert-warning py-2 small">
          No pude ubicar con certeza: Recurso {dudosas.join(", ")}. Revisa que <code>castillo.png</code> esté a 1x.
        </div>
      )}
      {gano && (
        <div className="alert alert-success d-flex justify-content-between align-items-center">
          <span>¡Castillo completo en {fmt(seg)} con {movs} movimientos!</span>
          <button className="btn btn-success btn-sm" onClick={reiniciar}>Jugar de nuevo</button>
        </div>
      )}

      <div ref={wrapRef} className="w-100">
        <div style={{ width: SW * escala, height: SH * escala, margin: "0 auto" }}>
          <div ref={stageRef} className="border rounded-3 bg-body-tertiary"
            onPointerDown={alPresionar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}
            style={{ position: "relative", width: SW, height: SH, transform: `scale(${escala})`,
              transformOrigin: "top left", touchAction: "none", cursor: "grab", userSelect: "none" }}>

            {/* Tablero */}
            <div className="bg-white border rounded-3" style={{ position: "absolute", left: PAD, top: PAD, width: W, height: H }} />
            {/* Bandeja */}
            <div className="border border-2 rounded-3"
              style={{ position: "absolute", left: PAD + W + GAP - 8, top: 8, right: 8, bottom: 8, borderStyle: "dashed" }} />

            {/* Silueta guía */}
            {guia && piezas.map((p) => (
              <div key={`g-${p.id}`} style={{ position: "absolute", left: p.hx, top: p.hy, pointerEvents: "none",
                filter: "brightness(0)", opacity: 0.08, ...estiloPieza(p) }} />
            ))}

            {/* Pista */}
            {piezas.filter((p) => p.id === pista).map((p) => (
              <div key="pista" className="pz-pista"
                style={{ left: p.hx - 4, top: p.hy - 4, width: p.w + 8, height: p.h + 8, zIndex: 9999 }} />
            ))}

            {/* Piezas */}
            {piezas.map((p) => (
              <div key={p.id} className={`pz ${p.dragging ? "arrastrando" : ""} ${p.locked ? "fija" : ""}`}
                style={{ left: p.x, top: p.y, zIndex: p.z, ...estiloPieza(p) }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
