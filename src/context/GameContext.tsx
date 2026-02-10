"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PlayerNames } from "@/lib/types";

interface GameContextType {
  playerNames: PlayerNames | null;
  setPlayerNames: (names: PlayerNames) => void;
}

const GameContext = createContext<GameContextType>({
  playerNames: null,
  setPlayerNames: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerNames, setPlayerNames] = useState<PlayerNames | null>(null);

  return (
    <GameContext.Provider value={{ playerNames, setPlayerNames }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
