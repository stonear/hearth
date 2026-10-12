export interface MortgageSettings {
  name: string;
  principal: number;
  housePrice?: number;
  downPayment?: number;
  annualRate: number;
  termMonths: number;
  firstPaymentDate: string;
  currency: string;
}
export interface ScheduleRow {
  index: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}
export interface Progress {
  schedule: ScheduleRow[];
  elapsedCount: number;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
  percentage: number;
  next: ScheduleRow | null;
}
export interface Scenario {
  schedule: ScheduleRow[];
  payoffDate: string;
  monthsSaved: number;
  interestSaved: number;
}
export const currencies = [
  "IDR",
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "AUD",
  "CAD",
  "JPY",
] as const;
// IDR and JPY are tracked in whole units; other supported currencies use cents.
export const currencyFactor = (currency: string): number =>
  ["IDR", "JPY"].includes(currency) ? 1 : 100;
export function loanFromHousePrice(
  housePrice: number,
  downPayment: number,
  currency: string,
): number {
  const factor = currencyFactor(currency);
  const price = Math.round(housePrice * factor);
  const deposit = Math.round(downPayment * factor);
  if (
    !Number.isFinite(housePrice) ||
    !Number.isFinite(downPayment) ||
    price <= 0 ||
    deposit < 0 ||
    deposit >= price ||
    price > Number.MAX_SAFE_INTEGER / 1000
  )
    throw new Error(
      "Enter a positive house price and a down payment below the price.",
    );
  return (price - deposit) / factor;
}
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1)
    return false;
  return day <= new Date(year, month, 0).getDate();
}
export function validateSettings(value: unknown): MortgageSettings {
  if (!value || typeof value !== "object")
    throw new Error("Mortgage settings are missing.");
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || !v.name.trim() || v.name.length > 80)
    throw new Error("Give your mortgage a name of 1–80 characters.");
  if (
    typeof v.currency !== "string" ||
    !currencies.includes(v.currency as (typeof currencies)[number])
  )
    throw new Error("Choose a supported currency.");
  const factor = currencyFactor(v.currency);
  const hasHousePrice = v.housePrice !== undefined;
  const hasDownPayment = v.downPayment !== undefined;
  if (hasHousePrice !== hasDownPayment)
    throw new Error("Enter both the house price and down payment.");
  if (hasHousePrice) {
    if (
      typeof v.housePrice !== "number" ||
      typeof v.downPayment !== "number" ||
      loanFromHousePrice(v.housePrice, v.downPayment, v.currency) !==
        v.principal
    )
      throw new Error(
        "The loan amount must equal house price minus down payment.",
      );
  }
  if (
    typeof v.principal !== "number" ||
    !Number.isFinite(v.principal) ||
    v.principal <= 0 ||
    Math.round(v.principal * factor) < 1 ||
    v.principal * factor > Number.MAX_SAFE_INTEGER / 1000
  )
    throw new Error("Enter a positive loan amount within the supported range.");
  if (
    typeof v.annualRate !== "number" ||
    !Number.isFinite(v.annualRate) ||
    v.annualRate < 0
  )
    throw new Error("Interest must be a finite, nonnegative percentage.");
  if (
    typeof v.termMonths !== "number" ||
    !Number.isInteger(v.termMonths) ||
    v.termMonths < 1 ||
    v.termMonths > 600
  )
    throw new Error("The term must be between 1 and 600 whole months.");
  if (
    !isDate(v.firstPaymentDate) ||
    Number(v.firstPaymentDate.slice(0, 4)) > 9949
  )
    throw new Error("Enter a valid first payment date between 1900 and 9949.");
  return {
    name: v.name.trim(),
    principal: v.principal,
    ...(hasHousePrice
      ? {
          housePrice: v.housePrice as number,
          downPayment: v.downPayment as number,
        }
      : {}),
    annualRate: v.annualRate,
    termMonths: v.termMonths,
    firstPaymentDate: v.firstPaymentDate,
    currency: v.currency,
  };
}

export function renameMortgage(
  settings: MortgageSettings,
  name: string,
): MortgageSettings {
  return validateSettings({ ...settings, name });
}
export function paymentDate(anchor: string, offset: number): string {
  const [year, month, day] = anchor.split("-").map(Number);
  const target = new Date(year, month - 1 + offset, 1, 12);
  target.setDate(
    Math.min(
      day,
      new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate(),
    ),
  );
  return localDate(target);
}
function monthlyPayment(settings: MortgageSettings): number {
  const p = Math.round(settings.principal * currencyFactor(settings.currency));
  const r = settings.annualRate / 1200;
  // This reciprocal form avoids overflow for large rate/term combinations.
  const amount =
    r === 0
      ? p / settings.termMonths
      : (p * r) / -Math.expm1(-settings.termMonths * Math.log1p(r));
  if (!Number.isFinite(amount) || amount > Number.MAX_SAFE_INTEGER / 2)
    throw new Error("This interest rate is too large to calculate reliably.");
  return Math.max(1, Math.round(amount));
}
function scheduleFrom(
  settings: MortgageSettings,
  balance: number,
  offset: number,
  extra: number,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const monthly = monthlyPayment(settings) + extra;
  const rate = settings.annualRate / 1200;
  const remainingMonths = settings.termMonths - offset;
  for (let n = 0; balance > 0 && n < remainingMonths; n++) {
    const interest = Math.round(balance * rate);
    // At the contractual last instalment, settle any rounding remainder.
    const payment =
      n === remainingMonths - 1
        ? balance + interest
        : Math.min(monthly, balance + interest);
    const principal = payment - interest;
    if (principal <= 0 || !Number.isSafeInteger(payment))
      throw new Error(
        "The monthly payment cannot reduce this balance. Try a different rate, amount, or term.",
      );
    balance -= principal;
    rows.push({
      index: offset + n + 1,
      date: paymentDate(settings.firstPaymentDate, offset + n),
      payment,
      principal,
      interest,
      balance,
    });
  }
  if (balance !== 0)
    throw new Error("Unable to calculate a complete repayment schedule.");
  return rows;
}
export function buildSchedule(input: MortgageSettings): ScheduleRow[] {
  const settings = validateSettings(input);
  return scheduleFrom(
    settings,
    Math.round(settings.principal * currencyFactor(settings.currency)),
    0,
    0,
  );
}
export function getProgress(
  settings: MortgageSettings,
  today: string,
): Progress {
  if (!isDate(today)) throw new Error("Invalid progress date.");
  const schedule = buildSchedule(settings);
  const paid = schedule.filter((row) => row.date <= today);
  const original = Math.round(
    settings.principal * currencyFactor(settings.currency),
  );
  const remainingBalance = paid.at(-1)?.balance ?? original;
  return {
    schedule,
    elapsedCount: paid.length,
    remainingBalance,
    principalPaid: original - remainingBalance,
    interestPaid: paid.reduce((sum, row) => sum + row.interest, 0),
    percentage: ((original - remainingBalance) / original) * 100,
    next: schedule[paid.length] ?? null,
  };
}
export function simulateExtra(
  settings: MortgageSettings,
  today: string,
  extra: number,
): Scenario {
  if (
    !Number.isFinite(extra) ||
    extra < 0 ||
    extra > maxExtraPayment(settings.currency)
  )
    throw new Error(
      "Extra payment must be a finite, nonnegative amount within the supported range.",
    );
  const progress = getProgress(settings, today);
  const baseline = progress.schedule.slice(progress.elapsedCount);
  const schedule =
    progress.remainingBalance === 0
      ? []
      : scheduleFrom(
          settings,
          progress.remainingBalance,
          progress.elapsedCount,
          Math.round(extra * currencyFactor(settings.currency)),
        );
  return {
    schedule,
    payoffDate: schedule.at(-1)?.date ?? progress.schedule.at(-1)!.date,
    monthsSaved: baseline.length - schedule.length,
    interestSaved:
      baseline.reduce((sum, row) => sum + row.interest, 0) -
      schedule.reduce((sum, row) => sum + row.interest, 0),
  };
}
export function maxExtraPayment(currency: string): number {
  return Math.floor(
    Number.MAX_SAFE_INTEGER / (1000 * currencyFactor(currency)),
  );
}
