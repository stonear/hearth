import type { MortgageSettings, Progress } from "./mortgage";
import { formatDate, formatMoney } from "./format";
import type { EffectiveTheme } from "./theme";

export interface ShareSnapshot {
  name: string;
  percentageLabel: string;
  percentage: number;
  completedLabel: string;
  milestoneLabel: string;
  asOf: string;
  estimateNote: string;
  remainingBalance?: string;
  principalPaid?: string;
}

export function createShareSnapshot(
  settings: MortgageSettings,
  progress: Progress,
  today: string,
  includeAmounts: boolean,
): ShareSnapshot {
  const name = settings.name.trim().replace(/\s+/g, " ");
  const characters = Array.from(name);
  const boundedName =
    characters.length > 48 ? `${characters.slice(0, 47).join("")}…` : name;
  const percentage = Math.max(0, Math.min(100, progress.percentage));
  const milestone = [25, 50, 75, 100].find((value) => value > percentage);
  return {
    name: boundedName,
    percentageLabel: `${percentage.toFixed(1)}%`,
    percentage,
    completedLabel: `${progress.elapsedCount} of ${progress.schedule.length} payments complete`,
    milestoneLabel: milestone
      ? `Next milestone: ${milestone}% principal repaid`
      : "Mortgage complete",
    asOf: formatDate(today),
    estimateNote: "Estimated from scheduled payments made on time.",
    ...(includeAmounts
      ? {
          remainingBalance: formatMoney(
            progress.remainingBalance,
            settings.currency,
          ),
          principalPaid: formatMoney(progress.principalPaid, settings.currency),
        }
      : {}),
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  let fitted = text;
  while (fitted.length > 1 && ctx.measureText(fitted).width > maxWidth)
    fitted = `${Array.from(fitted).slice(0, -2).join("")}…`;
  ctx.fillText(fitted, x, y);
}

export function renderSharePng(
  snapshot: ShareSnapshot,
  theme: EffectiveTheme,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    return Promise.reject(
      new Error("Image export is unavailable in this browser."),
    );
  const dark = theme === "dark";
  const page = dark ? "#17191d" : "#faf8f6";
  const card = dark ? "#25272c" : "#ffffff";
  const ink = dark ? "#f4f1f0" : "#222222";
  const muted = dark ? "#b6b0ae" : "#717171";
  const track = dark ? "#47343a" : "#ffe4e9";
  const coral = "#ff385c";
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = card;
  roundedRect(ctx, 34, 34, 1132, 562, 34);
  ctx.fill();
  ctx.fillStyle = coral;
  roundedRect(ctx, 34, 34, 1132, 13, 6);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = coral;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(91, 121);
  ctx.lineTo(115, 101);
  ctx.lineTo(139, 121);
  ctx.moveTo(97, 118);
  ctx.lineTo(97, 145);
  ctx.lineTo(133, 145);
  ctx.lineTo(133, 118);
  ctx.moveTo(110, 145);
  ctx.lineTo(110, 129);
  ctx.lineTo(121, 129);
  ctx.lineTo(121, 145);
  ctx.stroke();
  ctx.font = "800 38px Manrope, Arial, sans-serif";
  ctx.fillStyle = ink;
  ctx.fillText("hearth", 158, 137);
  ctx.fillStyle = coral;
  ctx.fillText(".", 281, 137);
  ctx.font = "700 20px Arial, sans-serif";
  ctx.fillStyle = coral;
  ctx.fillText("YOUR MORTGAGE PROGRESS", 88, 225);
  ctx.font = "700 46px Manrope, Arial, sans-serif";
  ctx.fillStyle = ink;
  drawFittedText(ctx, snapshot.name, 88, 289, 750);
  ctx.font = "800 104px Manrope, Arial, sans-serif";
  ctx.fillText(snapshot.percentageLabel, 85, 405);
  ctx.fillStyle = track;
  roundedRect(ctx, 90, 437, 735, 18, 9);
  ctx.fill();
  ctx.fillStyle = coral;
  if (snapshot.percentage > 0) {
    roundedRect(
      ctx,
      90,
      437,
      Math.max(18, (735 * snapshot.percentage) / 100),
      18,
      9,
    );
    ctx.fill();
  }
  ctx.fillStyle = muted;
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(snapshot.completedLabel, 90, 503);
  ctx.font = "20px Arial, sans-serif";
  drawFittedText(ctx, snapshot.milestoneLabel, 90, 543, 750);
  ctx.fillStyle = dark ? "#382932" : "#fff0f2";
  roundedRect(ctx, 868, 183, 250, snapshot.remainingBalance ? 279 : 216, 24);
  ctx.fill();
  ctx.fillStyle = dark ? "#ff9baf" : "#c8274c";
  ctx.font = "700 19px Arial, sans-serif";
  ctx.fillText(
    snapshot.remainingBalance ? "YOUR NUMBERS" : "A LITTLE CLOSER",
    894,
    231,
  );
  ctx.fillStyle = ink;
  ctx.font = "700 27px Manrope, Arial, sans-serif";
  if (snapshot.remainingBalance) {
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText("Remaining balance", 894, 280);
    ctx.font = "700 26px Manrope, Arial, sans-serif";
    drawFittedText(ctx, snapshot.remainingBalance, 894, 317, 196);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText("Principal repaid", 894, 365);
    ctx.font = "700 26px Manrope, Arial, sans-serif";
    drawFittedText(ctx, snapshot.principalPaid ?? "", 894, 402, 196);
  } else {
    ctx.fillText("Every month", 894, 284);
    ctx.fillText("counts.", 894, 321);
  }
  ctx.fillStyle = muted;
  ctx.font = "17px Arial, sans-serif";
  ctx.fillText(`As of ${snapshot.asOf}`, 870, 520);
  drawFittedText(ctx, snapshot.estimateNote, 870, 550, 245);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create the share image.")),
      "image/png",
    );
  });
}
