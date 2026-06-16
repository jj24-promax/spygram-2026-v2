export const BACK_REDIRECT_ORIGINAL_PRICE = 79;
export const BACK_REDIRECT_CASH_PRICE = 27.9;
export const BACK_REDIRECT_INSTALLMENTS = 12;

export function getBackRedirectInstallmentValue(): string {
  const value = BACK_REDIRECT_CASH_PRICE / BACK_REDIRECT_INSTALLMENTS;
  return value.toFixed(2).replace('.', ',');
}

export function getBackRedirectDiscountPercent(): number {
  return Math.round((1 - BACK_REDIRECT_CASH_PRICE / BACK_REDIRECT_ORIGINAL_PRICE) * 100);
}

export function formatBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
