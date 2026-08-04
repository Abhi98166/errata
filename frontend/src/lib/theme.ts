import { createContext, useContext } from "react";

export const GenreContext = createContext("comedic");

export function useGenre(): string {
  return useContext(GenreContext);
}
