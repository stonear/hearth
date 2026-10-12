import { localDate } from "./mortgage";
export interface ClockEnvironment {
  now: () => Date;
  setTimer: (cb: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
  subscribe: (name: "focus" | "visibilitychange", cb: () => void) => () => void;
}
export function startDateRefresh(
  onDate: (date: string) => void,
  env?: ClockEnvironment,
): () => void {
  const clock: ClockEnvironment = env ?? {
    now: () => new Date(),
    setTimer: (cb, ms) => window.setTimeout(cb, ms),
    clearTimer: (id) => window.clearTimeout(id as number),
    subscribe: (name, cb) => {
      const target = name === "visibilitychange" ? document : window;
      target.addEventListener(name, cb);
      return () => target.removeEventListener(name, cb);
    },
  };
  let timer: unknown;
  const refresh = () => {
    if (timer !== undefined) clock.clearTimer(timer);
    const now = clock.now();
    onDate(localDate(now));
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    timer = clock.setTimer(refresh, midnight.getTime() - now.getTime() + 100);
  };
  const unsubscribers = ["focus", "visibilitychange"].map((name) =>
    clock.subscribe(name as "focus" | "visibilitychange", refresh),
  );
  refresh();
  return () => {
    clock.clearTimer(timer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
