import { expect, test } from "bun:test";
import { startDateRefresh, type ClockEnvironment } from "./clock";
test("refreshes at midnight and after resume, then cleans up timers and listeners", () => {
  let now = new Date(2026, 9, 12, 23, 59, 59);
  const events = new Map<string, () => void>();
  let callback: (() => void) | undefined;
  let delay = 0;
  let clears = 0;
  const env: ClockEnvironment = {
    now: () => now,
    setTimer: (cb, ms) => {
      callback = cb;
      delay = ms;
      return 1;
    },
    clearTimer: () => {
      clears++;
    },
    subscribe: (name, cb) => {
      events.set(name, cb);
      return () => {
        events.delete(name);
      };
    },
  };
  const dates: string[] = [];
  const stop = startDateRefresh((date) => dates.push(date), env);
  expect(dates).toEqual(["2026-10-12"]);
  expect(delay).toBeGreaterThanOrEqual(1000);
  expect(delay).toBeLessThan(2000);
  now = new Date(2026, 9, 13, 0, 0, 1);
  callback!();
  expect(dates.at(-1)).toBe("2026-10-13");
  now = new Date(2026, 9, 15, 12);
  events.get("focus")!();
  expect(dates.at(-1)).toBe("2026-10-15");
  stop();
  expect(events.size).toBe(0);
  expect(clears).toBeGreaterThan(0);
});
