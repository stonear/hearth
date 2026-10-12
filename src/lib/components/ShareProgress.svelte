<script lang="ts">
  import type { MortgageSettings, Progress } from "../mortgage";
  import type { EffectiveTheme } from "../theme";
  import { createShareSnapshot, renderSharePng } from "../share";
  import { modalFocus } from "../modal";
  import Icon from "./Icon.svelte";

  let {
    settings,
    progress,
    today,
    theme,
    onClose,
  }: {
    settings: MortgageSettings;
    progress: Progress;
    today: string;
    theme: EffectiveTheme;
    onClose: () => void;
  } = $props();
  let includeAmounts = $state(false);
  let previewUrl = $state("");
  let png = $state<Blob | null>(null);
  let preparing = $state(true);
  let fileShare = $state(false);
  let error = $state("");
  let status = $state("");
  let snapshot = $derived(
    createShareSnapshot(settings, progress, today, includeAmounts),
  );

  $effect(() => {
    const data = snapshot;
    const color = theme;
    let disposed = false;
    let createdUrl = "";
    png = null;
    previewUrl = "";
    preparing = true;
    error = "";
    status = "";
    void renderSharePng(data, color)
      .then((blob) => {
        if (disposed) return;
        createdUrl = URL.createObjectURL(blob);
        png = blob;
        previewUrl = createdUrl;
        try {
          const file = new File([blob], "hearth-progress.png", {
            type: "image/png",
          });
          fileShare =
            !!navigator.share && !!navigator.canShare?.({ files: [file] });
        } catch {
          fileShare = false;
        }
        preparing = false;
      })
      .catch(() => {
        if (disposed) return;
        preparing = false;
        error =
          "Could not create the image. Try changing the preview and try again.";
      });
    return () => {
      disposed = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  });

  function downloadImage() {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = "hearth-progress.png";
    document.body.append(link);
    link.click();
    link.remove();
    status = "Image downloaded.";
  }

  async function shareImage() {
    if (!png) return;
    if (!fileShare) {
      downloadImage();
      return;
    }
    try {
      const file = new File([png], "hearth-progress.png", {
        type: "image/png",
      });
      await navigator.share({
        files: [file],
        title: "Hearth mortgage progress",
      });
      status = "Ready to share.";
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      error = "Sharing was unavailable. Download the image instead.";
    }
  }
</script>

<div class="modal-layer share-layer">
  <button
    class="share-backdrop"
    tabindex="-1"
    aria-label="Close share dialog"
    onclick={onClose}
  ></button>
  <div
    class="modal share-modal"
    use:modalFocus={onClose}
    role="dialog"
    aria-modal="true"
    aria-labelledby="share-title"
    tabindex="-1"
  >
    <div class="modal-heading">
      <div>
        <span class="eyebrow">YOUR PROGRESS, YOUR WAY</span>
        <h2 id="share-title">Share your progress</h2>
      </div>
      <button
        class="icon-button"
        aria-label="Close share dialog"
        onclick={onClose}><Icon name="close" /></button
      >
    </div>
    <p class="muted">
      Preview what others will see. Your figures stay on this device until you
      choose to share them.
    </p>
    <label class="share-privacy">
      <input type="checkbox" bind:checked={includeAmounts} />
      <span>Include exact amounts</span>
    </label>
    <div class="share-preview" aria-label="Progress image preview">
      {#if previewUrl}
        <img
          src={previewUrl}
          alt={`Share card for ${snapshot.name}: ${snapshot.percentageLabel} repaid, ${snapshot.completedLabel}`}
        />
      {:else if preparing}
        <p role="status">Preparing your image…</p>
      {:else}
        <p>Image preview unavailable.</p>
      {/if}
    </div>
    <p class="share-estimate">{snapshot.estimateNote} As of {snapshot.asOf}.</p>
    <div class="share-actions">
      <button class="button primary" disabled={!png} onclick={shareImage}>
        <Icon name={fileShare ? "share" : "download"} size={17} />{fileShare
          ? "Share image"
          : "Download image"}
      </button>
      {#if fileShare}<button
          class="button secondary"
          disabled={!png}
          onclick={downloadImage}>Download PNG</button
        >{/if}
    </div>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if status}<p class="success" role="status">{status}</p>{/if}
  </div>
</div>
