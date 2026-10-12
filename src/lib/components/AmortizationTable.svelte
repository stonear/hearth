<script lang="ts">
  import type { ScheduleRow } from "../mortgage";
  import { formatDate, formatMoney } from "../format";
  import { downloadFile } from "../storage";
  import Icon from "./Icon.svelte";
  let {
    rows,
    today,
    currency,
  }: { rows: ScheduleRow[]; today: string; currency: string } = $props();
  let year = $state("");
  let years = $derived([...new Set(rows.map((r) => r.date.slice(0, 4)))]);
  let effectiveYear = $derived(
    years.includes(year || today.slice(0, 4))
      ? year || today.slice(0, 4)
      : years[0],
  );
  let visible = $derived(rows.filter((r) => r.date.startsWith(effectiveYear)));
  function exportCsv() {
    const header = `Instalment,Date,Payment (${currency}),Principal (${currency}),Interest (${currency}),Balance (${currency}),Status`;
    // Integer tracked units are exported as raw major-unit values, not formatted currency strings.
    const factor = ["IDR", "JPY"].includes(currency) ? 1 : 100;
    const text = [
      header,
      ...rows.map((r) =>
        [
          r.index,
          r.date,
          r.payment / factor,
          r.principal / factor,
          r.interest / factor,
          r.balance / factor,
          r.date <= today ? "Paid (assumed)" : "Upcoming",
        ].join(","),
      ),
    ].join("\r\n");
    downloadFile("hearth-amortization.csv", text, "text/csv;charset=utf-8");
  }
</script>

<section class="card schedule-card">
  <div class="card-heading">
    <div>
      <h2>Your payment schedule</h2>
      <p class="muted">
        Every instalment, from your first payment to your last.
      </p>
    </div>
    <button class="button secondary" onclick={exportCsv}
      ><Icon name="download" size={16} />Export CSV</button
    >
  </div>
  <div class="table-toolbar">
    <label
      >Year<select
        value={effectiveYear}
        onchange={(event) => (year = event.currentTarget.value)}
        >{#each years as item (item)}<option>{item}</option>{/each}</select
      ></label
    ><span class="muted"
      >{rows.filter((r) => r.date <= today).length} of {rows.length} instalments paid
      automatically</span
    >
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus this scrollable table.) -->
  <div
    class="table-scroll"
    tabindex="0"
    role="region"
    aria-label="Amortization schedule"
  >
    <table>
      <thead
        ><tr
          ><th>Payment date</th><th>Instalment</th><th>Payment</th><th
            >Principal</th
          ><th>Interest</th><th>Balance</th><th>Status</th></tr
        ></thead
      ><tbody
        >{#each visible as row (row.index)}<tr
            ><td>{formatDate(row.date)}</td><td>#{row.index}</td><td
              >{formatMoney(row.payment, currency)}</td
            ><td>{formatMoney(row.principal, currency)}</td><td
              >{formatMoney(row.interest, currency)}</td
            ><td>{formatMoney(row.balance, currency)}</td><td
              ><span class:paid={row.date <= today} class="payment-status"
                >{#if row.date <= today}<Icon
                    name="check"
                    size={12}
                  />Paid{:else}Upcoming{/if}</span
              ></td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <p class="chart-caption">
    Paid means the scheduled date has arrived. Assumes all scheduled payments
    are made on time.
  </p>
</section>
