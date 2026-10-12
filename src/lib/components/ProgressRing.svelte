<script lang="ts">
  let {
    percentage,
    completed,
    total,
  }: { percentage: number; completed: number; total: number } = $props();
  const circumference = 2 * Math.PI * 66;
</script>

<div
  class="progress-ring"
  role="img"
  aria-label={`${percentage.toFixed(1)} percent of principal repaid; ${completed} of ${total} instalments paid`}
>
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <circle
      cx="80"
      cy="80"
      r="66"
      fill="none"
      stroke="#f1e6e4"
      stroke-width="9"
    />
    <circle
      cx="80"
      cy="80"
      r="66"
      fill="none"
      stroke="#ff385c"
      stroke-width="9"
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={circumference * (1 - percentage / 100)}
      transform="rotate(-90 80 80)"
    />
  </svg>
  <div class="ring-label">
    <strong>{percentage.toFixed(1)}<span>%</span></strong><small
      >principal repaid</small
    >
  </div>
</div>
