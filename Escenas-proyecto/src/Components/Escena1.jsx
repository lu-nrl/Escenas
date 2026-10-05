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
          bottom: "-2%", 
          left: "-15%",   
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

     
      <div
        className="position-absolute"
        style={{
          bottom: "25%", 
          right: "22%",  
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