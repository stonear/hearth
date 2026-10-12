import { describe, expect, test } from "bun:test";
import {
  buildSchedule,
  getProgress,
  simulateExtra,
  validateSettings,
  localDate,
  maxExtraPayment,
  loanFromHousePrice,
  renameMortgage,
  type MortgageSettings,
} from "./mortgage";
const loan: MortgageSettings = {
  name: "Our home",
  principal: 100000,
  annualRate: 6,
  termMonths: 360,
  firstPaymentDate: "2027-01-31",
  currency: "USD",
};
describe("mortgage schedule", () => {
  test("renaming trims the name without changing loan details", () => {
    const renamed = renameMortgage(loan, "  Our next home  ");
    expect(renamed.name).toBe("Our next home");
    expect(renamed.principal).toBe(loan.principal);
    expect(renamed.annualRate).toBe(loan.annualRate);
    expect(() => renameMortgage(loan, "   ")).toThrow();
  });
  test("house price and down payment calculate the loan in IDR", () => {
    expect(loanFromHousePrice(500000000, 150000000, "IDR")).toBe(350000000);
    expect(
      validateSettings({
        ...loan,
        currency: "IDR",
        housePrice: 500000000,
        downPayment: 150000000,
        principal: 350000000,
      }),
    ).toMatchObject({
      housePrice: 500000000,
      downPayment: 150000000,
      principal: 350000000,
    });
  });
  test("rejects inconsistent or invalid house financing values", () => {
    const house = {
      ...loan,
      currency: "IDR",
      housePrice: 500000000,
      downPayment: 150000000,
    };
    expect(() =>
      validateSettings({ ...house, principal: 400000000 }),
    ).toThrow();
    expect(() =>
      validateSettings({
        ...house,
        principal: 350000000,
        downPayment: 500000000,
      }),
    ).toThrow();
    expect(() =>
      validateSettings({ ...house, principal: 350000000, downPayment: -1 }),
    ).toThrow();
  });
  test("matches the known fixed-rate monthly payment and repays exactly the principal", () => {
    const rows = buildSchedule(loan);
    expect(rows[0].payment).toBe(59955);
    expect(rows.reduce((n, r) => n + r.principal, 0)).toBe(10000000);
    expect(rows.at(-1)!.balance).toBe(0);
    expect(rows.length).toBe(360);
  });
  test("zero interest has equal principal instalments", () => {
    const rows = buildSchedule({
      ...loan,
      principal: 1200,
      annualRate: 0,
      termMonths: 12,
    });
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.payment === 10000 && r.interest === 0)).toBe(
      true,
    );
  });
  test("month-end dates stay anchored", () => {
    const rows = buildSchedule(loan);
    expect(rows.slice(0, 3).map((r) => r.date)).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
    ]);
    expect(
      buildSchedule({ ...loan, firstPaymentDate: "2028-01-31" })[1].date,
    ).toBe("2028-02-29");
  });
  test("calendar dates drive paid progress including today and completed mortgages", () => {
    expect(getProgress(loan, "2027-01-30").elapsedCount).toBe(0);
    const first = getProgress(loan, "2027-01-31");
    expect(first.elapsedCount).toBe(1);
    expect(first.remainingBalance).toBe(9990045);
    expect(first.next?.date).toBe("2027-02-28");
    expect(getProgress(loan, "2028-01-31").elapsedCount).toBe(13);
    const done = getProgress(loan, "2057-01-31");
    expect(done.remainingBalance).toBe(0);
    expect(done.percentage).toBe(100);
    expect(done.next).toBeNull();
  });
  test("extra payments reduce interest and duration without changing progress", () => {
    const scenario = simulateExtra(loan, "2027-01-31", 200);
    expect(scenario.monthsSaved).toBeGreaterThan(100);
    expect(scenario.interestSaved).toBeGreaterThan(0);
    expect(scenario.schedule[0].date).toBe("2027-02-28");
    expect(getProgress(loan, "2027-01-31").elapsedCount).toBe(1);
    const baseline = simulateExtra(loan, "2027-01-31", 0);
    expect(baseline.interestSaved).toBe(0);
    expect(baseline.monthsSaved).toBe(0);
    expect(simulateExtra(loan, "2057-01-31", 200)).toMatchObject({
      schedule: [],
      monthsSaved: 0,
      interestSaved: 0,
    });
  });
  test("currency-aware simulator limits accept the highest safe extra payment", () => {
    const max = maxExtraPayment("USD");
    expect(max).toBeLessThan(100000000000);
    expect(simulateExtra(loan, "2027-01-31", max).monthsSaved).toBeGreaterThan(
      0,
    );
    expect(() => simulateExtra(loan, "2027-01-31", max + 1)).toThrow();
  });
  test("minor units respect currency digits and final rounding", () => {
    const rows = buildSchedule({
      ...loan,
      principal: 1000000,
      currency: "IDR",
      annualRate: 0,
      termMonths: 3,
    });
    expect(rows.map((r) => r.payment)).toEqual([333333, 333333, 333334]);
    expect(rows.at(-1)!.balance).toBe(0);
  });
  test("rejects impossible inputs and impossible dates", () => {
    for (const patch of [
      { principal: -1 },
      { annualRate: NaN },
      { termMonths: 0 },
      { termMonths: 601 },
      { firstPaymentDate: "2027-02-30" },
      { currency: "XXX" },
      { principal: Infinity },
    ]) {
      expect(() => validateSettings({ ...loan, ...patch })).toThrow();
    }
    expect(() => simulateExtra(loan, "2027-01-31", -1)).toThrow();
  });
  test("local calendar formatting uses local date fields", () => {
    expect(localDate(new Date(2027, 0, 31, 23, 59))).toBe("2027-01-31");
  });
});
