<script lang="ts">
  import type { MortgageSettings } from "../mortgage";
  import { parseBackup, serializeBackup, downloadFile } from "../storage";
  import { formatMoney, formatDate } from "../format";
  import { currencyFactor } from "../mortgage";
  import Icon from "./Icon.svelte";
  import { modalFocus } from "../modal";
  let {
    settings,
    onImport,
    onReset,
  }: {
    settings: MortgageSettings;
    onImport: (s: MortgageSettings) => void;
    onReset: () => void;
  } = $props();
  let error = $state(""),
    imported = $state<MortgageSettings | null>(null),
    reset = $state(false),
    downloaded = $state(false);
  async function selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    error = "";
    if (!file) return;
    try {
      if (file.size > 100000)
        throw new Error("Choose a small Hearth JSON settings backup.");
      imported = parseBackup(await file.text()).settings;
    } catch (e) {
      error = (e as Error).message;
    }
    input.value = "";
  }
</script>

<div class="data-tools">
  <div>
    <h3>Your data stays with you</h3>
    <p class="muted">
      Saved on this browser. Keep a backup to use on another device.
    </p>
  </div>
  <div class="data-actions">
    <button
      class="button secondary"
      onclick={() => {
        downloadFile("hearth-mortgage-backup.json", serializeBackup(settings));
        downloaded = true;
      }}><Icon name="download" size={17} />Backup</button
    ><label class="button secondary file-button"
      ><Icon name="upload" size={17} />Import<input
        type="file"
        accept="application/json,.json"
        onchange={selectFile}
      /></label
    ><button class="text-button danger" onclick={() => (reset = true)}
      >Reset</button
    >
  </div>
</div>
{#if downloaded}<p class="success" role="status">
    Backup downloaded. Keep it somewhere safe.
  </p>{/if}
{#if error}<p class="error" role="alert">{error}</p>{/if}
{#if imported || reset}
  <div class="modal-layer">
    <div
      class="modal small-modal"
      use:modalFocus={() => {
        imported = null;
        reset = false;
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      tabindex="-1"
    >
      <h2 id="confirm-title">
        {imported ? "Replace your mortgage?" : "Reset this device?"}
      </h2>
      {#if imported}<p>
          Import <strong>{imported.name}</strong>: {formatMoney(
            imported.principal * currencyFactor(imported.currency),
            imported.currency,
          )}, starting {formatDate(imported.firstPaymentDate)}. This replaces
          your current settings.
        </p>{:else}<p>
          Your saved mortgage settings will be removed and the example restored.
          Download a backup first if you want to keep your details.
        </p>{/if}
      <div class="modal-actions">
        <button
          class="button secondary"
          onclick={() => {
            imported = null;
            reset = false;
          }}>Cancel</button
        ><button
          class="button primary"
          onclick={() => {
            if (imported) onImport(imported);
            else onReset();
            imported = null;
            reset = false;
          }}>{imported ? "Import mortgage" : "Reset settings"}</button
        >
      </div>
    </div>
  </div>
{/if}
