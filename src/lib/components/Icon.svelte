<script lang="ts">
  let { name, size = 20 }: { name: string; size?: number } = $props();
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    calendar: "M4 5h16v16H4zM16 3v4M8 3v4M4 10h16M8 14h2M14 14h2M8 17h2",
    sliders:
      "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-3M20 14V3M1 10h6M9 8h6M17 14h6",
    arrow: "M7 17 17 7M7 7h10v10",
    right: "M4 12h16M14 6l6 6-6 6",
    chevron: "M9 5l7 7-7 7",
    down: "M6 9l6 6 6-6",
    check: "M5 12l4 4L19 6",
    download: "M12 3v12M7 10l5 5 5-5M4 16v5h16v-5",
    upload: "M12 16V4M7 9l5-5 5 5M4 17v4h16v-4",
    plus: "M12 5v14M5 12h14",
    close: "M6 6l12 12M6 18 18 6",
    edit: "M16 4l4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11z",
    info: "M12 17v-5M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-5",
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
    coin: "M12 7v10M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    chart: "M4 3v17h17M7 14l4-5 4 3 6-7",
    reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
    wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01",
    menu: "M3 6h18M3 12h18M3 18h18",
    moon: "M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5z",
    sun: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    share: "M12 16V3m0 0L7 8m5-5 5 5M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6",
    book: "M12 5c-2-2-5-2-9-1v15c4-1 7-1 9 1m0-16c2-2 5-2 9-1v15c-4-1-7-1-9 1m0-16v16",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] ?? paths.home} /></svg
>
