import React, { useState, useEffect } from "react";


const RECUERDOS = [
 
  {
    id: "recuerdo1",
    titulo: "1. El Hallazgo en la Arena",
    epoca: "El Comienzo",
    descripcion: "La mano descubre y recoge el misterioso reloj entre las arenas y las ruinas del tiempo.",
    img: "/Material/Sexta.png",
    posicion: { top: "15%", left: "4%", rotacion: "-4deg" },
  },
  {
    id: "recuerdo2",
    titulo: "2. La Entrega del Reloj",
    epoca: "El Legado",
    descripcion: "El momento en que se entrega el artefacto, marcando el inicio de la misión a través de la historia.",
    img: "/Material/Primera.png",
    posicion: { top: "15%", left: "28%", rotacion: "3deg" },
  },
  {
    id: "recuerdo3",
    titulo: "3. La Guerra de los 100 Años",
    epoca: "El Conflicto",
    descripcion: "Los campos abiertos se llenan de batallas y enfrentamientos que sacuden a las naciones.",
    img: "/Material/Segunda.png",
    posicion: { top: "15%", left: "52%", rotacion: "-3deg" },
  },
  {
    id: "recuerdo4",
    titulo: "4. El Castillo en Llamas",
    epoca: "La Tragedia",
    descripcion: "El castillo arde en fuego, simbolizando la pérdida y destrucción del conocimiento acumulado.",
    img: "/Material/Cuarta.png",
    posicion: { top: "15%", left: "76%", rotacion: "5deg" },
  },

 
  {
    id: "recuerdo5",
    titulo: "5. La Sombra de la Peste Negra",
    epoca: "La Crisis",
    descripcion: "Una época oscura donde la epidemia asola los caminos, rodeado de dolor y cuerpos caídos.",
    img: "/Material/Quinta.png",
    posicion: { top: "54%", left: "18%", rotacion: "-4deg" }, // <--- Aumentado de 14% a 18%
  },
  {
    id: "recuerdo6",
    titulo: "6. El Renacer del Pueblo",
    epoca: "La Restauración",
    descripcion: "Gracias al conocimiento aportado por el reloj, el pueblo y sus campos reverdecen y son restaurados.",
    img: "/Material/Septima.png",
    posicion: { top: "54%", left: "42%", rotacion: "4deg" }, // <--- Aumentado de 39% a 42%
  },
  {
    id: "recuerdo7",
    titulo: "7. La Llegada de la Imprenta",
    epoca: "El Saber",
    descripcion: "La revolución de la imprenta permite multiplicar las letras y multiplicar el saber para siempre.",
    img: "/Material/Tercera.png",
    posicion: { top: "54%", left: "66%", rotacion: "-2deg" }, // <--- Aumentado de 64% a 66%
  },
];


const Z = { fondo: 1, polaroid: 5, hud: 30, modal: 40 };


const Escena4 = () => {
  const [recuerdoSeleccionado, setRecuerdoSeleccionado] = useState(null);
  const [visitados, setVisitados] = useState({});

  const abrirRecuerdo = (recuerdo) => {
    setRecuerdoSeleccionado(recuerdo);
    setVisitados((prev) => ({ ...prev, [recuerdo.id]: true }));
  };

  const cerrarModal = () => {
    setRecuerdoSeleccionado(null);
  };

  const totalVisitados = Object.keys(visitados).length;

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") cerrarModal();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    <div className="comic-root">
      <style>{css}</style>

      <div className="comic-stage">
        {/* Encabezado */}
        <div className="comic-hud">
          <h1 className="comic-titulo-escena">Fragmentos de la Historia</h1>
          <p className="comic-subtitulo-escena">
            Explora los recuerdos del viaje ({totalVisitados}/{RECUERDOS.length})
          </p>
        </div>

        <div className="comic-galeria">
          {RECUERDOS.map((recuerdo) => {
            const esVisitado = !!visitados[recuerdo.id];
            return (
              <div
                key={recuerdo.id}
                role="button"
                tabIndex={0}
                className={`comic-polaroid ${esVisitado ? "comic-visitado" : ""}`}
                style={{
                  top: recuerdo.posicion.top,
                  left: recuerdo.posicion.left,
                  transform: `rotate(${recuerdo.posicion.rotacion})`,
                  zIndex: Z.polaroid,
                }}
                onClick={() => abrirRecuerdo(recuerdo)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") abrirRecuerdo(recuerdo);
                }}
              >
                <div className="comic-foto-contenedor">
                  <img src={recuerdo.img} alt={recuerdo.titulo} className="comic-foto-img" />
                  {esVisitado && <span className="comic-check-visto">✓</span>}
                </div>
                <span className="comic-foto-etiqueta">{recuerdo.titulo}</span>
              </div>
            );
          })}
        </div>
      </div>

      {recuerdoSeleccionado && (
        <div className="comic-overlay" onClick={cerrarModal} role="dialog" aria-modal="true">
          <div className="comic-modal-recuerdo" onClick={(e) => e.stopPropagation()}>
            <div className="comic-modal-imagen-box">
              <img
                src={recuerdoSeleccionado.img}
                alt={recuerdoSeleccionado.titulo}
                className="comic-modal-img"
              />
            </div>
            <div className="comic-modal-contenido">
              <span className="comic-epoca-tag">{recuerdoSeleccionado.epoca}</span>
              <h2 className="comic-modal-titulo">{recuerdoSeleccionado.titulo}</h2>
              <p className="comic-modal-texto">{recuerdoSeleccionado.descripcion}</p>
              <button type="button" className="comic-cerrar" onClick={cerrarModal}>
                Guardar memoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const css = `
html, body { margin: 0; padding: 0; overflow: hidden; background: #0f0a08; }

.comic-root {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: #0f0a08; overflow: hidden;
  user-select: none;
}

.comic-stage {
  position: relative;
  width: 100vw; height: 100vh;
  background: radial-gradient(circle at center, #241712 0%, #0d0806 100%);
  overflow: hidden;
}

.comic-hud {
  position: absolute; top: 12px; left: 50%;
  transform: translateX(-50%);
  text-align: center; z-index: ${Z.hud};
  pointer-events: none;
}
.comic-titulo-escena {
  margin: 0; color: #ffe27a;
  font-family: Georgia, serif; font-size: clamp(20px, 2.8vw, 32px);
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
}
.comic-subtitulo-escena {
  margin: 2px 0 0; color: #d4c3b5;
  font-family: system-ui, sans-serif; font-size: clamp(11px, 1.1vw, 14px);
}

.comic-galeria { position: absolute; inset: 0; }

.comic-polaroid {
  position: absolute; width: clamp(160px, 21vw, 240px);
  background: #f7f3eb; padding: 10px 10px 16px 10px;
  border-radius: 4px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.6);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
}
.comic-polaroid:hover {
  transform: scale(1.12) rotate(0deg) !important;
  z-index: 20 !important;
  box-shadow: 0 15px 35px rgba(255, 214, 90, 0.4);
}

.comic-foto-contenedor {
  position: relative; width: 100%; aspect-ratio: 4/3;
  background: #2b1d17; overflow: hidden; border-radius: 2px;
}
.comic-foto-img {
  width: 100%; height: 100%; object-fit: cover;
  display: block; transition: filter 0.3s ease;
}
.comic-polaroid:not(.comic-visitado) .comic-foto-img {
  filter: sepia(0.3) contrast(0.95);
}

.comic-check-visto {
  position: absolute; top: 6px; right: 6px;
  background: #4caf50; color: #fff;
  font-weight: bold; font-size: 12px;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.4);
}

.comic-foto-etiqueta {
  display: block; margin-top: 10px; text-align: center;
  font-family: "Georgia", serif; font-size: clamp(11px, 1.1vw, 14px);
  color: #332219; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.comic-visitado { background: #fffdf9; }

.comic-overlay {
  position: fixed; inset: 0; z-index: ${Z.modal};
  background: rgba(0, 0, 0, 0.75);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(5px);
  animation: comic-fadeIn 0.25s ease;
}

.comic-modal-recuerdo {
  background: #faf6ee; color: #2e2118;
  width: min(750px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  display: flex; flex-direction: row;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  border-top: 6px solid #d2691e;
  animation: comic-sube 0.3s ease;
}

.comic-modal-imagen-box {
  flex: 1.2; background: #1a100a;
  display: flex; align-items: center; justify-content: center;
  padding: 15px;
}
.comic-modal-img {
  width: 100%; height: 100%; max-height: 380px;
  object-fit: contain; border-radius: 6px;
}

.comic-modal-contenido {
  flex: 1; padding: 28px 24px;
  display: flex; flex-direction: column; justify-content: center;
}

.comic-epoca-tag {
  align-self: flex-start; background: #d2691e; color: #fff;
  font: 700 11px system-ui, sans-serif; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;
}

.comic-modal-titulo {
  margin: 0 0 10px; font-family: Georgia, serif; font-size: 24px; color: #2e2118;
}

.comic-modal-texto {
  margin: 0 0 24px; line-height: 1.6; font-size: 15px; color: #554135;
}

.comic-cerrar {
  align-self: flex-start; padding: 10px 22px; cursor: pointer;
  background: #2e2118; color: #ffe27a; border: 0; border-radius: 6px;
  font: 600 14px system-ui, sans-serif;
  transition: background 0.2s ease;
}
.comic-cerrar:hover { background: #473428; }

@keyframes comic-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes comic-sube { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: none; } }

@media (max-width: 700px) {
  .comic-modal-recuerdo { flex-direction: column; }
  .comic-modal-imagen-box { max-height: 200px; }
  .comic-polaroid { width: 130px; padding: 6px 6px 10px 6px; }
}
`;

export default Escena4;