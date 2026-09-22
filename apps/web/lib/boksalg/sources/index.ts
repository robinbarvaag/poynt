import type { StockSource } from "../types";
import { arkSource } from "./ark";
import { norliSource } from "./norli";

/**
 * Kildene vi kan hente lagerstatus fra. Én fil per kjede — å legge til
 * Adlibris eller Bokkilden er å skrive en `StockSource` og føre den opp her.
 */
export const STOCK_SOURCES: StockSource[] = [norliSource, arkSource];

export function findSource(key: string): StockSource | undefined {
  return STOCK_SOURCES.find((source) => source.key === key);
}

export { arkSource, norliSource };
