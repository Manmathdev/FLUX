import { dateKey, addDays, startOfWeek, todayKey } from "../lib/date";
import { cn } from "../lib/utils";

const WEEKS = 13;
const ROW_LABELS = ["M", "", "W", "", "F", "", ""];

/** GitHub-style monochrome calendar heatmap of the last ~13 weeks. */
export function Heatmap({ checkIns }: { checkIns: string[] }) {
  const set = new Set(checkIns);
  const today = todayKey();
  const start = addDays(startOfWeek(new Date()), -(WEEKS - 1) * 7);

  const cols: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) col.push(addDays(start, w * 7 + d));
    cols.push(col);
  }

  return (
    <div className="flex items-start gap-2 overflow-hidden">
      <div className="flex flex-col gap-[3px] py-px text-[8px] leading-3 text-white/25">
        {ROW_LABELS.map((d, i) => (
          <span key={i} className="h-3 w-2">
            {d}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((day, di) => {
              const k = dateKey(day);
              const checked = set.has(k);
              const isToday = k === today;
              const future = k > today;
              return (
                <span
                  key={di}
                  title={`${k}${checked ? " · done" : ""}`}
                  className={cn(
                    "h-3 w-3 rounded-[3px] transition-colors",
                    checked
                      ? "bg-white/85"
                      : future
                        ? "bg-white/[0.02]"
                        : "bg-white/[0.07]",
                    isToday && "ring-1 ring-white/60"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
