import React, { useState, useEffect, useRef } from "react";
import lottie from "lottie-web";
import leonAnimation from "../assets/LeonCaminando.json";
import fondoVerde from "../assets/Verde.png";
import cieloImg from "../assets/Cielo.png";



const ASSETS = {
  fondoDesierto: encodeURI("/Material/1x/Fondo desierto.png"),
  arbolSeco: encodeURI("/Material/1x/arbol.png"),
  arbolBueno: encodeURI("/Material/1x/Arbol bueno.png"),
  casaRuinas: encodeURI("/Material/1x/Ruinas casa.png"),
  casaBuena: encodeURI("/Material/1x/Casa buena.png"),
};

const HOLD_FRAME = null; 
const SKIP_INTRO = false; 
const AUTO_CROP = true;    

const SKY = {
  speedVwPerSec: 4.9,
  mirror: true, 
};

const AJUSTES = {
  arbolSeco: { y: 0, scale: 1 },
  arbolBueno: { y: 0, scale: 1 },
  casaRuinas: { y: 0, scale: 1 },
  casaBuena: { y: 0, scale: 1 },
};

const DEBUG_LAYOUT = false;

/* --- Nuevo texto con la historia del reloj y el conocimiento de los años --- */
const TEXTO_HISTORIA =
  "En el reloj ancestral se almacena el conocimiento de los años. Al activarlo, su sabiduría milenaria nos enseña el camino y los secretos para reconstruir este mundo desolado.";



function useSkyBehind(src) {
  const [behind, setBehind] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 40;
        c.height = 40;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 40, 40);
        setBehind([8, 20, 32].every((x) => ctx.getImageData(x, 1, 1, 1).data[3] < 200));
      } catch {
        setBehind(false);
      }
    };
    img.onerror = () => setBehind(false);
    img.src = src;
  }, [src]);
  return behind;
}

const Cielo = ({ behind }) => {
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const [dur, setDur] = useState(120);
  const periodTiles = SKY.mirror ? 2 : 1;

  useEffect(() => {
    const update = () => {
      const box = boxRef.current;
      const img = imgRef.current;
      if (!box || !img || !img.naturalWidth) return;
      const tileW = box.clientHeight * (img.naturalWidth / img.naturalHeight);
      const pxPerSec = (window.innerWidth * SKY.speedVwPerSec) / 100;
      setDur((tileW * periodTiles) / pxPerSec);
    };
    update();
    window.addEventListener("resize", update);
    const img = imgRef.current;
    img?.addEventListener("load", update);
    return () => {
      window.removeEventListener("resize", update);
      img?.removeEventListener("load", update);
    };
  }, [periodTiles]);

  return (
    <div ref={boxRef} className={`cielo ${behind ? "cielo--detras" : "cielo--encima"}`} aria-hidden="true">
      <div
        className="cielo__track"
        style={{
          "--cielo-dur": `${dur}s`,
          "--cielo-shift": SKY.mirror ? "25%" : "12.5%",
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <img
            key={i}
            ref={i === 0 ? imgRef : undefined}
            src={cieloImg}
            alt=""
            draggable={false}
            style={SKY.mirror && i % 2 ? { transform: "scaleX(-1)" } : undefined}
          />
        ))}
      </div>
    </div>
  );
};

const capa = (a) => ({
  transform: `translateY(${a.y}%) scale(${a.scale})`,
  transformOrigin: "50% 100%",
});



const Escena1 = ({ onNext }) => {
  const [showModal, setShowModal] = useState(false);
  const [started, setStarted] = useState(false);

  const [houseRebuilt, setHouseRebuilt] = useState(false);
  const [treeRebuilt, setTreeRebuilt] = useState(false);

  const [leonReady, setLeonReady] = useState(false);
  const [leonAspect, setLeonAspect] = useState(1);
  const [cropped, setCropped] = useState(false);

  const lottieContainerRef = useRef(null);
  const skyBehind = useSkyBehind(ASSETS.fondoDesierto);

  const restored = Number(houseRebuilt) + Number(treeRebuilt);
  const allDone = restored === 2;
  const greenOpacity = restored / 2;

  useEffect(() => {
    const host = lottieContainerRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const anim = lottie.loadAnimation({
      container: host,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: leonAnimation,
      rendererSettings: { preserveAspectRatio: "xMidYMax meet" },
    });

    let hold = 0;
    let frozen = false;
    let initialized = false;

    const freeze = () => {
      if (frozen) return;
      frozen = true;
      anim.goToAndStop(hold, true);
    };

    const init = () => {
      if (initialized) return;
      initialized = true;

      const total = Math.max(1, Math.floor(anim.totalFrames));
      const svg = host.querySelector("svg");
      const root = svg && svg.querySelector(":scope > g");
      const W = leonAnimation.w;
      const H = leonAnimation.h;

      let first = -1;
      let last = -1;
      let box = null;

      try {
        if (root && root.getBBox) {
          for (let f = 0; f < total; f++) {
            anim.goToAndStop(f, true);
            const b = root.getBBox();
            if (b.width * b.height < 4) continue;
            if (first < 0) first = f;
            last = f;
            const x1 = Math.max(0, b.x);
            const y1 = Math.max(0, b.y);
            const x2 = Math.min(W, b.x + b.width);
            const y2 = Math.min(H, b.y + b.height);
            box = box
              ? { x1: Math.min(box.x1, x1), y1: Math.min(box.y1, y1), x2: Math.max(box.x2, x2), y2: Math.max(box.y2, y2) }
              : { x1, y1, x2, y2 };
          }
        }
      } catch {
        first = -1;
      }

      if (first < 0) {
        first = 0;
        last = Math.max(0, total - 2);
        box = null;
      }

      hold = HOLD_FRAME ?? Math.max(first, last - 1);

      if (AUTO_CROP && box && svg) {
        const bw = box.x2 - box.x1;
        const bh = box.y2 - box.y1;
        const pad = 0.04;
        const vx = box.x1 - bw * pad;
        const vy = box.y1 - bh * pad;
        const vw = bw * (1 + pad * 2);
        const vh = bh * (1 + pad * 2);
        svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
        setLeonAspect(vw / vh);
        setCropped(true);
      }

      setLeonReady(true);

      anim.addEventListener("enterFrame", (e) => {
        if (e.currentTime >= hold) freeze();
      });
      anim.addEventListener("complete", freeze);

      if (reduce || SKIP_INTRO) {
        freeze();
      } else {
        anim.goToAndPlay(first, true);
      }
    };

    anim.addEventListener("DOMLoaded", init);
    if (anim.isLoaded) init();

    return () => anim.destroy();
  }, []);

  const closeStory = () => {
    setShowModal(false);
    setStarted(true);
  };

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === "Escape" && closeStory();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  /* --- Textos de diálogo actualizados --- */
  let dialogo;
  if (allDone) dialogo = "¡Lo lograste! El conocimiento del reloj restauró el pueblo.";
  else if (started) dialogo = "Aplica la sabiduría del reloj: toca el árbol y la casa.";
  else dialogo = "El reloj ancestral guarda el conocimiento de los años... Toca aquí.";

  return (
    <div className={`escena1 ${DEBUG_LAYOUT ? "escena1--debug" : ""}`}>
      <style>{estilos}</style>

      {/* ===== CIELO + FONDOS ===== */}
      {skyBehind === true && <Cielo behind />}

      <div className="escena1__bg" style={{ backgroundImage: `url('${ASSETS.fondoDesierto}')`, zIndex: 1 }} />
      <div
        className="escena1__bg escena1__bg--verde"
        style={{ backgroundImage: `url('${fondoVerde}')`, opacity: greenOpacity, zIndex: 2 }}
      />

      {skyBehind === false && <Cielo />}

      
      {started && (
        <>
          <button
            type="button"
            className="item item--arbol"
            onClick={() => setTreeRebuilt(true)}
            disabled={treeRebuilt}
            aria-label={treeRebuilt ? "Árbol restaurado" : "Restaurar el árbol"}
          >
            <img
              src={ASSETS.arbolSeco}
              alt=""
              className="item__capa"
              style={{ ...capa(AJUSTES.arbolSeco), opacity: treeRebuilt ? 0 : 1 }}
            />
            <img
              src={ASSETS.arbolBueno}
              alt=""
              className="item__capa"
              style={{ ...capa(AJUSTES.arbolBueno), opacity: treeRebuilt ? 1 : 0 }}
            />
          </button>

          <button
            type="button"
            className="item item--casa"
            onClick={() => setHouseRebuilt(true)}
            disabled={houseRebuilt}
            aria-label={houseRebuilt ? "Casa restaurada" : "Restaurar la casa"}
          >
            <img
              src={ASSETS.casaRuinas}
              alt=""
              className="item__capa"
              style={{ ...capa(AJUSTES.casaRuinas), opacity: houseRebuilt ? 0 : 1 }}
            />
            <img
              src={ASSETS.casaBuena}
              alt=""
              className="item__capa"
              style={{ ...capa(AJUSTES.casaBuena), opacity: houseRebuilt ? 1 : 0 }}
            />
          </button>
        </>
      )}

      
      <div
        className={`leon ${leonReady ? "leon--listo" : ""} ${cropped ? "" : "leon--sinrecorte"}`}
        style={{ "--leon-ar": leonAspect }}
      >
        <div className="bubble-wrap">
          {started ? (
            <div className="bubble" role="status" aria-live="polite">
              <p>{dialogo}</p>
              {allDone && onNext && (
                <button type="button" className="btn btn-warning btn-sm mt-2" onClick={onNext}>
                  Continuar
                </button>
              )}
            </div>
          ) : (
            <button type="button" className="bubble bubble--accion" onClick={() => setShowModal(true)}>
              <p>{dialogo}</p>
              <small>👆 Toca aquí para ver la sabiduría del reloj</small>
            </button>
          )}
        </div>

        <div ref={lottieContainerRef} className="leon__anim" role="img" aria-label="Sr. León" />
      </div>

     
      {showModal && (
        <div className="modal-fondo" onClick={closeStory}>
          <div
            className="modal-caja"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-historia"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 id="titulo-historia" className="m-0 fw-bold text-danger">
                La Sabiduría del Reloj
              </h5>
              <button className="btn-close" aria-label="Cerrar" onClick={closeStory} />
            </div>
            <p>"{TEXTO_HISTORIA}"</p>
            <div className="text-end">
              <button className="btn btn-dark btn-sm" onClick={closeStory}>
                Comenzar restauración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const estilos = `
.escena1 {
  /* León ajustado: un poco más grandecito y naciendo desde más abajo */
  --leon-alto: clamp(420px, 68vh, 820px);  
  --leon-x: 50%;                            
  --leon-y: -30px;                          
  
  /* Árbol y Casa */
  --arbol-alto: 72vh;
  --arbol-izq: -2%;                         
  
  --casa-lado: min(65vh, 48vw);
  --casa-der: 0%;                           
  --casa-abajo: 22%;                        

  /* Cielo */
  --horizonte: 38%;                        
  --cielo-alto: 55%;                       

  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

/* Fondos */
.escena1__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.escena1__bg--verde { transition: opacity 1.6s ease-in-out; }

/* Cielo */
.cielo { position: absolute; top: 0; left: 0; right: 0; overflow: hidden; pointer-events: none; }
.cielo--detras { height: var(--cielo-alto); z-index: 0; }
.cielo--encima {
  height: var(--horizonte);
  z-index: 3;
  -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 80%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 0, #000 80%, transparent 100%);
}
.cielo__track {
  display: flex;
  height: 100%;
  width: max-content;
  animation: cielo-mover var(--cielo-dur, 120s) linear infinite;
  will-change: transform;
}
.cielo__track img { height: 100%; width: auto; flex: none; display: block; }
@keyframes cielo-mover {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(var(--cielo-shift) * -1)); }
}

/* León */
.leon {
  position: absolute;
  left: var(--leon-x);
  bottom: var(--leon-y);
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
  visibility: hidden;            
}
.leon--listo { visibility: visible; }
.leon__anim {
  height: min(var(--leon-alto), calc(78vw / var(--leon-ar)));
  aspect-ratio: var(--leon-ar);
}
.leon--sinrecorte .leon__anim { height: calc(var(--leon-alto) * 2.4); aspect-ratio: 1 / 1; }

/* Globo de texto sobre la cabeza de León */
.bubble-wrap {
  position: absolute;
  left: 0; right: 0; bottom: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.bubble {
  position: relative;
  width: min(320px, 86vw);
  margin-bottom: 12px;
  padding: 14px 16px;
  text-align: left;
  color: #fff;
  background: #212529;
  border: 2px solid #ffc107;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  pointer-events: auto;
  animation: bubbleIn .4s ease-out both;
}
.bubble p { margin: 0; font-size: 1rem; }
.bubble small { display: block; margin-top: 6px; color: #ffc107; }
.bubble::after {                    
  content: "";
  position: absolute;
  left: 50%; bottom: -10px;
  margin-left: -8px;
  border: 8px solid transparent;
  border-top-color: #ffc107;
  border-bottom: 0;
}
.bubble--accion { cursor: pointer; font: inherit; }
.bubble--accion:hover { filter: brightness(1.15); }
@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}

/* Árbol y casa */
.item {
  position: absolute;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  z-index: 10;
  transition: transform .3s ease, filter .3s ease;
}
.item:disabled { cursor: default; }
.item:not(:disabled):hover,
.item:not(:disabled):focus-visible {
  transform: scale(1.03);
  filter: brightness(1.1) drop-shadow(0 0 8px rgba(255,255,255,.45));
  outline: none;
}
.item__capa {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 100%;           
  pointer-events: none;
  transition: opacity .9s ease-in-out;
}
.item--arbol {
  left: var(--arbol-izq);
  bottom: 0;
  height: var(--arbol-alto);
  width: calc(var(--arbol-alto) * .42);
}
.item--casa {
  right: var(--casa-der);
  bottom: var(--casa-abajo);
  width: var(--casa-lado);
  height: var(--casa-lado);
}

/* Modal */
.modal-fondo {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.7);
  z-index: 100;
}
.modal-caja {
  width: 90%;
  max-width: 500px;
  padding: 24px;
  color: #212529;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5);
}

/* Depuración de layout */
.escena1--debug .item,
.escena1--debug .item__capa { outline: 1px dashed red; }
.escena1--debug .leon__anim { outline: 1px dashed cyan; }

/* Pantallas pequeñas */
@media (max-width: 640px) {
  .escena1 { --casa-der: 0; --casa-abajo: 30%; --casa-lado: 70vw; }
  .bubble::after { display: block; }
}

@media (prefers-reduced-motion: reduce) {
  .cielo__track { animation: none !important; }
  .bubble { animation: none !important; }
  .escena1 * { transition-duration: .01ms !important; }
}
`;

export default Escena1;