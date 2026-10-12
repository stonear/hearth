<script lang="ts">
  import type { Scenario } from "../mortgage";
  import { currencyFactor, maxExtraPayment } from "../mortgage";
  import { formatMoney, formatDate, duration } from "../format";
  import Icon from "./Icon.svelte";
  let {
    extra,
    scenario,
    currency,
    monthly,
    completed,
    onChange,
  }: {
    extra: number;
    scenario: Scenario;
    currency: string;
    monthly: number;
    completed: boolean;
    onChange: (extra: number) => void;
  } = $props();
  let limit = $derived(
    Math.min(
      maxExtraPayment(currency),
      Math.max(
        100,
        Math.ceil(((monthly / currencyFactor(currency)) * 2) / 100) * 100,
      ),
    ),
  );
  let step = $derived(
    Math.max(
      1,
      Math.min(
        currency === "IDR" ? 50000 : currency === "JPY" ? 1000 : 25,
        Math.floor(limit / 100),
      ),
    ),
  );
  function change(value: number) {
    onChange(
      Number.isFinite(value)
        ? Math.min(maxExtraPayment(currency), Math.max(0, value))
        : 0,
    );
  }
</script>

<section class="card simulator-card" id="simulator">
  <div class="card-heading">
    <div class="heading-with-icon">
      <span class="icon-tile mint"><Icon name="spark" /></span>
      <div>
        <h2>A little extra. A lot closer.</h2>
        <p class="muted">See what an extra monthly payment could do.</p>
      </div>
    </div>
    <span class="badge subtle">WHAT IF</span>
  </div>
  {#if completed}<div class="info-box">
      <Icon name="check" /><span
        >Your scheduled mortgage is fully repaid. There are no future payments
        to simulate.</span
      >
    </div>{:else}
    <div class="simulator-body">
      <div class="simulator-input">
        <label for="extra-payment"
          >Extra each month <span>{currency}</span></label
        >
        <div class="amount-input">
          <span>+</span><input
            id="extra-payment"
            type="number"
            min="0"
            max={maxExtraPayment(currency)}
            step="any"
            value={extra}
            oninput={(event) => change(Number(event.currentTarget.value))}
          />
        </div>
        <input
          type="range"
          aria-label="Extra monthly payment"
          min="0"
          max={Math.max(limit, extra)}
          {step}
          value={extra}
          oninput={(event) => change(Number(event.currentTarget.value))}
        />
        <div class="slider-labels">
          <span>{formatMoney(0, currency)}</span><span
            >{formatMoney(
              Math.max(limit, extra) * currencyFactor(currency),
              currency,
            )}</span
          >
        </div>
      </div>
      <div class="simulation-result">
        <span class="eyebrow">YOUR POTENTIAL SAVINGS</span>
        <div class="saving-pair">
          <div>
            <strong>{duration(scenario.monthsSaved)}</strong><span
              >off your mortgage</span
            >
          </div>
          <div>
            <strong>{formatMoney(scenario.interestSaved, currency)}</strong
            ><span>less interest</span>
          </div>
        </div>
        <p>
          <Icon name="calendar" size={16} />Mortgage-free by
          <strong>{formatDate(scenario.payoffDate, true)}</strong>
        </p>
      </div>
    </div>
    <p class="chart-caption">
      <Icon name="info" size={14} />A preview for future instalments only. Your
      tracked progress stays the same.
    </p>{/if}
</section>
