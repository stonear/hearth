<script lang="ts">
  import { onMount, tick } from "svelte";
  import { asset } from "$app/paths";
  import {
    currencyFactor,
    getProgress,
    simulateExtra,
    localDate,
    renameMortgage,
    type MortgageSettings,
  } from "../lib/mortgage";
  import { clearSettings, loadSettings, saveSettings } from "../lib/storage";
  import { startDateRefresh } from "../lib/clock";
  import { formatDate, formatMoney, duration } from "../lib/format";
  import Icon from "../lib/components/Icon.svelte";
  import ProgressRing from "../lib/components/ProgressRing.svelte";
  import BalanceChart from "../lib/components/BalanceChart.svelte";
  import ExtraPaymentSimulator from "../lib/components/ExtraPaymentSimulator.svelte";
  import AmortizationTable from "../lib/components/AmortizationTable.svelte";
  import MortgageSettingsForm from "../lib/components/MortgageSettings.svelte";
  import DataControls from "../lib/components/DataControls.svelte";
  import PwaStatus from "../lib/components/PwaStatus.svelte";
  import ShareProgress from "../lib/components/ShareProgress.svelte";
  import {
    getEffectiveTheme,
    initTheme,
    setTheme,
    type EffectiveTheme,
  } from "../lib/theme";
  const demo: MortgageSettings = {
    name: "My first home",
    principal: 350000000,
    housePrice: 500000000,
    downPayment: 150000000,
    annualRate: 10,
    termMonths: 144,
    firstPaymentDate: "2021-03-15",
    currency: "IDR",
  };
  let settings = $state<MortgageSettings>({ ...demo }),
    today = $state(localDate()),
    sample = $state(true),
    ready = $state(false);
  let section = $state("overview"),
    showSettings = $state(false),
    showShare = $state(false),
    extra = $state(0),
    storageError = $state("");
  let theme = $state<EffectiveTheme>("light");
  let editingName = $state(false);
  let nameDraft = $state("");
  let nameInput = $state<HTMLInputElement>();
  let mainElement: HTMLElement;
  let sectionAnimation: Animation | null = null;
  let navigationSequence = 0;
  let progress = $derived(getProgress(settings, today));
  let scenario = $derived(simulateExtra(settings, today, extra));
  let monthly = $derived(progress.schedule[0].payment);
  let totalInterest = $derived(
    progress.schedule.reduce((sum, row) => sum + row.interest, 0),
  );
  let next = $derived(progress.next);
  let recent = $derived(
    progress.schedule.slice(
      Math.max(0, progress.elapsedCount - 2),
      Math.min(progress.schedule.length, progress.elapsedCount + 1),
    ),
  );
  let nextMilestone = $derived(
    [25, 50, 75, 100].find((n) => n > progress.percentage) ?? 100,
  );
  let milestoneDate = $derived(
    progress.schedule.find(
      (r) =>
        (1 -
          r.balance /
            (settings.principal * currencyFactor(settings.currency))) *
          100 >=
        nextMilestone,
    )?.date ?? progress.schedule.at(-1)!.date,
  );
  const nav = [
    { id: "overview", name: "Overview", icon: "grid" },
    { id: "schedule", name: "Payment schedule", icon: "calendar" },
    { id: "settings", name: "Mortgage details", icon: "sliders" },
    { id: "glossary", name: "Glossary", icon: "book" },
  ];
  const glossary = [
    {
      term: "Mortgage",
      definition:
        "A loan used to buy a home, with the property serving as security for the lender. You repay the borrowed amount plus interest over time.",
    },
    {
      term: "Down payment",
      definition:
        "The part of the house price you pay upfront. Hearth subtracts it from the house price to find your starting loan amount.",
    },
    {
      term: "Principal",
      definition:
        "The amount borrowed, excluding interest. Each payment's principal portion reduces the amount you still owe.",
    },
    {
      term: "Annual interest rate",
      definition:
        "The yearly percentage charged on the unpaid principal. Hearth assumes this rate stays fixed throughout the loan term.",
    },
    {
      term: "Loan term",
      definition:
        "The length of time allowed to repay the loan. Hearth measures it in monthly payments.",
    },
    {
      term: "Monthly payment",
      definition:
        "The scheduled amount paid each month toward principal and interest. Hearth does not include taxes, insurance, or lender fees.",
    },
    {
      term: "Amortization",
      definition:
        "The process of paying off a loan through regular payments. Early payments usually contain more interest; later ones repay more principal.",
    },
    {
      term: "Remaining balance",
      definition:
        "The principal still unpaid after the scheduled payments counted so far. It does not include future interest.",
    },
    {
      term: "Extra principal payment",
      definition:
        "Money paid in addition to the scheduled payment and applied directly to principal. Hearth's simulator shows how this could shorten the term and reduce interest.",
    },
    {
      term: "Payoff date",
      definition:
        "The date of the final scheduled payment, when the estimated remaining principal reaches zero.",
    },
  ];
  onMount(() => {
    const syncTheme = () => (theme = getEffectiveTheme());
    const stopTheme = initTheme();
    syncTheme();
    window.addEventListener("hearth-theme-change", syncTheme);
    try {
      const result = loadSettings(window.localStorage);
      if (result.settings) {
        settings = result.settings;
        sample = false;
      }
      storageError = result.error ?? "";
    } catch {
      storageError =
        "Browser storage is unavailable. Download a backup to keep your settings.";
    }
    ready = true;
    const stopClock = startDateRefresh((date) => (today = date));
    return () => {
      stopClock();
      stopTheme();
      window.removeEventListener("hearth-theme-change", syncTheme);
    };
  });
  function save(nextSettings: MortgageSettings) {
    settings = nextSettings;
    sample = false;
    extra = 0;
    showSettings = false;
    persistSettings();
  }
  function persistSettings() {
    try {
      storageError = saveSettings(window.localStorage, settings).error ?? "";
    } catch {
      storageError =
        "Changes are not saved on this device. Download a backup to keep them.";
    }
  }
  function startNameEdit() {
    nameDraft = settings.name;
    editingName = true;
    void tick().then(() => {
      nameInput?.focus();
      nameInput?.select();
    });
  }
  function finishNameEdit(commit: boolean) {
    if (!editingName) return;
    editingName = false;
    if (!commit || !nameDraft.trim()) return;
    const nextSettings = renameMortgage(settings, nameDraft);
    if (nextSettings.name === settings.name) return;
    settings = nextSettings;
    sample = false;
    persistSettings();
  }
  function reset() {
    try {
      clearSettings(window.localStorage);
      storageError = "";
    } catch {
      storageError =
        "The saved settings could not be removed. Browser storage is unavailable.";
    }
    settings = { ...demo };
    sample = true;
    extra = 0;
  }
  function go(id: string) {
    if (section === id) return;
    const sequence = ++navigationSequence;
    const update = async () => {
      section = id;
      window.scrollTo({ top: 0, behavior: "instant" });
      await tick();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void update();
    } else {
      sectionAnimation?.cancel();
      void update().then(() => {
        if (sequence !== navigationSequence) return;
        sectionAnimation = mainElement.animate(
          [
            { opacity: 0.72, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 220, easing: "ease-out" },
        );
      });
    }
  }
</script>

<svelte:head
  ><title>Hearth — Your mortgage, in perspective</title><meta
    name="description"
    content="An effortless mortgage tracker. See your balance, track automatic progress, and explore a faster path to mortgage-free living."
  /></svelte:head
>
<div class="app-shell">
  <aside class="sidebar">
    <a
      class="brand"
      href="#overview"
      onclick={() => go("overview")}
      aria-label="Hearth home"
      ><span class="brand-mark"
        ><img src={asset("favicon.svg")} alt="" width="38" height="38" /></span
      >hearth<span class="brand-period">.</span></a
    >
    <div class="sidebar-caption">A LITTLE CLOSER, EVERY MONTH</div>
    <nav aria-label="Main navigation">
      {#each nav as item (item.id)}<button
          class:active={section === item.id}
          onclick={() => go(item.id)}
          aria-current={section === item.id ? "page" : undefined}
          ><Icon name={item.icon} /><span>{item.name}</span
          >{#if section === item.id}<span class="nav-dot"></span>{/if}</button
        >{/each}
    </nav>
    <div class="sidebar-bottom">
      <div class="private-note">
        <Icon name="shield" size={20} />
        <div>
          <strong>Just you and your home.</strong>
          <p>Your mortgage data stays<br />on this device.</p>
        </div>
      </div>
      <div class="sidebar-loan">
        <span class="avatar"><Icon name="home" size={19} /></span>
        <div>
          <strong>{settings.name}</strong><small
            >{sample ? "Example mortgage" : "Personal mortgage"}</small
          >
        </div>
        <button
          class="icon-button"
          aria-label="Edit mortgage"
          onclick={() => (showSettings = true)}
          ><Icon name="sliders" size={17} /></button
        >
      </div>
    </div>
  </aside>
  <div class="main-shell">
    <header class="topbar">
      <a
        class="mobile-brand"
        href="#overview"
        onclick={() => go("overview")}
        aria-label="Hearth home">hearth<span>.</span></a
      >
      <div class="breadcrumb">
        My home <Icon name="chevron" size={13} /><strong
          >{nav.find((item) => item.id === section)?.name}</strong
        >
      </div>
      <div class="topbar-actions">
        <span class="auto-status"><i></i>Progress on autopilot</span>
        <button
          class="header-icon-button"
          aria-label="Share progress"
          title="Share progress"
          onclick={() => (showShare = true)}
          ><Icon name="share" size={19} /></button
        >
        <button
          class="header-icon-button"
          aria-label={theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          onclick={() => setTheme(theme === "dark" ? "light" : "dark")}
          ><Icon name={theme === "dark" ? "sun" : "moon"} size={19} /></button
        ><PwaStatus />
      </div>
    </header>
    <main id="main-content" bind:this={mainElement}>
      <div class="page-heading">
        <div>
          <span class="eyebrow">YOUR PATH TO MORTGAGE-FREE</span>
          <h1>
            {section === "overview"
              ? "Your home. Your progress."
              : section === "schedule"
                ? "Every payment brings you closer."
                : section === "settings"
                  ? "Make yourself at home."
                  : "Mortgage words, made simple."}
          </h1>
          <p>
            {section === "overview"
              ? "The big picture, without the spreadsheets."
              : section === "schedule"
                ? "A clear view of where your money goes each month."
                : section === "settings"
                  ? "One simple setup. A clearer picture of your mortgage."
                  : "A quick guide to the terms you see in Hearth."}
          </p>
        </div>
        {#if section !== "glossary"}
          <div class="heading-actions">
            {#if section === "overview"}<button
                class="button secondary"
                onclick={() => (showShare = true)}
                ><Icon name="share" size={17} />Share progress</button
              >{/if}
            {#if section !== "glossary"}<button
                class="button secondary edit-button"
                onclick={() => (showSettings = true)}
                ><Icon name="sliders" size={17} />{sample
                  ? "Set up my mortgage"
                  : "Edit mortgage"}</button
              >{/if}
          </div>
        {/if}
      </div>
      {#if sample && section !== "glossary"}<div class="sample-banner">
          <span
            ><Icon name="info" size={16} />You’re exploring an example mortgage.</span
          ><button onclick={() => (showSettings = true)}
            >Make it yours<Icon name="right" size={15} /></button
          >
        </div>{/if}
      {#if storageError}<div class="error-banner" role="alert">
          {storageError}
        </div>{/if}
      {#if !ready}<p class="muted" role="status">
          Loading your mortgage…
        </p>{:else if section === "overview"}
        <section class="progress-hero">
          <div class="hero-photo">
            <img
              src={asset("first-home.jpg")}
              alt="Two-story home at dusk"
              fetchpriority="high"
            />
          </div>
          <div class="hero-copy">
            {#if editingName}
              <input
                class="hero-name-input"
                aria-label="Mortgage name"
                maxlength="80"
                bind:value={nameDraft}
                bind:this={nameInput}
                onblur={() => finishNameEdit(true)}
                onkeydown={(event) => {
                  if (event.key === "Enter") finishNameEdit(true);
                  if (event.key === "Escape") finishNameEdit(false);
                }}
              />
            {:else}
              <button
                class="hero-tag hero-name-button"
                aria-label={`Edit mortgage name: ${settings.name}`}
                title="Edit mortgage name"
                onclick={startNameEdit}
              >
                <span class="tiny-home"><Icon name="home" size={14} /></span>
                {settings.name}
                <Icon name="edit" size={13} />
              </button>
            {/if}
            <div class="hero-balance-label">Estimated remaining balance</div>
            <div class="hero-balance">
              {formatMoney(progress.remainingBalance, settings.currency)}
            </div>
            <p>
              {progress.remainingBalance === 0
                ? "You’ve reached the end of your scheduled mortgage. Welcome home."
                : "Every month, a little less debt. A little more freedom."}
            </p>
            <div class="hero-bottom">
              <span
                ><Icon name="check" size={15} />{progress.elapsedCount} of {progress
                  .schedule.length} instalments complete</span
              ><span class="hero-date"
                ><Icon name="calendar" size={15} />{formatDate(today)}</span
              >
            </div>
          </div>
          <ProgressRing
            percentage={progress.percentage}
            completed={progress.elapsedCount}
            total={progress.schedule.length}
          />
        </section>
        <div class="summary-grid">
          <section class="card summary-card">
            <div class="stat-top">
              <span>Principal repaid</span><span class="stat-icon"
                ><Icon name="chart" size={18} /></span
              >
            </div>
            <strong class="stat-value"
              >{formatMoney(progress.principalPaid, settings.currency)}</strong
            ><span class="stat-foot positive"
              ><Icon name="arrow" size={13} />{progress.percentage.toFixed(1)}%
              of your original loan</span
            ><span class="stat-foot"
              >Original principal: {formatMoney(
                settings.principal * currencyFactor(settings.currency),
                settings.currency,
              )}</span
            >
          </section>
          <section class="card summary-card">
            <div class="stat-top">
              <span>Monthly payment</span><span class="stat-icon"
                ><Icon name="coin" size={18} /></span
              >
            </div>
            <strong class="stat-value"
              >{formatMoney(monthly, settings.currency)}</strong
            ><span class="stat-foot"
              >{settings.annualRate}% fixed annual interest</span
            >
          </section>
          <section class="card summary-card">
            <div class="stat-top">
              <span>Interest paid to date</span><span class="stat-icon"
                ><Icon name="coin" size={18} /></span
              >
            </div>
            <strong class="stat-value"
              >{formatMoney(progress.interestPaid, settings.currency)}</strong
            ><span class="stat-foot">Estimated from your schedule</span>
          </section>
          <section class="card summary-card">
            <div class="stat-top">
              <span>Time to mortgage-free</span><span class="stat-icon"
                ><Icon name="clock" size={18} /></span
              >
            </div>
            <strong class="stat-value"
              >{duration(
                progress.schedule.length - progress.elapsedCount,
              )}</strong
            ><span class="stat-foot"
              >{progress.remainingBalance === 0
                ? "Scheduled mortgage complete"
                : `Payoff in ${formatDate(progress.schedule.at(-1)!.date, true)}`}</span
            >
          </section>
        </div>
        <div class="dashboard-grid">
          <BalanceChart
            baseline={progress.schedule}
            scenario={scenario.schedule}
            elapsed={progress.elapsedCount}
            original={settings.principal * currencyFactor(settings.currency)}
            currency={settings.currency}
            hasExtra={extra > 0 && !!next}
          />
          <section class="card next-payment-card">
            <div class="card-heading">
              <h2>{next ? "Up next" : "You made it"}</h2>
              <span class="icon-tile neutral"
                ><Icon name={next ? "calendar" : "check"} size={18} /></span
              >
            </div>
            {#if next}<span class="next-date">{formatDate(next.date)}</span
              ><strong class="next-amount"
                >{formatMoney(next.payment, settings.currency)}</strong
              >
              <div class="payment-split">
                <span style={`width:${(next.principal / next.payment) * 100}%`}
                ></span>
              </div>
              <div class="split-row">
                <span><i class="legend-dot teal"></i>Principal</span><strong
                  >{formatMoney(next.principal, settings.currency)}</strong
                >
              </div>
              <div class="split-row">
                <span><i class="legend-dot sand"></i>Interest</span><strong
                  >{formatMoney(next.interest, settings.currency)}</strong
                >
              </div>
              <div class="next-note">
                <Icon name="check" size={16} /><span
                  >Updates automatically on your payment date.</span
                >
              </div>{:else}<strong class="next-amount">100% complete</strong>
              <p class="muted">
                No more scheduled payments. Your projected balance is zero.
              </p>{/if}
          </section>
        </div>
        <ExtraPaymentSimulator
          {extra}
          {scenario}
          currency={settings.currency}
          {monthly}
          completed={!next}
          onChange={(value) => (extra = value)}
        />
        <div class="dashboard-grid bottom-grid">
          <section class="card activity-card">
            <div class="card-heading">
              <h2>On your schedule</h2>
              <button class="text-button" onclick={() => go("schedule")}
                >View all<Icon name="right" size={15} /></button
              >
            </div>
            {#each recent as row (row.index)}<div class="activity-row">
                <span class="activity-icon" class:upcoming={row.date > today}
                  ><Icon
                    name={row.date <= today ? "check" : "calendar"}
                    size={18}
                  /></span
                >
                <div>
                  <strong>{formatDate(row.date)}</strong><span
                    >Instalment #{row.index} · {row.date <= today
                      ? "Paid automatically"
                      : "Upcoming"}</span
                  >
                </div>
                <strong>{formatMoney(row.payment, settings.currency)}</strong>
              </div>{/each}
          </section>
          <section class="card milestone-card">
            <div class="card-heading">
              <h2>Your next milestone</h2>
              <Icon name="spark" size={20} />
            </div>
            <strong class="milestone-number"
              >{nextMilestone}%<span>principal repaid</span></strong
            >
            <div class="milestone-track">
              <span
                style={`width:${Math.min(100, (progress.percentage / nextMilestone) * 100)}%`}
              ></span>
            </div>
            <p>
              {progress.percentage === 100
                ? "All milestones reached. That’s a big achievement."
                : `On track for ${formatDate(milestoneDate, true)}. Little steps add up to big things.`}
            </p>
          </section>
        </div>
        <p class="assumption-note">
          <Icon name="info" size={15} />Assumes all scheduled payments are made
          on time. Estimates exclude taxes, insurance, and fees.
        </p>
      {:else if section === "schedule"}
        <AmortizationTable
          rows={progress.schedule}
          {today}
          currency={settings.currency}
        />
        <div class="schedule-totals">
          <div>
            <span>Original principal</span><strong
              >{formatMoney(
                settings.principal * currencyFactor(settings.currency),
                settings.currency,
              )}</strong
            >
          </div>
          <div>
            <span>Total scheduled interest</span><strong
              >{formatMoney(totalInterest, settings.currency)}</strong
            >
          </div>
          <div>
            <span>Total scheduled repayment</span><strong
              >{formatMoney(
                settings.principal * currencyFactor(settings.currency) +
                  totalInterest,
                settings.currency,
              )}</strong
            >
          </div>
        </div>
      {:else if section === "settings"}
        <section class="card details-card">
          <div class="card-heading">
            <div>
              <h2>{settings.name}</h2>
              <p class="muted">
                {sample
                  ? "Example mortgage · replace with your details"
                  : "Your mortgage at a glance"}
              </p>
            </div>
            <button class="button primary" onclick={() => (showSettings = true)}
              >Edit details<Icon name="sliders" size={16} /></button
            >
          </div>
          <dl class="details-grid">
            {#if settings.housePrice !== undefined && settings.downPayment !== undefined}
              <div>
                <dt>House price</dt>
                <dd>
                  {formatMoney(
                    settings.housePrice * currencyFactor(settings.currency),
                    settings.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>Down payment</dt>
                <dd>
                  {formatMoney(
                    settings.downPayment * currencyFactor(settings.currency),
                    settings.currency,
                  )} ({(
                    (settings.downPayment / settings.housePrice) *
                    100
                  ).toFixed(1)}%)
                </dd>
              </div>
            {/if}
            <div>
              <dt>Original loan amount</dt>
              <dd>
                {formatMoney(
                  settings.principal * currencyFactor(settings.currency),
                  settings.currency,
                )}
              </dd>
            </div>
            <div>
              <dt>Annual fixed rate</dt>
              <dd>{settings.annualRate}%</dd>
            </div>
            <div>
              <dt>Loan term</dt>
              <dd>{duration(settings.termMonths)}</dd>
            </div>
            <div>
              <dt>First payment</dt>
              <dd>{formatDate(settings.firstPaymentDate)}</dd>
            </div>
            <div>
              <dt>Monthly payment</dt>
              <dd>{formatMoney(monthly, settings.currency)}</dd>
            </div>
            <div>
              <dt>Scheduled payoff</dt>
              <dd>{formatDate(progress.schedule.at(-1)!.date)}</dd>
            </div>
          </dl>
        </section>
        <section class="card how-card">
          <span class="icon-tile mint"><Icon name="clock" /></span>
          <div>
            <h2>Progress that takes care of itself</h2>
            <p>
              Instalments count as paid when their scheduled dates arrive,
              including today. We calculate your balance and progress from that
              schedule, so there’s nothing to check off.
            </p>
            <p>
              Assumes all scheduled payments are made on time. If payments were
              missed or your rate changed, this estimate may differ from your
              lender’s balance.
            </p>
          </div>
        </section>
        <section class="card">
          <DataControls {settings} onImport={save} onReset={reset} />
        </section>
      {:else}
        <section class="card glossary-intro">
          <span class="icon-tile mint"><Icon name="book" size={22} /></span>
          <div>
            <h2>Understand your mortgage at a glance</h2>
            <p>
              Hearth estimates a fixed-rate loan using the details you enter.
              These definitions explain the numbers on your dashboard and
              payment schedule.
            </p>
            <div
              class="glossary-formula"
              aria-label="House price minus down payment equals starting principal"
            >
              House price <span>−</span> Down payment <span>=</span> Starting principal
            </div>
          </div>
        </section>
        <section class="glossary-grid" aria-label="Mortgage terms">
          {#each glossary as entry, index (entry.term)}
            <article class="card glossary-card">
              <span class="glossary-number"
                >{String(index + 1).padStart(2, "0")}</span
              >
              <h2>{entry.term}</h2>
              <p>{entry.definition}</p>
            </article>
          {/each}
        </section>
        <p class="glossary-note">
          <Icon name="info" size={16} />Hearth assumes scheduled payments are
          made on time. Your lender's actual balance may differ.
        </p>
      {/if}
      <footer class="page-footer">
        <span>Built for a little more peace of mind.</span><span
          ><Icon name="shield" size={13} />Private by design</span
        >
      </footer>
    </main>
  </div>
  <nav class="mobile-nav" aria-label="Mobile navigation">
    {#each nav as item (item.id)}<button
        class:active={section === item.id}
        onclick={() => go(item.id)}
        aria-current={section === item.id ? "page" : undefined}
        ><Icon name={item.icon} size={20} /><span
          >{item.id === "schedule"
            ? "Schedule"
            : item.id === "settings"
              ? "Details"
              : item.id === "glossary"
                ? "Glossary"
                : item.name}</span
        ></button
      >{/each}
  </nav>
</div>
{#if showSettings}<MortgageSettingsForm
    {settings}
    {sample}
    onSave={save}
    onClose={() => (showSettings = false)}
  />{/if}
{#if showShare}<ShareProgress
    {settings}
    {progress}
    {today}
    {theme}
    onClose={() => (showShare = false)}
  />{/if}
