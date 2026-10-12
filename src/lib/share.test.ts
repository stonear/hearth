import { describe, expect, test } from "bun:test";
import { getProgress, type MortgageSettings } from "./mortgage";
import { createShareSnapshot } from "./share";

const settings: MortgageSettings = {
  name: "My first home",
  principal: 1200,
  annualRate: 0,
  termMonths: 12,
  firstPaymentDate: "2026-01-15",
  currency: "IDR",
};

describe("share snapshot", () => {
  test("before the first payment, shares progress without money", () => {
    const date = "2025-12-15";
    const snapshot = createShareSnapshot(
      settings,
      getProgress(settings, date),
      date,
      false,
    );
    expect(snapshot.percentageLabel).toBe("0.0%");
    expect(snapshot.completedLabel).toBe("0 of 12 payments complete");
    expect(snapshot.milestoneLabel).toBe(
      "Next milestone: 25% principal repaid",
    );
    expect(snapshot.asOf).toBe("December 15, 2025");
    expect(snapshot.estimateNote).toContain("Estimated");
    expect(snapshot.remainingBalance).toBeUndefined();
  });

  test("midway, exact amounts appear only when enabled", () => {
    const date = "2026-06-15";
    const progress = getProgress(settings, date);
    const privateSnapshot = createShareSnapshot(
      settings,
      progress,
      date,
      false,
    );
    const detailedSnapshot = createShareSnapshot(
      settings,
      progress,
      date,
      true,
    );
    expect(privateSnapshot.percentageLabel).toBe("50.0%");
    expect(privateSnapshot.remainingBalance).toBeUndefined();
    expect(detailedSnapshot.remainingBalance).toBe("IDR 600");
    expect(detailedSnapshot.principalPaid).toBe("IDR 600");
  });

  test("completed mortgage shows completion and bounds a special name", () => {
    const date = "2026-12-15";
    const named = { ...settings, name: "🏠 <script>".repeat(6) };
    const snapshot = createShareSnapshot(
      named,
      getProgress(named, date),
      date,
      false,
    );
    expect(snapshot.percentageLabel).toBe("100.0%");
    expect(snapshot.milestoneLabel).toBe("Mortgage complete");
    expect(Array.from(snapshot.name).length).toBeLessThanOrEqual(49);
    expect(snapshot.name).toContain("<script>");
  });
});
