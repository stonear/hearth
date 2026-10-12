import { describe, expect, test } from "bun:test";
import { initTheme, readThemePreference, resolveTheme } from "./theme";

describe("theme preference", () => {
  test("system follows the device while explicit choices win", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  test("invalid or unavailable storage falls back to system", () => {
    expect(readThemePreference({ getItem: () => "unexpected" })).toBe("system");
    expect(readThemePreference({ getItem: () => null })).toBe("system");
    expect(
      readThemePreference({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe("system");
    expect(readThemePreference({ getItem: () => "dark" })).toBe("dark");
  });

  test("initialization survives a blocked localStorage getter", () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "window",
    );
    const documentDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "document",
    );
    const element = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    };
    const media = {
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        get localStorage() {
          throw new Error("blocked");
        },
        matchMedia: () => media,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {},
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: element, querySelector: () => null },
    });
    try {
      const stop = initTheme();
      expect(element.dataset.theme).toBe("dark");
      stop();
    } finally {
      if (windowDescriptor)
        Object.defineProperty(globalThis, "window", windowDescriptor);
      else Reflect.deleteProperty(globalThis, "window");
      if (documentDescriptor)
        Object.defineProperty(globalThis, "document", documentDescriptor);
      else Reflect.deleteProperty(globalThis, "document");
    }
  });
});
