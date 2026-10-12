<script lang="ts">
  import type { ScheduleRow } from "../mortgage";
  import { compactMoney, formatMoney, formatDate } from "../format";
  let {
    baseline,
    scenario,
    elapsed,
    original,
    currency,
    hasExtra,
  }: {
    baseline: ScheduleRow[];
    scenario: ScheduleRow[];
    elapsed: number;
    original: number;
    currency: string;
    hasExtra: boolean;
  } = $props();
  let scope = $state("full"),
    selected = $state<number | null>(null);
  let start = $derived(
    scope === "five" ? Math.min(elapsed, baseline.length - 1) : 0,
  );
  let end = $derived(
    scope === "five" ? Math.min(start + 60, baseline.length) : baseline.length,
  );
  let max = $derived(start === 0 ? original : baseline[start - 1].balance);
  const width = 720,
    height = 270,
    left = 68,
    right = 18,
    top = 22,
    bottom = 36;
  let accelerated = $derived([...baseline.slice(0, elapsed), ...scenario]);
  const x = (n: number) =>
    left + ((n - start) / Math.max(1, end - start)) * (width - left - right);
  const y = (balance: number) =>
    top + (1 - balance / Math.max(1, max)) * (height - top - bottom);
  function line(rows: ScheduleRow[]) {
    const pts = [{ index: 0, balance: original }, ...rows].filter(
      (r) => r.index >= start && r.index <= end,
    );
    if (rows.length < end) pts.push({ index: end, balance: 0 });
    return pts
      .map((r, i) => `${i ? "L" : "M"}${x(r.index)},${y(r.balance)}`)
      .join(" ");
  }
  let baseLine = $derived(line(baseline));
  let extraLine = $derived(line(accelerated));
  let pointIndex = $derived(
    Math.max(
      start + 1,
      Math.min(end, selected ?? Math.max(start + 1, elapsed)),
    ),
  );
  let selectedRow = $derived(baseline[pointIndex - 1]);
  let paymentRows = $derived(baseline.slice(start, end));
  let maxPayment = $derived(Math.max(...paymentRows.map((row) => row.payment)));
  let barWidth = $derived(
    Math.max(1.6, Math.min(7, ((width - left - right) / (end - start)) * 0.68)),
  );
  const barBottom = 90,
    barHeight = 66;
  function explore(event: PointerEvent) {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const localX = ((event.clientX - rect.left) / rect.width) * width;
    selected = Math.round(
      start + ((localX - left) / (width - left - right)) * (end - start),
    );
  }
</script>

<section class="card balance-card">
  <div class="card-heading">
    <div>
      <h2>Your journey to mortgage-free</h2>
      <p class="muted">Watch your balance get smaller, month by month.</p>
    </div>
    <div class="segmented" aria-label="Chart time range">
      <button
        class:active={scope === "full"}
        onclick={() => {
          scope = "full";
          selected = null;
        }}>Full term</button
      ><button
        class:active={scope === "five"}
        onclick={() => {
          scope = "five";
          selected = null;
        }}>Next 5 years</button
      >
    </div>
  </div>
  <div class="chart-legend">
    <span><i class="legend-dot teal"></i>Scheduled balance</span
    >{#if hasExtra}<span><i class="legend-line"></i>With extra payments</span
      >{/if}<span class="chart-today"
      >{formatDate(selectedRow.date, true)}<strong
        >{formatMoney(selectedRow.balance, currency)}</strong
      ></span
    >
  </div>
  <svg
    class="balance-svg"
    viewBox={`0 0 ${width} ${height}`}
    role="img"
    aria-label="Mortgage balance projection. Explore individual months with the slider below."
    onpointermove={explore}
    onpointerleave={() => (selected = null)}
  >
    <defs
      ><linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1"
        ><stop offset="0%" stop-color="#ff385c" stop-opacity=".16" /><stop
          offset="100%"
          stop-color="#ff385c"
          stop-opacity=".01"
        /></linearGradient
      ></defs
    >
    {#each [0, 0.25, 0.5, 0.75, 1] as fraction (fraction)}<line
        x1={left}
        x2={width - right}
        y1={y(max * fraction)}
        y2={y(max * fraction)}
        stroke="#ece9e7"
        stroke-dasharray="3 5"
      /><text
        x={left - 12}
        y={y(max * fraction) + 4}
        text-anchor="end"
        class="axis-text">{compactMoney(max * fraction, currency)}</text
      >{/each}
    <path
      d={`${baseLine} L${x(end)},${y(0)} L${x(start)},${y(0)} Z`}
      fill="url(#balance-fill)"
    />
    <path d={baseLine} fill="none" stroke="#ff385c" stroke-width="3" />
    {#if hasExtra}<path
        d={extraLine}
        fill="none"
        stroke="#b88458"
        stroke-width="2.5"
        stroke-dasharray="7 5"
      />{/if}
    <line
      x1={x(pointIndex)}
      x2={x(pointIndex)}
      y1={top}
      y2={y(0)}
      stroke="#d5cfcc"
      stroke-dasharray="4 4"
    />
    <circle
      cx={x(pointIndex)}
      cy={y(selectedRow.balance)}
      r="5"
      fill="#ff385c"
      stroke="white"
      stroke-width="3"
    />
    {#each [0, 0.25, 0.5, 0.75, 1] as fraction (fraction)}{@const idx =
        Math.round(start + fraction * (end - start))}<text
        x={x(idx)}
        y={height - 8}
        text-anchor={fraction === 0
          ? "start"
          : fraction === 1
            ? "end"
            : "middle"}
        class="axis-text"
        >{baseline[Math.max(0, idx - 1)]?.date.slice(0, 4)}</text
      >{/each}
  </svg>
  <div class="payment-chart-heading">
    <h3>Principal and interest by month</h3>
    <div class="payment-chart-legend">
      <span><i class="legend-dot principal"></i>Principal</span>
      <span><i class="legend-dot interest"></i>Interest</span>
    </div>
  </div>
  <svg
    class="payment-chart"
    viewBox={`0 0 ${width} 102`}
    role="img"
    aria-label="Scheduled principal and interest for each month. Use the month slider below to inspect a payment."
    onpointermove={explore}
    onpointerdown={explore}
    onpointerleave={() => (selected = null)}
  >
    <line
      x1={left}
      x2={width - right}
      y1={barBottom}
      y2={barBottom}
      stroke="#eee8e5"
    />
    {#each paymentRows as row (row.index)}
      {@const principalHeight = (row.principal / maxPayment) * barHeight}
      {@const interestHeight = (row.interest / maxPayment) * barHeight}
      <rect
        x={x(row.index) - barWidth / 2}
        y={barBottom - principalHeight}
        width={barWidth}
        height={principalHeight}
        fill="#ff385c"
        opacity={row.index === pointIndex ? 1 : 0.72}
      />
      <rect
        x={x(row.index) - barWidth / 2}
        y={barBottom - principalHeight - interestHeight}
        width={barWidth}
        height={interestHeight}
        fill="#c89a6d"
        opacity={row.index === pointIndex ? 1 : 0.8}
      />
    {/each}
    <line
      x1={x(pointIndex)}
      x2={x(pointIndex)}
      y1="13"
      y2={barBottom}
      stroke="#3d3331"
      stroke-width="1"
      stroke-dasharray="3 4"
    />
  </svg>
  <div class="chart-explore">
    <label for="chart-month"
      >Explore month <strong>{pointIndex} / {baseline.length}</strong></label
    ><input
      id="chart-month"
      type="range"
      min={start + 1}
      max={end}
      value={pointIndex}
      oninput={(event) => (selected = Number(event.currentTarget.value))}
    />
  </div>
  <div class="payment-month-detail" aria-live="polite">
    <div>
      <span>{formatDate(selectedRow.date)} · payment {pointIndex}</span>
      <strong>{formatMoney(selectedRow.payment, currency)}</strong>
    </div>
    <div>
      <span
        >{pointIndex <= elapsed
          ? "Principal paid"
          : "Scheduled principal"}</span
      >
      <strong>{formatMoney(selectedRow.principal, currency)}</strong>
    </div>
    <div>
      <span
        >{pointIndex <= elapsed ? "Interest paid" : "Scheduled interest"}</span
      >
      <strong>{formatMoney(selectedRow.interest, currency)}</strong>
    </div>
  </div>
  <p class="chart-caption">
    {elapsed} instalments have passed. Scheduled balance reaches zero in {formatDate(
      baseline.at(-1)!.date,
      true,
    )}{hasExtra
      ? `; your extra-payment scenario finishes in ${formatDate(accelerated.at(-1)!.date, true)}`
      : ""}.
  </p>
</section>
