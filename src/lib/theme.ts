export type ThemePreference = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

const key = "hearth-theme";

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): EffectiveTheme {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

export function readThemePreference(
  storage: Pick<Storage, "getItem">,
): ThemePreference {
  try {
    const value = storage.getItem(key);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function getEffectiveTheme(): EffectiveTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(preference: ThemePreference, systemDark: boolean) {
  const effective = resolveTheme(preference, systemDark);
  document.documentElement.dataset.theme = effective;
  document.documentElement.style.colorScheme = effective;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", effective === "dark" ? "#17191d" : "#ff385c");
  window.dispatchEvent(
    new CustomEvent("hearth-theme-change", { detail: effective }),
  );
}

export function setTheme(preference: ThemePreference): void {
  try {
    if (preference === "system") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, preference);
  } catch {
    // The current page still changes when storage is unavailable.
  }
  apply(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function initTheme(): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const refresh = () => {
    let preference: ThemePreference = "system";
    try {
      preference = readThemePreference(window.localStorage);
    } catch {
      // Some browsers deny access to the storage property itself.
    }
    apply(preference, media.matches);
  };
  const storage = (event: StorageEvent) => {
    if (event.key === key) refresh();
  };
  refresh();
  media.addEventListener("change", refresh);
  window.addEventListener("storage", storage);
  return () => {
    media.removeEventListener("change", refresh);
    window.removeEventListener("storage", storage);
  };
}
