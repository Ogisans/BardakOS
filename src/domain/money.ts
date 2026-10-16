/** Parse the value of an HTML number input as positive TRY, with at most two decimals. */
export function parseMoneyAmount(input: string, allowZero = false): number | null {
  const value = input.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return null;

  const amount = Number(value);
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || (allowZero ? amount < 0 : amount <= 0) || !Number.isSafeInteger(cents)) return null;
  if (Math.abs(amount * 100 - cents) > 1e-7) return null;

  return cents > 0 || (allowZero && amount === 0) ? cents / 100 : null;
}

export function parseExpenseAmount(input: string): number | null {
  return parseMoneyAmount(input);
}
