# Hearth

A responsive, local-first mortgage PWA built with SvelteKit and Bun. Set up your loan once, then see your balance and progress advance automatically as payment dates arrive.

## Why Hearth?

A hearth is the warm center of a home, where people gather. We chose the name because the goal behind every mortgage number is a place to call home. Hearth makes that journey easier to understand, one scheduled payment at a time.

## What is Hearth?

Hearth is a private mortgage progress tracker. Enter your house price, down payment, interest rate, loan term, and first payment date; Hearth estimates your monthly payment, remaining principal, interest, and payoff date. Scheduled payments count as paid when their dates arrive, so you do not need to record each payment. The figures are planning estimates based on on-time payments, not a live balance from your lender.

## Run locally

Install Bun, then run:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the localhost URL printed by Vite. Use **Set up my mortgage** to replace the labelled example with your loan. There is no payment entry or monthly check-in.

Enter a house price and either a down payment amount or percentage; the form calculates the mortgage amount. Existing saved loans without house-price details remain usable.

```sh
bun test
bun run check
bun run build
bun run preview
```

Production files are written to `build/`. The GitHub Pages workflow builds with the repository path and deploys only after lint, formatting, type checks, tests, and the production build pass. In the repository’s **Settings → Pages**, choose **GitHub Actions** as the publishing source. Push to `main` to publish; pull requests run checks without deploying.

## What you can do

- See remaining balance, principal repaid, estimated interest paid, and time to payoff.
- Explore the monthly balance chart and each payment's principal and interest, across the full term or the next five years.
- Preview recurring extra principal payments and compare payoff dates, time saved, and interest saved.
- View the yearly amortization schedule and export it as CSV.
- Change mortgage settings and currency; export/import validated JSON backups.
- Install the app, use it offline after an initial online visit, and accept app updates when ready.
- Look up plain-English definitions of the mortgage terms used throughout the app.

## Automatic progress

Payments with a scheduled date **on or before your device's current local date** count as paid, including payments due today. Progress recalculates on load, at local midnight, and when the app regains focus or visibility. Dates never advance based on UTC conversion. Month-end payments stay anchored: January 31 → February 28/29 → March 31.

**Assumes all scheduled payments are made on time.** Balances are estimates from the configured fixed-rate mortgage, not confirmations from a lender. Missed payments, rate changes, fees, taxes, and insurance are excluded. The simulator affects future instalments only and does not change the tracked mortgage.

The monthly payment follows standard fixed-rate amortization; a zero-rate loan divides principal across its term. IDR and JPY are tracked in whole units; USD, EUR, GBP, SGD, AUD, and CAD in cents. Monthly interest is rounded to the tracked unit. The final instalment settles the outstanding balance, including small rounding differences. Inputs that cannot produce a decreasing, finite balance are rejected.

## Your data

Settings are stored only in this browser under `hearth.mortgage.v1`. There is no account, server database, analytics, or automatic cross-device synchronization. Clearing browser storage removes settings. The labelled example is never saved as your personal mortgage automatically.

In **Mortgage details**, download a JSON backup before switching devices or clearing storage. Import validates the schema and loan calculations before offering a replacement preview. Invalid backups leave current settings intact. Storage errors are shown visibly; export a backup if your browser cannot save.

## PWA

Service workers require HTTPS or localhost. The production build precaches application code, icons, fonts, and the shell. Reload online once and allow installation to finish before using offline. Development mode does not provide production shell caching.

On supported desktop/Android browsers, use **Install app**. On iOS/iPadOS, open in Safari and select **Share → Add to Home Screen**. The app shows network status and prompts when a new service-worker version is waiting; it activates on **Update now**. JSON and CSV exports are not cached by the service worker.

## License

Hearth is licensed under the GNU General Public License, version 3 or later. See [LICENSE](LICENSE).

## Maintenance

`bun run lint` checks Svelte and TypeScript; `bun run format` applies standard Prettier formatting, and `bun run format:check` verifies it. Dependabot opens weekly dependency and workflow update requests. The lockfile keeps every build reproducible until an update is reviewed.

## Structure

- `src/lib/mortgage.ts`: validation, amortization, date-based progress, and simulation.
- `src/lib/storage.ts`: versioned settings and validated backups.
- `src/lib/clock.ts`: midnight and resume refresh.
- `src/lib/components/`: charts, schedule, forms, backup controls, and PWA status.
- `src/routes/+page.svelte`: dashboard and section navigation.
- `src/service-worker/`: offline shell caching and explicit update activation.

Calculation, persistence, and clock tests run with `bun test`. Design and implementation decisions are in `docs/superpowers/`.
