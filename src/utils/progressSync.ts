import { Milestone } from '../types/project';

/**
 * Calculate total weighted project progress (%) from all milestones.
 */
export function calculateTotalProgress(milestones: Milestone[]): number {
  const sum = milestones.reduce(
    (acc, m) => acc + (Number(m.weight) || 0) * ((Number(m.progressPercent) || 0) / 100),
    0
  );
  return Math.max(0, Math.min(100, Number(sum.toFixed(1))));
}

/**
 * Calculate a single milestone's percentage contribution to the overall project.
 */
export function calculateMilestoneContribution(weight: number, progressPercent: number): number {
  return Number((((Number(weight) || 0) * (Number(progressPercent) || 0)) / 100).toFixed(1));
}

function parseIsoDateUtc(dateStr: string): number | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
}

function formatUtcIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Get the calendar start and end dates (YYYY-MM-DD) for a given contract week number.
 */
export function getWeekDateRange(
  projectStartDate: string,
  weekNumber: number
): { startDate: string; endDate: string } {
  const startMs = parseIsoDateUtc(projectStartDate);
  if (startMs === null || weekNumber < 1) {
    return { startDate: '[belum diisi]', endDate: '[belum diisi]' };
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const weekStartMs = startMs + (weekNumber - 1) * 7 * dayMs;
  const weekEndMs = weekStartMs + 6 * dayMs;
  return {
    startDate: formatUtcIsoDate(weekStartMs),
    endDate: formatUtcIsoDate(weekEndMs),
  };
}

/**
 * Compute scheduled cumulative target progress (%) at the end of `weekNumber`
 * directly from the contract milestone dates and weights.
 */
export function computeScheduledPlannedProgress(
  milestones: Milestone[],
  projectStartDate: string,
  weekNumber: number,
  totalWeeks: number
): number {
  const projectStartMs = parseIsoDateUtc(projectStartDate);
  const dayMs = 24 * 60 * 60 * 1000;

  if (projectStartMs === null || milestones.length === 0) {
    const safeTotal = Math.max(1, totalWeeks || 1);
    return Math.min(100, Number(((Math.min(weekNumber, safeTotal) / safeTotal) * 100).toFixed(1)));
  }

  const weekEndMs = projectStartMs + weekNumber * 7 * dayMs - dayMs;
  let validDatedMilestones = 0;

  const weightedPlan = milestones.reduce((acc, m) => {
    const mStart = parseIsoDateUtc(m.startDate);
    const mEnd = parseIsoDateUtc(m.targetEndDate);
    if (mStart === null || mEnd === null) return acc;

    validDatedMilestones += 1;
    if (weekEndMs < mStart) return acc;
    if (weekEndMs >= mEnd) return acc + m.weight;

    const totalDuration = Math.max(dayMs, mEnd - mStart + dayMs);
    const elapsed = Math.max(0, weekEndMs - mStart + dayMs);
    const fraction = Math.min(1, elapsed / totalDuration);
    return acc + m.weight * fraction;
  }, 0);

  if (validDatedMilestones === 0) {
    const safeTotal = Math.max(1, totalWeeks || 1);
    return Math.min(100, Number(((Math.min(weekNumber, safeTotal) / safeTotal) * 100).toFixed(1)));
  }

  return Math.max(0, Math.min(100, Number(weightedPlan.toFixed(1))));
}
