import React, { useState } from "react";

const Escena1 = () => {
  const [houseRebuilt, setHouseRebuilt] = useState(false);
  const [treeRebuilt, setTreeRebuilt] = useState(false);

  const [isHouseHovered, setIsHouseHovered] = useState(false);
  const [isTreeHovered, setIsTreeHovered] = useState(false);

  const getInteractiveStyle = (isHovered) => ({
    transform: isHovered ? "scale(1.03)" : "scale(1)",
    filter: isHovered ? "brightness(1.1) drop-shadow(0px 0px 8px rgba(255,255,255,0.4))" : "none",
    transition: "all 0.3s ease-in-out",
  });

  return (
    <div
      className="position-relative min-vh-100 overflow-hidden"
      style={{
        backgroundImage: `url('/Material/1x/Fondo desierto.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* EL ÁRBOL */}
      <div
        className="position-absolute"
        style={{
          // Mueve estos porcentajes si necesitas afinar la posición
          bottom: "-2%", // Aumenta para subirlo, disminuye para bajarlo
          left: "-15%",    // Disminuye (incluso a valores negativos como "-5%") para moverlo a la izquierda
          cursor: "pointer",
          width: "250px",
          height: "600px",
          zIndex: 10,
          ...getInteractiveStyle(isTreeHovered)
        }}
        onMouseEnter={() => setIsTreeHovered(true)}
        onMouseLeave={() => setIsTreeHovered(false)}
        onClick={() => setTreeRebuilt(!treeRebuilt)}
      >
        <img
          src="/Material/1x/arbol.png"
          alt="Árbol Seco"
          className="position-absolute w-100 h-100"
          style={{ objectFit: "contain" }}
        />
        <img
          src="/Material/1x/Arbol bueno.png"
          alt="Árbol Bueno"
          className="position-absolute w-100 h-100"
          style={{
            objectFit: "contain",
            opacity: treeRebuilt ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
      </div>

      {/* LA CASA */}
      <div
        className="position-absolute"
        style={{
          // Mueve estos porcentajes si necesitas afinar la posición
          bottom: "25%", // Aumenta para subirla, disminuye para bajarla
          right: "22%",  // Aumenta este número para alejarla del borde derecho
          cursor: "pointer",
          width: "500px", 
          height: "500px",
          zIndex: 10,
          ...getInteractiveStyle(isHouseHovered)
        }}
        onMouseEnter={() => setIsHouseHovered(true)}
        onMouseLeave={() => setIsHouseHovered(false)}
        onClick={() => setHouseRebuilt(!houseRebuilt)}
      >
        <img
          src="/Material/1x/Ruinas casa.png"
          alt="Casa Ruinas"
          className="position-absolute w-100 h-100"
          style={{ objectFit: "contain" }}
        />
        <img
          src="/Material/1x/Casa buena.png"
          alt="Casa Buena"
          className="position-absolute w-100 h-100"
          style={{
            objectFit: "contain",
            opacity: houseRebuilt ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

export default Escena1;