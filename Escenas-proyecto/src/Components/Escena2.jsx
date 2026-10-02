import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";

const NUMEROS = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 8];
const RUTA = "/Material/1x/Piezas/1x/";
const archivo = (n) => encodeURI(`${RUTA}Recurso ${n}.png`);
const CAPAS = NUMEROS.map((n) => `recurso-${n}`);
const SNAP = 35; 
const ALTO_BANDEJA = 500; // Espacio vertical generoso para la zona inferior de piezas

const cargarImagen = (src) =>
  new Promise((ok, fallo) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fallo(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });

function analizar(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
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
  const alpha = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++)
      alpha[y * bw + x] = d[((y + y0) * w + (x + x0)) * 4 + 3];
  return { bx: x0, by: y0, bw, bh, alpha };
}

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Escena2() {
  const [dim, setDim] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [guia, setGuia] = useState(true);
  const [pista, setPista] = useState(null);
  const [movs, setMovs] = useState(0);
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState("");

  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const base = useRef([]);
  const drag = useRef(null);
  const zTop = useRef(100);

  const repartir = useCallback((lista, W, H, stageH) => {
    zTop.current = 100;
    return lista
      .map((p) => ({
        ...p,
        x: Math.random() * Math.max(10, W - p.bw - 40) + 20,
        y: H + 20 + Math.random() * Math.max(10, stageH - H - p.bh - 40),
        z: ++zTop.current,
        locked: false,
        dragging: false,
      }))
      .sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const imgs = await Promise.all(NUMEROS.map((n) => cargarImagen(archivo(n))));
        const W_real = imgs[0].naturalWidth;
        const H = imgs[0].naturalHeight;
        
        const screenW = Math.max(window.innerWidth - 32, W_real + 400);
        const offsetX = (screenW - W_real) / 2;
        const stageH = H + ALTO_BANDEJA;

        base.current = imgs
          .map((img, i) => {
            const a = analizar(img);
            return a && { 
              id: CAPAS[i], 
              src: archivo(NUMEROS[i]), 
              zFinal: CAPAS.length - i, 
              ...a, 
              bx: a.bx + offsetX 
            };
          })
          .filter(Boolean);

        setDim({ W: screenW, H, W_real, offsetX, stageH });
        setPiezas(repartir(base.current, screenW, H, stageH));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [repartir]);

  useEffect(() => {
    const handleResize = () => {
      if (!base.current.length || !dim) return;
      const screenW = Math.max(window.innerWidth - 32, dim.W_real + 400);
      const offsetX = (screenW - dim.W_real) / 2;
      const stageH = dim.H + ALTO_BANDEJA;

      base.current = base.current.map(p => {
        const relBx = p.bx - dim.offsetX;
        return { ...p, bx: relBx + offsetX };
      });

      setDim(d => ({ ...d, W: screenW, offsetX }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dim]);

  const colocadas = piezas.filter((p) => p.locked).length;
  const gano = piezas.length > 0 && colocadas === piezas.length;

  useEffect(() => {
    if (!dim || gano) return;
    const t = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [dim, gano]);

  const local = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const alPresionar = (e) => {
    const { x, y } = local(e);
    const hit = piezas
      .filter((p) => !p.locked)
      .sort((a, b) => b.z - a.z)
      .find((p) => {
        const lx = Math.floor(x - p.x), ly = Math.floor(y - p.y);
        return lx >= 0 && ly >= 0 && lx < p.bw && ly < p.bh && p.alpha[ly * p.bw + lx] > 10;
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
        const encaja = Math.hypot(p.x - p.bx, p.y - p.by) < SNAP;
        return encaja
          ? { ...p, x: p.bx, y: p.by, z: p.zFinal, locked: true, dragging: false }
          : { ...p, dragging: false };
      })
    );
  };

  const reiniciar = () => {
    setPiezas(repartir(base.current, dim.W, dim.H, dim.stageH));
    setMovs(0); setSeg(0); setPista(null);
  };

  const darPista = () => {
    const libres = piezas.filter((p) => !p.locked);
    if (!libres.length) return;
    const p = libres[Math.floor(Math.random() * libres.length)];
    setPista(p.id);
    setTimeout(() => setPista(null), 2000);
  };

  if (error)
    return (
      <div className="min-h-screen bg-white text-red-600 flex items-center justify-center p-6 text-center">
        <p className="text-xs font-bold">{error}</p>
      </div>
    );

  if (!dim)
    return (
      <div className="min-h-screen bg-white text-slate-700 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-3 border-slate-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-medium">Cargando tablero amplio...</p>
      </div>
    );

  const { W, H, W_real, offsetX, stageH } = dim;
  const pct = Math.round((colocadas / piezas.length) * 100);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none px-3 py-2 w-full">
      <style>{`
        .pz-pieza { position:absolute; pointer-events:none; will-change:left,top;
          transition:left .15s ease-out, top .15s ease-out, filter .15s, transform .15s;
          filter:drop-shadow(0 3px 5px rgba(0,0,0,0.18)); }
        .pz-pieza.pz-arrastrando { transition:filter .15s, transform .15s;
          transform:scale(1.02); filter:drop-shadow(0 8px 12px rgba(0,0,0,0.25)); }
        .pz-pieza.pz-fija { filter:none; }
        .pz-pista { position:absolute; pointer-events:none; border:3px dashed #3b82f6;
          border-radius:6px; animation:pz-pulso .7s ease-in-out infinite alternate; }
        @keyframes pz-pulso { from{opacity:.3} to{opacity:1} }
      `}</style>

      {/* Encabezado ultra pequeño y minimalista */}
      <header className="w-full flex items-center justify-between py-1 px-2 mb-1 border-b border-slate-100 text-xs">
        <h1 className="text-sm font-bold text-slate-800 tracking-tight">
          Arma el castillo
        </h1>

        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
            {fmt(seg)}
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
            {movs} movs
          </span>
          <label className="flex items-center gap-1 cursor-pointer bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            <input 
              type="checkbox" 
              checked={guia} 
              onChange={(e) => setGuia(e.target.checked)} 
              className="accent-blue-600 rounded scale-75" 
            />
            <span className="text-slate-600">Silueta</span>
          </label>
          <button 
            onClick={darPista} 
            disabled={gano} 
            className="px-2 py-0.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded text-[11px] font-medium transition-all disabled:opacity-40"
          >
            Pista
          </button>
          <button 
            onClick={reiniciar} 
            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium transition-all"
          >
            Reiniciar
          </button>
        </div>
      </header>

      {/* Barra de progreso ultra compacta */}
      <div className="w-full flex items-center gap-2 mb-2 px-2">
        <div className="flex-1 bg-slate-100 border border-slate-200 rounded-full h-1 overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{colocadas} de {piezas.length}</span>
      </div>

      {/* Modal de Victoria */}
      {gano && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-50 p-4">
          <div className="p-3 bg-blue-100 border border-blue-300 rounded-xl text-blue-600 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">¡Castillo Armado con Éxito!</h2>
          <p className="text-xs text-slate-600 text-center">
            Completado en <span className="text-blue-600 font-mono font-bold">{fmt(seg)}</span> con <span className="text-slate-900 font-mono font-bold">{movs} movimientos</span>.
          </p>
          <button onClick={reiniciar} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition-all">
            Jugar de Nuevo
          </button>
        </div>
      )}

      {/* Tablero amplio de pantalla completa con piezas a tamaño real original */}
      <div ref={wrapRef} className="w-full flex-1 flex justify-center pb-4 overflow-x-auto">
        <div
          ref={stageRef}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          style={{
            width: W,
            height: stageH,
            position: "relative",
            touchAction: "none",
            cursor: "grab",
            userSelect: "none",
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl shadow-md overflow-hidden"
        >
          {/* Zona de Ensamblaje del Castillo (centrada en el ancho amplio) */}
          <div 
            style={{ position: "absolute", left: offsetX, top: 0, width: W_real, height: H }} 
            className="bg-white border-b border-l border-r border-slate-200 flex items-center justify-center shadow-inner"
          >
            {!guia && (
              <span className="text-[11px] text-slate-300 font-mono uppercase tracking-widest pointer-events-none">Zona de Ensamblaje</span>
            )}
          </div>

          {/* Silueta guía */}
          {guia && piezas.map((p) => (
            <img
              key={`g-${p.id}`}
              src={p.src}
              alt=""
              draggable={false}
              width={W_real}
              height={H}
              style={{
                position: "absolute",
                left: offsetX,
                top: 0,
                filter: "brightness(0) invert(0.85)",
                opacity: 0.15,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Pista */}
          {piezas.filter((p) => p.id === pista).map((p) => (
            <div
              key="pista"
              className="pz-pista"
              style={{ left: p.bx - 3, top: p.by - 3, width: p.bw + 6, height: p.bh + 6, zIndex: 9999 }}
            />
          ))}

          {/* Piezas del Rompecabezas */}
          {piezas.map((p) => (
            <div
              key={p.id}
              className={`pz-pieza ${p.dragging ? "pz-arrastrando" : ""} ${p.locked ? "pz-fija" : ""}`}
              style={{
                left: p.x,
                top: p.y,
                width: p.bw,
                height: p.bh,
                zIndex: p.z,
                backgroundImage: `url(${p.src})`,
                backgroundSize: `${W_real}px ${H}px`,
                backgroundPosition: `-${p.bx - offsetX}px -${p.by}px`,
                backgroundRepeat: "no-repeat",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}