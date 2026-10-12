import { describe, expect, test } from "bun:test";
import { isInstalledDisplayMode, shouldShowInstall } from "./install";

describe("install visibility", () => {
  test("any installed display mode hides the action", () => {
    expect(isInstalledDisplayMode(true, false, false)).toBe(true);
    expect(isInstalledDisplayMode(false, true, false)).toBe(true);
    expect(isInstalledDisplayMode(false, false, true)).toBe(true);
    expect(isInstalledDisplayMode(false, false, false)).toBe(false);
    expect(shouldShowInstall(true, true, true)).toBe(false);
  });

  test("captured prompt or mobile browser help shows the action", () => {
    expect(shouldShowInstall(false, true, false)).toBe(true);
    expect(shouldShowInstall(false, false, true)).toBe(true);
    expect(shouldShowInstall(false, false, false)).toBe(false);
  });
});
