export function isInstalledDisplayMode(
  standaloneMedia: boolean,
  fullscreenMedia: boolean,
  iosStandalone: boolean,
): boolean {
  return standaloneMedia || fullscreenMedia || iosStandalone;
}

export function shouldShowInstall(
  installed: boolean,
  hasPrompt: boolean,
  mobileManualInstall: boolean,
): boolean {
  return !installed && (hasPrompt || mobileManualInstall);
}
