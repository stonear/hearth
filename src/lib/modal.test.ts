import { expect, test } from "bun:test";
import { modalFocus } from "./modal";

test("Tab from the last dialog control wraps to the first", () => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const animationDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "requestAnimationFrame",
  );
  const fakeDocument = {
    activeElement: null as unknown,
    body: { style: { overflow: "" } },
  };
  const control = () => ({
    offsetParent: {},
    focus() {
      fakeDocument.activeElement = this;
    },
  });
  const first = control();
  const copy = control();
  const textarea = control();
  fakeDocument.activeElement = textarea;
  let keydown: ((event: KeyboardEvent) => void) | undefined;
  const node = {
    querySelector: () => first,
    querySelectorAll: (selector: string) =>
      selector.includes("textarea") ? [first, copy, textarea] : [first, copy],
    addEventListener: (_: string, listener: (event: KeyboardEvent) => void) => {
      keydown = listener;
    },
    removeEventListener() {},
    focus() {},
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: () => void) => callback(),
  });
  try {
    const action = modalFocus(node as unknown as HTMLElement, () => {});
    fakeDocument.activeElement = textarea;
    let prevented = false;
    keydown?.({
      key: "Tab",
      shiftKey: false,
      preventDefault() {
        prevented = true;
      },
    } as KeyboardEvent);
    expect(prevented).toBe(true);
    expect(fakeDocument.activeElement).toBe(first);
    action.destroy();
  } finally {
    if (documentDescriptor)
      Object.defineProperty(globalThis, "document", documentDescriptor);
    else Reflect.deleteProperty(globalThis, "document");
    if (animationDescriptor)
      Object.defineProperty(
        globalThis,
        "requestAnimationFrame",
        animationDescriptor,
      );
    else Reflect.deleteProperty(globalThis, "requestAnimationFrame");
  }
});
