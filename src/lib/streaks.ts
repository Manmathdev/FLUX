import type { Frequency } from "./types";
import { dateKey, fromKey, addDays, startOfWeek, todayKey } from "./date";

const DAY = 86400000;
const FAR_PAST = addDays(new Date(), -3650);

export function isChecked(checkIns: string[], key: string): boolean {
  return checkIns.includes(key);
}

/** Build week (Monday-start) bucket counts from raw check-in keys. */
function weekCounts(checkIns: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const k of checkIns) {
    const wk = dateKey(startOfWeek(fromKey(k)));
    counts[wk] = (counts[wk] || 0) + 1;
  }
  return counts;
}

/** Consecutive completed streak ending today (grace for "today not done yet"). */
export function currentStreak(checkIns: string[], freq: Frequency): number {
  const set = new Set(checkIns);

  if (freq.type === "weekly") {
    const counts = weekCounts(checkIns);
    let streak = 0;
    let cursor = startOfWeek(new Date());
    for (let i = 0; i < 520; i++) {
      const wk = dateKey(cursor);
      const met = (counts[wk] || 0) >= Math.max(1, freq.target || 1);
      if (met) {
        streak++;
      } else if (i === 0) {
        // current week still in progress — don't break the chain yet
      } else {
        break;
      }
      cursor = addDays(cursor, -7);
    }
    return streak;
  }

  if (freq.type === "custom") {
    const days = freq.days && freq.days.length ? freq.days : [0, 1, 2, 3, 4, 5, 6];
    let cursor = new Date();
    // grace: if today is an expected day but not yet checked, start from yesterday
    if (days.includes(cursor.getDay()) && !set.has(dateKey(cursor))) {
      cursor = addDays(cursor, -1);
    }
    let streak = 0;
    while (cursor >= FAR_PAST) {
      if (days.includes(cursor.getDay())) {
        if (set.has(dateKey(cursor))) {
          streak++;
          cursor = addDays(cursor, -1);
        } else break;
      } else {
        cursor = addDays(cursor, -1);
      }
    }
    return streak;
  }

  // daily
  let cursor = new Date();
  if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(dateKey(cursor)) && cursor >= FAR_PAST) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest completed streak ever recorded for a habit. */
export function longestStreak(checkIns: string[], freq: Frequency): number {
  const set = new Set(checkIns);
  const keys = Array.from(set).sort();

  if (freq.type === "weekly") {
    const counts = weekCounts(keys);
    const wks = Object.keys(counts).sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const wk of wks) {
      const met = counts[wk] >= Math.max(1, freq.target || 1);
      if (!met) {
        run = 0;
        prev = wk;
        continue;
      }
      if (prev) {
        const diff = Math.round((fromKey(wk).getTime() - fromKey(prev).getTime()) / (7 * DAY));
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = wk;
    }
    return best;
  }

  if (freq.type === "custom") {
    const days = freq.days && freq.days.length ? freq.days : [0, 1, 2, 3, 4, 5, 6];
    if (keys.length === 0) return 0;
    let c = addDays(fromKey(keys[0]), -7);
    const today = new Date();
    let best = 0;
    let run = 0;
    while (c <= today) {
      if (days.includes(c.getDay())) {
        if (set.has(dateKey(c))) {
          run++;
          best = Math.max(best, run);
        } else run = 0;
      }
      c = addDays(c, 1);
    }
    return best;
  }

  // daily
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    if (prev) {
      const diff = Math.round((fromKey(k).getTime() - fromKey(prev).getTime()) / DAY);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** Times completed this calendar week (for dashboard / habit cards). */
export function doneThisWeek(checkIns: string[]): number {
  const wkStart = dateKey(startOfWeek(new Date()));
  return checkIns.filter((k) => k >= wkStart).length;
}

export function isDoneToday(checkIns: string[]): boolean {
  return checkIns.includes(todayKey());
}

export function describeFrequency(freq: Frequency): string {
  if (freq.type === "daily") return "Every day";
  if (freq.type === "weekly") return `${freq.target}× / week`;
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = (freq.days.length ? freq.days : [0, 1, 2, 3, 4, 5, 6]).slice().sort();
  return days.map((d) => names[d]).join(" · ");
}
