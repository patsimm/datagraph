import { createContext, useState, useContext } from "react";
import React from "react";

export type GhostEdgePosition = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

const GhostEdgeContext = createContext<{
  position: GhostEdgePosition | null;
  setPosition: React.Dispatch<React.SetStateAction<GhostEdgePosition | null>>;
}>({ position: null, setPosition: () => {} });

export function GhostEdgeProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<GhostEdgePosition | null>(null);
  return (
    <GhostEdgeContext.Provider value={{ position, setPosition }}>
      {children}
    </GhostEdgeContext.Provider>
  );
}

export function useGhostEdge() {
  return useContext(GhostEdgeContext);
}
