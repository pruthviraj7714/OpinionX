import type { Trade } from "../../packages/db/generated/prisma/client";
import type { Decimal } from "../../packages/db/generated/prisma/internal/prismaNamespace";

export const INTERVAL_MS_MAP: Record<string, number> = {
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };
  
  export function getIntervalMs(interval: string): number {
    return INTERVAL_MS_MAP[interval] ?? INTERVAL_MS_MAP["5m"]!;
  }

  export function applyTrade(
    trade: Trade,
    yesPool: Decimal,
    noPool: Decimal
  ) {
    if (trade.side === "YES") {
      if (trade.action === "BUY") {
        yesPool = yesPool.plus(trade.amountIn);
      } else {
        yesPool = yesPool.minus(trade.amountOut);
      }
    }
  
    if (trade.side === "NO") {
      if (trade.action === "BUY") {
        noPool = noPool.plus(trade.amountIn);
      } else {
        noPool = noPool.minus(trade.amountOut);
      }
    }
  
    return { yesPool, noPool };
  }