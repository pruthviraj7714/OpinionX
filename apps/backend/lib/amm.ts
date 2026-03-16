import Decimal from "decimal.js";

type PoolUpdateResult = {
  yesPool: Decimal;
  noPool: Decimal;
};

export type TradeResult = {
  amountIn: Decimal;
  amountOut: Decimal;
  price: Decimal;
  fees: Decimal;
  newYesPool: Decimal;
  newNoPool: Decimal;
};

type BuyTradeResult = TradeResult;
type SellTradeResult = TradeResult;

type FeeResult = {
  finalAmount: Decimal;
  fees: Decimal;
};

export const MAX_TRADE_SIZE = new Decimal(0.1);
export const MIN_TRADE_SIZE = new Decimal(0.01);
export const MAX_PRICE_IMPACT = new Decimal(0.25);
export const MIN_POOL = new Decimal(0.0001);

export function calculateConstantProduct(
  yesPool: Decimal,
  noPool: Decimal,
): Decimal {
  return yesPool.mul(noPool);
}

export function calculateNewPoolsAfterBuy(
  side: "YES" | "NO",
  amount: Decimal,
  yesPool: Decimal,
  noPool: Decimal,
): PoolUpdateResult {
  const isYes = side === "YES";
  let newYesPool: Decimal;
  let newNoPool: Decimal;

  const k = calculateConstantProduct(yesPool, noPool);

  if (isYes) {
    newYesPool = yesPool.plus(amount);
    newNoPool = k.div(newYesPool);
  } else {
    newNoPool = noPool.plus(amount);
    newYesPool = k.div(newNoPool);
  }

  return {
    yesPool: newYesPool,
    noPool: newNoPool,
  };
}

export function calculateNewPoolsAfterSell(
  side: "YES" | "NO",
  amount: Decimal,
  yesPool: Decimal,
  noPool: Decimal,
): PoolUpdateResult {
  const isYes = side === "YES";
  let newYesPool: Decimal;
  let newNoPool: Decimal;

  const k = calculateConstantProduct(yesPool, noPool);

  if (isYes) {
    newYesPool = yesPool.plus(amount);
    newNoPool = k.div(newYesPool);
  } else {
    newNoPool = noPool.plus(amount);
    newYesPool = k.div(newNoPool);
  }

  return {
    yesPool: newYesPool,
    noPool: newNoPool,
  };
}

export function applyBuyFee(amount: Decimal, feePercent: Decimal): FeeResult {
  const fees = amount.mul(feePercent).div(100);

  return { finalAmount: amount.minus(fees), fees };
}

export function applySellFee(amount: Decimal, feePercent: Decimal): FeeResult {
  const fees = amount.mul(feePercent).div(100);

  return { finalAmount: amount.minus(fees), fees };
}

export function calculateShareDelta(
  oldOppositePool: Decimal,
  newOppositePool: Decimal,
): Decimal {
  return oldOppositePool.minus(newOppositePool);
}

export function calculateBuyTrade(
  side: "YES" | "NO",
  amount: Decimal,
  yesPool: Decimal,
  noPool: Decimal,
  feePercent: Decimal,
): BuyTradeResult {
  const isYes = side === "YES";
  const { finalAmount, fees } = applyBuyFee(amount, feePercent);
  const { yesPool: newYesPool, noPool: newNoPool } = calculateNewPoolsAfterBuy(
    side,
    finalAmount,
    yesPool,
    noPool,
  );
  const sharesReceived = calculateShareDelta(
    isYes ? noPool : yesPool,
    isYes ? newNoPool : newYesPool,
  );
  const price = calculateTradePrice(finalAmount, sharesReceived);
  return {
    amountIn: amount,
    amountOut: sharesReceived,
    price,
    fees,
    newYesPool,
    newNoPool,
  };
}

export function calculateSellTrade(
  side: "YES" | "NO",
  sharesSold: Decimal,
  yesPool: Decimal,
  noPool: Decimal,
  feePercent: Decimal,
): SellTradeResult {
  const isYes = side === "YES";

  const { yesPool: newYesPool, noPool: newNoPool } = calculateNewPoolsAfterSell(
    side,
    sharesSold,
    yesPool,
    noPool,
  );

  const usdtReceived = isYes
    ? noPool.minus(newNoPool)
    : yesPool.minus(newYesPool);

  const fees = usdtReceived.mul(feePercent).div(100);
  const finalAmount = usdtReceived.minus(fees);

  const price = finalAmount.div(sharesSold);

  return {
    amountIn: sharesSold,
    amountOut: finalAmount,
    price,
    fees,
    newYesPool,
    newNoPool,
  };
}

export function calculateTradePrice(
  amountIn: Decimal,
  sharesReceived: Decimal,
): Decimal {
  return amountIn.div(sharesReceived);
}

export function calculatePriceImpact(
  oldYesPool: Decimal,
  oldNoPool: Decimal,
  newYesPool: Decimal,
  newNoPool: Decimal,
): Decimal {
  const oldPrice = oldYesPool.div(oldYesPool.plus(oldNoPool));
  const newPrice = newYesPool.div(newYesPool.plus(newNoPool));

  const impact = newPrice.minus(oldPrice).div(oldPrice).abs();

  return impact;
}
