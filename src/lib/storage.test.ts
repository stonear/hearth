import { expect, test } from "bun:test";
import {
  parseBackup,
  serializeBackup,
  loadSettings,
  saveSettings,
} from "./storage";
const settings = {
  name: "Home",
  principal: 1200,
  annualRate: 0,
  termMonths: 12,
  firstPaymentDate: "2026-01-01",
  currency: "USD",
};
test("backup roundtrips validated mortgage settings", () => {
  expect(parseBackup(serializeBackup(settings))).toEqual({
    version: 1,
    settings,
  });
});
test("backup preserves house financing details", () => {
  const withHouse = {
    ...settings,
    principal: 350000000,
    housePrice: 500000000,
    downPayment: 150000000,
    currency: "IDR",
  };
  expect(parseBackup(serializeBackup(withHouse)).settings).toEqual(withHouse);
});
test("malformed, unsupported, and invalid backups never produce replacements", () => {
  for (const text of [
    "{broken",
    '{"version":2}',
    JSON.stringify({
      version: 1,
      settings: { ...settings, firstPaymentDate: "2026-02-30" },
    }),
    "null",
  ]) {
    expect(() => parseBackup(text)).toThrow();
  }
});
test("corrupted stored settings fail safely with an explanation", () => {
  const storage = { getItem: () => "broken" } as unknown as Storage;
  expect(loadSettings(storage).settings).toBeNull();
  expect(loadSettings(storage).error).toBeTruthy();
});
test("storage failures return errors instead of breaking the app", () => {
  const storage = {
    getItem: () => {
      throw new Error("Disabled");
    },
    setItem: () => {
      throw new Error("Quota");
    },
  } as unknown as Storage;
  expect(loadSettings(storage).error).toBeTruthy();
  expect(saveSettings(storage, settings).error).toBeTruthy();
});
test("saving and loading preserve valid settings", () => {
  let value: string | null = null;
  const storage = {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  } as unknown as Storage;
  expect(loadSettings(storage)).toEqual({ settings: null, error: null });
  expect(saveSettings(storage, settings).error).toBeNull();
  expect(loadSettings(storage).settings).toEqual(settings);
});
