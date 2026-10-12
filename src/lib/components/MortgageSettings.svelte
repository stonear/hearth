<script lang="ts">
  import { untrack } from "svelte";
  import {
    buildSchedule,
    currencies,
    currencyFactor,
    loanFromHousePrice,
    validateSettings,
    type MortgageSettings,
  } from "../mortgage";
  import Icon from "./Icon.svelte";
  import { modalFocus } from "../modal";
  import { formatMoney } from "../format";
  let {
    settings,
    sample,
    onSave,
    onClose,
  }: {
    settings: MortgageSettings;
    sample: boolean;
    onSave: (s: MortgageSettings) => void;
    onClose: () => void;
  } = $props();
  const initial = untrack(() => settings);
  let name = $state(initial.name),
    housePrice = $state(initial.housePrice ?? initial.principal),
    downPayment = $state(initial.downPayment ?? 0),
    annualRate = $state(initial.annualRate),
    termMonths = $state(initial.termMonths),
    firstPaymentDate = $state(initial.firstPaymentDate),
    currency = $state(initial.currency);
  let error = $state("");
  let downPaymentPercent = $derived(
    housePrice > 0 ? (downPayment / housePrice) * 100 : 0,
  );
  let loanAmount = $derived(
    Number.isFinite(housePrice) && Number.isFinite(downPayment)
      ? Math.max(0, housePrice - downPayment)
      : 0,
  );
  function updateDownPaymentPercent(event: Event) {
    const percent = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(percent) && Number.isFinite(housePrice))
      downPayment =
        Math.round((housePrice * percent * currencyFactor(currency)) / 100) /
        currencyFactor(currency);
  }
  function submit(event: SubmitEvent) {
    event.preventDefault();
    try {
      const next = validateSettings({
        name,
        principal: loanFromHousePrice(housePrice, downPayment, currency),
        housePrice,
        downPayment,
        annualRate,
        termMonths,
        firstPaymentDate,
        currency,
      });
      buildSchedule(next);
      onSave(next);
    } catch (e) {
      error = (e as Error).message;
    }
  }
</script>

<div class="modal-layer">
  <div
    class="modal"
    use:modalFocus={onClose}
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
    tabindex="-1"
  >
    <div class="modal-heading">
      <div>
        <span class="eyebrow">YOUR HOME, YOUR NUMBERS</span>
        <h2 id="settings-title">
          {sample ? "Set up your mortgage" : "Mortgage settings"}
        </h2>
      </div>
      <button class="icon-button" onclick={onClose} aria-label="Close settings"
        ><Icon name="close" /></button
      >
    </div>
    <p class="muted">
      Enter your loan details once. We’ll keep your progress up to date
      automatically.
    </p>
    <form onsubmit={submit}>
      <label
        >Mortgage name<input
          bind:value={name}
          maxlength="80"
          required
          placeholder="My first home"
        /></label
      >
      <div class="form-grid">
        <label
          >House price<input
            type="number"
            bind:value={housePrice}
            min="1"
            step="any"
            required
          /></label
        ><label
          >Currency<select bind:value={currency}
            >{#each currencies as code (code)}<option value={code}
                >{code}</option
              >{/each}</select
          ></label
        >
      </div>
      <div class="form-grid">
        <label
          >Down payment<input
            type="number"
            bind:value={downPayment}
            min="0"
            step="any"
            required
          /></label
        ><label
          >Down payment (%)<input
            type="number"
            value={downPaymentPercent}
            oninput={updateDownPaymentPercent}
            min="0"
            max="100"
            step="any"
          /></label
        >
      </div>
      <div class="info-box">
        <Icon name="info" /><span
          >Mortgage amount: {formatMoney(
            Math.round(loanAmount * currencyFactor(currency)),
            currency,
          )} (house price minus down payment).</span
        >
      </div>
      <div class="form-grid">
        <label
          >Annual interest rate (%)<input
            type="number"
            bind:value={annualRate}
            min="0"
            step="any"
            required
          /></label
        ><label
          >Loan term (months)<input
            type="number"
            bind:value={termMonths}
            min="1"
            max="600"
            step="1"
            required
          /><small
            >{(termMonths / 12).toFixed(termMonths % 12 ? 1 : 0)} years</small
          ></label
        >
      </div>
      <label
        >First payment date<input
          type="date"
          bind:value={firstPaymentDate}
          min="1900-01-01"
          max="9949-12-31"
          required
        /><small>Use the date of your first monthly instalment.</small></label
      >
      <div class="info-box">
        <Icon name="info" /><span
          >Payments count as paid on their scheduled dates. Assumes all
          scheduled payments are made on time.</span
        >
      </div>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <div class="modal-actions">
        <button class="button secondary" type="button" onclick={onClose}
          >Cancel</button
        ><button class="button primary" type="submit"
          >{sample ? "Start tracking" : "Save changes"}<Icon
            name="right"
            size={17}
          /></button
        >
      </div>
    </form>
  </div>
</div>
