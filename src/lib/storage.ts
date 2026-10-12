import {
  buildSchedule,
  validateSettings,
  type MortgageSettings,
} from "./mortgage";
export interface Backup {
  version: 1;
  settings: MortgageSettings;
}
const key = "hearth.mortgage.v1";
export function parseBackup(text: string): Backup {
  if (text.length > 100_000)
    throw new Error("Backup is too large. Choose a Hearth settings backup.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !value ||
    typeof value !== "object" ||
    (value as Record<string, unknown>).version !== 1
  )
    throw new Error("This backup version is not supported.");
  const settings = validateSettings(
    (value as Record<string, unknown>).settings,
  );
  buildSchedule(settings);
  return { version: 1, settings };
}
export function serializeBackup(settings: MortgageSettings): string {
  return JSON.stringify(
    { version: 1, settings: validateSettings(settings) },
    null,
    2,
  );
}
export function loadSettings(storage: Storage): {
  settings: MortgageSettings | null;
  error: string | null;
} {
  try {
    const text = storage.getItem(key);
    return {
      settings: text === null ? null : parseBackup(text).settings,
      error: null,
    };
  } catch {
    return {
      settings: null,
      error:
        "Saved settings could not be loaded. The example is shown; import a backup or set up your mortgage.",
    };
  }
}
export function saveSettings(
  storage: Storage,
  settings: MortgageSettings,
): { error: string | null } {
  try {
    storage.setItem(key, serializeBackup(settings));
    return { error: null };
  } catch {
    return {
      error:
        "Changes are not saved on this device. Download a backup to keep them.",
    };
  }
}
export function clearSettings(storage: Storage): void {
  storage.removeItem(key);
}
export function downloadFile(
  filename: string,
  content: string,
  type = "application/json",
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
