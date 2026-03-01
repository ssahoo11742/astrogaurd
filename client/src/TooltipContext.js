// TooltipContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const TooltipContext = createContext();

export const useTooltip = () => useContext(TooltipContext);

export function TooltipProvider({ children }) {
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "i") {
        setTooltipsEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <TooltipContext.Provider value={{ tooltipsEnabled }}>
      {children}
    </TooltipContext.Provider>
  );
}
