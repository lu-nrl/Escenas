import React, { useState, useEffect, useRef, useCallback } from "react";
import lottie from "lottie-web";
import fondo1Data from "../assets/Fondo1.json";
import fondo2Data from "../assets/Fondo2.json";
import manoRelojData from "../assets/ManoReloj.json";
import columnasImg from "../assets/Columnas.png";
import temploImg from "../assets/Templo.png";
import tiendasImg from "../assets/Tiendas.png";


const ASPECTO = (fondo2Data.w || 1920) / (fondo2Data.h || 1080);
const INTRO_CORTE = 0.4;
const VELOCIDAD_INTRO = 1;
const DURACION_TRANSICION_MS = 1300;
const MANO_CORTE = 0.5;
const VELOCIDAD_MANO = 1.6;
// tamaños de los objetos interactivos en el escenario y eso
const OBJETOS = {
  columnas: { left: -1, top: 0, width: 18.35, height: 90.8 },
  templo: { left: 38.17, top: 17.05, width: 30.46, height: 40.3 },
  tiendas: { left: 84.65, top: 50, width: 18.35, height: 41.6 },
};

const RELOJ = { left: 39.5, top: 81, size: 8 };
// Contenido de textos informativos de cada ruina
const TEXTOS = {
  columnas: {
    titulo: "Columnas Sagradas",
    sub: "Los órdenes arquitectónicos",
    cuerpo: "Las columnas no solo sostenían el techo: expresaban orden, proporción y poder.",
    datos: [
      ["Grecia", "Sostenían el peso real de los templos y se dividían en tres órdenes clásicos bien definidos: Dórico, Jónico y Corintio."],
      ["Roma", "Adoptaron los órdenes griegos y sumaron el toscano y el compuesto; las usaron junto a arcos y bóvedas."],
    ],
    img: columnasImg,
  },
  templo: {
    titulo: "Templo Antiguo",
    sub: "Casa de los dioses",
    cuerpo: "El templo era la morada de la divinidad, no un lugar de reunión para los fieles.",
    datos: [
      ["Grecia", "Dentro, en la cella, estaba la estatua del dios; los rituales se hacían afuera en el altar."],
      ["Roma", "Mezclaron lo griego con técnicas propias. El Panteón tiene una cúpula de concreto con un óculo abierto."],
    ],
    img: temploImg,
  },
  tiendas: {
    titulo: "Puestos del Mercado",
    sub: "Ágora y Foro",
    cuerpo: "El comercio era el corazón de la vida cotidiana en las ciudades antiguas.",
    datos: [
      ["Grecia", "En el ágora se vendía, se debatía política y circulaba la dracma."],
      ["Roma", "Las tabernae bordeaban calles y foros; los Mercados de Trajano fueron un gran complejo comercial."],
    ],
    img: tiendasImg,
  },
};
// Zindex de los elementos para controlar el orden 
const Z = { objetos: 2, mano: 6, reloj: 10, hud: 8, transicion: 15, modal: 20, saltar: 30 };


const Escena3 = ({ onRelojRecogido }) => {
  const [fase, setFase] = useState("intro"); // "intro" | "transicion" | "juego"
  const [estadoReloj, setEstadoReloj] = useState("esperando"); // "esperando" | "recogiendo" | "recogido"
  const [modalActivo, setModalActivo] = useState(null); // ID del modal abierto o null
  const [visitados, setVisitados] = useState({}); // Guarda cuáles ruinas ya exploró el usuario
  const [debug, setDebug] = useState(
    () => typeof window !== "undefined" && window.location.search.includes("debug")
  );

  const fondo1Ref = useRef(null);
  const fondo2Ref = useRef(null);
  const manoRef = useRef(null);
  const animFondo2 = useRef(null);
  const animMano = useRef(null);
  const introTerminada = useRef(false);
  const manoTerminada = useRef(false);
  const callbackRef = useRef(onRelojRecogido);
  callbackRef.current = onRelojRecogido;

  const terminarIntro = useCallback(() => {
    if (introTerminada.current) return;
    introTerminada.current = true;
    setFase("transicion");
  }, []);

  
  useEffect(() => {
    if (fase !== "intro" || !fondo1Ref.current) return;
    const anim = lottie.loadAnimation({
      container: fondo1Ref.current,
      renderer: "svg",
      animationData: fondo1Data,
      loop: false,
      autoplay: true,
      rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
    });
    anim.setSpeed(VELOCIDAD_INTRO);
    const alCuadro = () => {
      if (anim.currentFrame >= anim.totalFrames * INTRO_CORTE) terminarIntro();
    };
    anim.addEventListener("enterFrame", alCuadro);
    anim.addEventListener("complete", terminarIntro);
    return () => anim.destroy();
  }, [fase, terminarIntro]);

  
  useEffect(() => {
    if (fase !== "transicion") return;
    const t = setTimeout(() => setFase("juego"), DURACION_TRANSICION_MS);
    return () => clearTimeout(t);
  }, [fase]);

  // Carga el fondo 2 (el escenario interactivo de las ruinas)
  useEffect(() => {
    if (!fondo2Ref.current) return;
    const anim = lottie.loadAnimation({
      container: fondo2Ref.current,
      renderer: "svg",
      animationData: fondo2Data,
      loop: true,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
    });
    animFondo2.current = anim;
    return () => {
      anim.destroy();
      animFondo2.current = null;
    };
  }, []);

  useEffect(() => {
    if (fase !== "intro") animFondo2.current?.play();
  }, [fase]);

  const terminarMano = useCallback(() => {
    if (manoTerminada.current) return;
    manoTerminada.current = true;
    setEstadoReloj("recogido");
    callbackRef.current?.();
  }, []);


  useEffect(() => {
    if (!manoRef.current) return;
    const anim = lottie.loadAnimation({
      container: manoRef.current,
      renderer: "svg",
      animationData: manoRelojData,
      loop: false,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });
    anim.goToAndStop(0, true);
    anim.setSpeed(VELOCIDAD_MANO);
    
    anim.addEventListener("enterFrame", () => {
      if (anim.currentFrame >= anim.totalFrames * MANO_CORTE) terminarMano();
    });
    anim.addEventListener("complete", terminarMano);
    animMano.current = anim;
    return () => {
      anim.destroy();
      animMano.current = null;
    };
  }, [terminarMano]);

  const recogerReloj = () => {
    if (estadoReloj !== "esperando") return;
    setEstadoReloj("recogiendo");
    animMano.current?.goToAndPlay(0, true);
  };

 
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") {
        if (modalActivo) setModalActivo(null);
        else if (fase === "intro") terminarIntro();
      }
      if (e.key.toLowerCase() === "d" && e.shiftKey) setDebug((d) => !d);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [modalActivo, fase, terminarIntro]);

  const abrirModal = (id) => {
    setModalActivo(id);
    setVisitados((v) => ({ ...v, [id]: true }));
  };

  const enJuego = fase === "juego";
  const escenaVisible = fase !== "intro";
  const objetosActivos = enJuego && estadoReloj === "recogido";
  const manoVisible = estadoReloj !== "recogido";

  return (
    <div className="comic-root">
      <style>{css}</style>

      <div className="comic-stage">
        {/* Pantalla 1: Intro */}
        {fase === "intro" && (
          <div className="comic-capa">
            <div ref={fondo1Ref} className="comic-lottie" />
          </div>
        )}

        {/* Pantalla 2: Juego / Ruinas */}
        <div className={`comic-capa comic-juego ${escenaVisible ? "comic-visible" : ""}`}>
          <div ref={fondo2Ref} className="comic-lottie" />

          {Object.entries(OBJETOS).map(([id, caja]) => (
            <Objeto
              key={id}
              id={id}
              caja={caja}
              datos={TEXTOS[id]}
              visitado={!!visitados[id]}
              activo={objetosActivos}
              debug={debug}
              onAbrir={abrirModal}
            />
          ))}

          {enJuego && estadoReloj === "esperando" && (
            <button
              type="button"
              className="comic-reloj"
              style={{
                left: `${RELOJ.left}%`,
                top: `${RELOJ.top}%`,
                width: `${RELOJ.size}%`,
              }}
              onClick={recogerReloj}
              aria-label="Recoger el reloj del suelo"
            >
              <span className="comic-reloj-anillo" />
              <span className="comic-reloj-texto">Toca el reloj</span>
            </button>
          )}

          <div
            ref={manoRef}
            className={`comic-mano ${manoVisible ? "" : "comic-oculta"}`}
            style={{ zIndex: Z.mano }}
          />

          {estadoReloj === "recogido" && (
            <div className="comic-aviso" role="status">
              Reloj recogido · explora las ruinas
            </div>
          )}

          {debug && <GuiaReferencia />}
        </div>

        {/* Transición */}
        {fase === "transicion" && (
          <div className="comic-transicion">
            <h1 className="comic-titulo">Muchos años después...</h1>
          </div>
        )}
      </div>

      {fase === "intro" && (
        <button type="button" className="comic-saltar" onClick={terminarIntro}>
          Saltar intro
        </button>
      )}

      {/* Modal Informativo */}
      {modalActivo && (
        <div
          className="comic-overlay"
          onClick={() => setModalActivo(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comic-modal-titulo"
        >
          <div className="comic-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="comic-modal-titulo">{TEXTOS[modalActivo].titulo}</h2>
            <div className="comic-sub">{TEXTOS[modalActivo].sub}</div>
            <p className="comic-intro">{TEXTOS[modalActivo].cuerpo}</p>
            <ul className="comic-datos">
              {TEXTOS[modalActivo].datos.map(([etiqueta, texto]) => (
                <li key={texto}>
                  <span className="comic-etiqueta">{etiqueta}</span>
                  {texto}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="comic-cerrar"
              autoFocus
              onClick={() => setModalActivo(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const Objeto = ({ id, caja, datos, visitado, activo, debug, onAbrir }) => (
  <div
    role="button"
    tabIndex={activo ? 0 : -1}
    aria-label={datos.titulo}
    aria-disabled={!activo}
    className={`comic-objeto ${activo ? "comic-activo" : "comic-inactivo"} ${visitado ? "comic-visitado" : ""} ${debug ? "comic-debug" : ""}`}
    style={{
      left: `${caja.left}%`,
      top: `${caja.top}%`,
      width: `${caja.width}%`,
      height: `${caja.height}%`,
      zIndex: Z.objetos,
    }}
    onClick={() => activo && onAbrir(id)}
    onKeyDown={(e) => {
      if (activo && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onAbrir(id);
      }
    }}
  >
    <img src={datos.img} alt="" draggable={false} className="comic-img" />
    {activo && (
      <span className="comic-pista" aria-hidden="true">
        {visitado ? "✓" : "Tócame"}
      </span>
    )}
  </div>
);

const GuiaReferencia = () => (
  <div
    style={{
      position: "absolute",
      left: `${RELOJ.left}%`,
      top: `${RELOJ.top}%`,
      width: `${RELOJ.size}%`,
      aspectRatio: "1",
      transform: "translate(-50%, -50%)",
      outline: "2px dashed #00ff88",
      zIndex: 40,
      pointerEvents: "none",
    }}
  />
);


const css = `
html, body { margin: 0; padding: 0; overflow: hidden; background: #110a08; }

.comic-root {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: #110a08; overflow: hidden;
  user-select: none; -webkit-user-select: none;
}

.comic-stage {
  position: relative;
  aspect-ratio: ${ASPECTO};
  width: min(100vw, calc(100dvh * ${ASPECTO}));
  height: min(100dvh, calc(100vw / ${ASPECTO}));
  overflow: hidden;
  background: #2b1d17;
  container-type: inline-size;
}

.comic-capa { position: absolute; inset: 0; }
.comic-lottie { position: absolute; inset: 0; width: 100%; height: 100%; }
.comic-lottie svg { display: block; }

.comic-juego { opacity: 0; visibility: hidden; transition: opacity .3s ease; }
.comic-juego.comic-visible { opacity: 1; visibility: visible; }

.comic-objeto {
  position: absolute; outline: none;
  -webkit-tap-highlight-color: transparent;
}
.comic-inactivo { pointer-events: none; cursor: default; }
.comic-activo { cursor: pointer; }
.comic-img {
  display: block; width: 100%; height: 100%;
  object-fit: contain; pointer-events: none;
  transition: filter .2s ease, transform .2s ease;
}
.comic-activo:hover .comic-img,
.comic-activo:focus-visible .comic-img {
  filter: brightness(1.08) drop-shadow(0 0 .6cqw rgba(255, 214, 90, .95));
}
.comic-activo:active .comic-img { transform: scale(.995); }
.comic-debug { outline: 1px dashed #00ff88; }

.comic-pista {
  position: absolute; left: 50%; bottom: 4%;
  transform: translateX(-50%);
  background: #ffcc00; color: #2a1a00;
  font: 700 clamp(9px, 1.05cqw, 14px)/1 system-ui, sans-serif;
  padding: .45em .9em; border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0,0,0,.45);
  pointer-events: none; white-space: nowrap;
  animation: comic-pista-in .25s ease both, comic-latido 2.4s ease-in-out .25s infinite;
  transition: opacity .08s ease;
}
.comic-activo:hover .comic-pista,
.comic-activo:focus-visible .comic-pista,
.comic-activo:active .comic-pista { opacity: 0; animation: none; }
.comic-visitado .comic-pista { animation: none; background: #e9d9a8; opacity: .85; }
.comic-visitado:hover .comic-pista { opacity: 0; }
.comic-objeto[aria-label="Templo Antiguo"] .comic-pista { bottom: 2%; left: 50%; }

.comic-reloj {
  position: absolute; z-index: ${Z.reloj};
  aspect-ratio: 1; transform: translate(-50%, -50%);
  background: transparent; border: 0; padding: 0; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.comic-reloj-anillo {
  position: absolute; inset: 8%;
  border-radius: 50%;
  border: .25cqw solid rgba(255, 224, 120, .95);
  box-shadow: 0 0 1.2cqw rgba(255, 214, 90, .8);
  animation: comic-onda 1.8s ease-out infinite;
}
.comic-reloj-texto {
  position: absolute; left: 50%; top: 108%;
  transform: translateX(-50%);
  background: rgba(17, 10, 8, .88); color: #fff;
  font: 600 clamp(9px, 1cqw, 13px)/1 system-ui, sans-serif;
  padding: .5em .9em; border-radius: 6px; white-space: nowrap;
}
.comic-reloj:focus-visible .comic-reloj-anillo { border-color: #fff; }

.comic-mano {
  position: absolute; inset: 0; pointer-events: none;
  transition: opacity .35s ease, transform .35s ease;
}
.comic-mano svg { display: block; width: 100%; height: 100%; }
.comic-oculta { opacity: 0; transform: translate(-12%, -8%); }

.comic-aviso {
  position: absolute; z-index: ${Z.hud};
  left: 50%; top: 4%; transform: translateX(-50%);
  background: rgba(17, 10, 8, .9); color: #ffe27a;
  font: 600 clamp(12px, 1.4cqw, 18px)/1 Georgia, serif;
  padding: .7em 1.4em; border-radius: 999px;
  border: 1px solid rgba(255, 226, 122, .5);
  animation: comic-aviso 3.3s ease forwards; pointer-events: none;
}

.comic-transicion {
  position: absolute; inset: 0; z-index: ${Z.transicion};
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(17,10,8,.55), rgba(17,10,8,.85));
  animation: comic-entra .25s ease both;
}
.comic-titulo {
  margin: 0; color: #f3f3f3; font-family: Georgia, "Times New Roman", serif;
  font-weight: 400; font-size: clamp(24px, 4cqw, 52px);
  letter-spacing: .12em; text-shadow: 0 0 14px rgba(255, 255, 255, .45);
  animation: comic-texto ${DURACION_TRANSICION_MS}ms ease both;
}

.comic-saltar {
  position: fixed; top: 18px; right: 18px; z-index: ${Z.saltar};
  padding: 9px 18px; cursor: pointer;
  background: rgba(17, 10, 8, .72); color: #fff;
  border: 1px solid rgba(255, 255, 255, .4); border-radius: 999px;
  font: 600 14px/1 system-ui, sans-serif;
  backdrop-filter: blur(4px);
  transition: background .2s ease;
}
.comic-saltar:hover { background: rgba(17, 10, 8, .92); }
.comic-saltar:focus-visible { outline: 2px solid #ffcc00; outline-offset: 2px; }

.comic-overlay {
  position: fixed; inset: 0; z-index: ${Z.modal};
  background: rgba(0, 0, 0, .6);
  display: flex; align-items: center; justify-content: center;
  animation: comic-entra .2s ease both;
}
.comic-modal {
  background: #fffaf0; color: #2e2118; text-align: left;
  width: min(460px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px); overflow-y: auto;
  padding: 24px 26px; border-radius: 10px;
  border-top: 6px solid #d2691e;
  box-shadow: 0 14px 40px rgba(0, 0, 0, .45);
  animation: comic-sube .25s ease both;
}
.comic-modal h2 { margin: 0; font-family: Georgia, serif; }
.comic-sub { margin: 2px 0 12px; font: 600 13px/1.2 system-ui, sans-serif; color: #a0522d; letter-spacing: .04em; text-transform: uppercase; }
.comic-intro { margin: 0 0 12px; line-height: 1.5; font-style: italic; }
.comic-datos { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.comic-datos li { line-height: 1.45; font-size: 14.5px; }
.comic-etiqueta {
  display: inline-block; margin-right: 8px; padding: .15em .6em;
  background: #2e2118; color: #ffe27a; border-radius: 999px;
  font: 700 11px/1.4 system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase;
}
.comic-cerrar {
  display: block; margin: 18px auto 0; padding: 8px 22px; cursor: pointer;
  background: #d9534f; color: #fff; border: 0; border-radius: 4px;
  font: 600 14px/1 system-ui, sans-serif;
}
.comic-cerrar:focus-visible { outline: 2px solid #333; outline-offset: 2px; }

@keyframes comic-latido { 0%, 100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.07); } }
@keyframes comic-pista-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes comic-onda { 0% { transform: scale(.8); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes comic-entra { from { opacity: 0; } to { opacity: 1; } }
@keyframes comic-sube { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes comic-texto { 0% { opacity: 0; } 20% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes comic-aviso { 0% { opacity: 0; transform: translate(-50%, -8px); } 12% { opacity: 1; transform: translate(-50%, 0); } 75% { opacity: 1; } 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .comic-pista, .comic-reloj-anillo { animation: none; }
  .comic-juego, .comic-mano { transition: none; }
}
`;

export default Escena3;