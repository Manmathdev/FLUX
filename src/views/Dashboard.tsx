import { useMemo } from "react";
import {
  CheckCircle2,
  Flame,
  FileText,
  ArrowRight,
  Inbox,
  CalendarClock,
} from "lucide-react";
import { useData } from "../context/DataContext";
import {
  todayKey,
  startOfWeek,
  startOfMonth,
  greeting,
  longDate,
  formatDueDate,
  relativeTime,
} from "../lib/date";
import { currentStreak, isDoneToday, describeFrequency } from "../lib/streaks";
import { plainText } from "../lib/markdown";
import { FadeIn, CircleCheck, EmptyState } from "../components/primitives";
import type { ViewKey } from "../lib/types";

function Stat({
  icon,
  value,
  label,
  onClick,
  delay,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <FadeIn delay={delay} className="h-full">
      <button
        onClick={onClick}
        className="liquid-glass gh group flex h-full w-full flex-col justify-between gap-3 rounded-3xl p-4 text-left transition sm:p-5"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10">
          {icon}
        </span>
        <div>
          <p className="text-2xl font-medium tracking-tight text-white sm:text-3xl">{value}</p>
          <p className="mt-0.5 text-xs text-white/45">{label}</p>
        </div>
      </button>
    </FadeIn>
  );
}

export function Dashboard({ setView }: { setView: (v: ViewKey) => void }) {
  const { data, toggleTask, toggleCheckIn } = useData();
  const { tasks, habits, notes } = data;

  const stats = useMemo(() => {
    const wkStart = startOfWeek(new Date()).getTime();
    const monthStart = startOfMonth(new Date()).getTime();
    const completedThisWeek = tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt).getTime() >= wkStart
    ).length;
    const activeHabits = habits.filter((h) => currentStreak(h.checkIns, h.frequency) > 0);
    const notesThisMonth = notes.filter(
      (n) => new Date(n.createdAt).getTime() >= monthStart
    ).length;
    return {
      completedThisWeek,
      activeStreaks: activeHabits.length,
      totalStreak: activeHabits.reduce((s, h) => s + currentStreak(h.checkIns, h.frequency), 0),
      notesThisMonth,
    };
  }, [tasks, habits, notes]);

  const today = todayKey();
  const dueToday = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && t.dueDate && t.dueDate <= today)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))
        .slice(0, 6),
    [tasks, today]
  );

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5),
    [notes]
  );

  const pendingCount = dueToday.length;

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-0.5">
      <div className="flex flex-col gap-5">
        {/* Hero */}
        <FadeIn>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
            {longDate()}
          </p>
          <h1 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            {greeting()}.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-400 sm:text-lg">
            {pendingCount > 0
              ? `You have ${pendingCount} task${pendingCount > 1 ? "s" : ""} waiting and ${habits.length} habit${habits.length !== 1 ? "s" : ""} to keep alive.`
              : `Everything due today is clear. Keep your ${habits.length} habit${habits.length !== 1 ? "s" : ""} going.`}
          </p>
        </FadeIn>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            delay={80}
            icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
            value={stats.completedThisWeek}
            label="Tasks done this week"
            onClick={() => setView("tasks")}
          />
          <Stat
            delay={140}
            icon={<Flame className="h-[18px] w-[18px]" />}
            value={stats.activeStreaks}
            label={`Active streak${stats.activeStreaks !== 1 ? "s" : ""}`}
            onClick={() => setView("habits")}
          />
          <Stat
            delay={200}
            icon={<FileText className="h-[18px] w-[18px]" />}
            value={stats.notesThisMonth}
            label="Notes this month"
            onClick={() => setView("notes")}
          />
        </div>

        {/* Content grid */}
        <div className="grid gap-4 lg:grid-cols-5">
          <FadeIn delay={120} className="flex flex-col gap-4 lg:col-span-3">
            {/* Today's tasks */}
            <PanelSection
              title="Due today"
              count={dueToday.length}
              onAll={() => setView("tasks")}
            >
              {dueToday.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-5 w-5" />}
                  title="Nothing due today"
                  hint="Enjoy the calm — or plan ahead."
                />
              ) : (
                <ul className="flex flex-col">
                  {dueToday.map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]"
                    >
                      <CircleCheck
                        checked={t.completed}
                        onClick={() => toggleTask(t.id)}
                      />
                      <button
                        onClick={() => setView("tasks")}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm text-white/90">{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {formatDueDate(t.dueDate)}
                          </span>
                          {t.subtasks.length > 0 && (
                            <span>
                              {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PanelSection>

            {/* Today's habits */}
            <PanelSection
              title="Habits today"
              count={habits.length}
              onAll={() => setView("habits")}
            >
              {habits.length === 0 ? (
                <EmptyState
                  icon={<Flame className="h-5 w-5" />}
                  title="No habits yet"
                  hint="Build a streak from the Habits tab."
                />
              ) : (
                <ul className="flex flex-col gap-1">
                  {habits.map((h) => {
                    const done = isDoneToday(h.checkIns);
                    const streak = currentStreak(h.checkIns, h.frequency);
                    return (
                      <li
                        key={h.id}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]"
                      >
                        <CircleCheck checked={done} onClick={() => toggleCheckIn(h.id)} />
                        <button
                          onClick={() => setView("habits")}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm text-white/90">{h.title}</p>
                          <p className="mt-0.5 text-[11px] text-white/45">
                            {describeFrequency(h.frequency)}
                          </p>
                        </button>
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70 ring-1 ring-white/10">
                            <Flame className="h-3 w-3" />
                            {streak}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </PanelSection>
          </FadeIn>

          {/* Recent notes */}
          <FadeIn delay={180} className="lg:col-span-2">
            <PanelSection title="Recent notes" count={notes.length} onAll={() => setView("notes")}>
              {recentNotes.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="No notes yet"
                  hint="Capture an idea from the Notes tab."
                />
              ) : (
                <ul className="flex flex-col gap-1">
                  {recentNotes.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => setView("notes")}
                        className="w-full rounded-xl px-2 py-2.5 text-left transition hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-white/90">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-white/35">
                            {relativeTime(n.updatedAt)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
                          {plainText(n.body, 120) || "Empty note"}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PanelSection>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function PanelSection({
  title,
  count,
  onAll,
  children,
}: {
  title: string;
  count: number;
  onAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="liquid-glass rounded-3xl p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-white/80">
          {title}
          <span className="text-xs font-normal text-white/35">{count}</span>
        </h2>
        <button
          onClick={onAll}
          className="inline-flex items-center gap-1 text-xs text-white/45 transition hover:text-white"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {children}
    </div>
  );
}
