<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import { isInstalledDisplayMode, shouldShowInstall } from "../install";
  interface InstallPrompt extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  }
  let online = $state(true),
    prompt = $state<InstallPrompt | null>(null),
    waiting = $state<ServiceWorker | null>(null),
    help = $state(false),
    updating = $state(false),
    updateError = $state(""),
    installed = $state(false),
    mobileManualInstall = $state(false),
    dismissedPrompt = $state(false);
  let showInstall = $derived(
    shouldShowInstall(
      installed,
      !!prompt,
      mobileManualInstall && !dismissedPrompt,
    ),
  );
  onMount(() => {
    online = navigator.onLine;
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");
    const syncInstalled = () => {
      installed = isInstalledDisplayMode(
        standaloneMedia.matches,
        fullscreenMedia.matches,
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
      if (installed) help = false;
    };
    syncInstalled();
    mobileManualInstall =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const network = () => (online = navigator.onLine);
    const capture = (event: Event) => {
      event.preventDefault();
      prompt = event as InstallPrompt;
      dismissedPrompt = false;
    };
    const markInstalled = () => {
      installed = true;
      prompt = null;
      help = false;
    };
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", markInstalled);
    standaloneMedia.addEventListener("change", syncInstalled);
    fullscreenMedia.addEventListener("change", syncInstalled);
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const watch = () => {
      const worker = registration?.installing;
      worker?.addEventListener("statechange", () => {
        if (
          !disposed &&
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        )
          waiting = registration?.waiting ?? null;
      });
    };
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((value) => {
        if (disposed || !value) return;
        registration = value;
        waiting = value.waiting;
        watch();
        value.addEventListener("updatefound", watch);
      });
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        controllerChange,
      );
    }
    function controllerChange() {
      if (updating) window.location.reload();
    }
    return () => {
      disposed = true;
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", markInstalled);
      standaloneMedia.removeEventListener("change", syncInstalled);
      fullscreenMedia.removeEventListener("change", syncInstalled);
      registration?.removeEventListener("updatefound", watch);
      if ("serviceWorker" in navigator)
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controllerChange,
        );
    };
  });
  async function install() {
    if (!prompt) {
      help = !help;
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      prompt = null;
      dismissedPrompt = true;
      if (choice.outcome === "accepted") help = false;
    } catch {
      help = true;
    }
  }
  function update() {
    updating = true;
    updateError = "";
    waiting?.postMessage({ type: "ACTIVATE_UPDATE" });
  }
</script>

{#if !online}<span class="device-status offline-status"
    ><Icon name="wifi" size={15} />Offline</span
  >{:else if showInstall}<button class="pwa-button" onclick={install}
    ><Icon name="download" size={15} />Install app</button
  >{/if}
{#if help}<div class="pwa-notice" role="status">
    <p>
      Install Hearth from your browser menu. On iPhone or iPad, use Safari’s
      Share menu → Add to Home Screen. Installation and offline use need HTTPS
      or localhost.
    </p>
    <button class="button secondary" onclick={() => (help = false)}
      >Got it</button
    >
  </div>{/if}
{#if waiting}<div class="pwa-notice" role="status">
    <p>A fresh version of Hearth is ready.</p>
    {#if updateError}<p class="error">{updateError}</p>{/if}<button
      class="button primary"
      disabled={updating}
      onclick={update}>{updating ? "Updating…" : "Update now"}</button
    ><button class="button secondary" onclick={() => (waiting = null)}
      >Later</button
    >
  </div>{/if}
