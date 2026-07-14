import { useMemo, useState } from "react";
import {
  Plus,
  Flame,
  Pencil,
  Check,
  Link2,
  Repeat,
  TrendingUp,
  Target,
} from "lucide-react";
import { useData } from "../context/DataContext";
import type { Habit, Frequency, FrequencyType } from "../lib/types";
import { cn } from "../lib/utils";
import {
  currentStreak,
  longestStreak,
  isDoneToday,
  doneThisWeek,
  describeFrequency,
} from "../lib/streaks";
import {
  FadeIn,
  PrimaryButton,
  GlassButton,
  IconButton,
  Label,
  EmptyState,
  DeleteButton,
} from "../components/primitives";
import { Modal } from "../components/Modal";
import { Heatmap } from "../components/Heatmap";
import {
  LinkEditor,
  linkSelFromHabit,
  reconcileLinks,
  type LinkSel,
  type LinkKey,
} from "../components/LinkEditor";

function unit(freq: Frequency): string {
  if (freq.type === "weekly") return "week";
  return "day";
}

export function HabitsView() {
  const { data, toggleCheckIn, deleteHabit } = useData();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <FadeIn className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal tracking-[-0.03em] text-white sm:text-3xl">Habits</h1>
          <p className="mt-1 text-xs text-white/40">
            {data.habits.length} habit{data.habits.length !== 1 ? "s" : ""} ·{" "}
            {data.habits.filter((h) => currentStreak(h.checkIns, h.frequency) > 0).length} on a streak
          </p>
        </div>
        <PrimaryButton onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New habit
        </PrimaryButton>
      </FadeIn>

      <div className="scroll-thin -mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {data.habits.length === 0 ? (
          <EmptyState
            icon={<Flame className="h-5 w-5" />}
            title="No habits yet"
            hint="Start a streak you can be proud of."
            action={
              <PrimaryButton onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                New habit
              </PrimaryButton>
            }
          />
        ) : (
          <div className="grid gap-4 pb-2 sm:grid-cols-2">
            {data.habits.map((h, i) => (
              <FadeIn key={h.id} delay={Math.min(i * 50, 400)}>
                <HabitCard
                  habit={h}
                  onToggle={() => toggleCheckIn(h.id)}
                  onEdit={() => setEditing(h)}
                />
              </FadeIn>
            ))}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <HabitEditor
          key={editing ? editing.id : "new"}
          habit={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onDeleted={(id) => deleteHabit(id)}
        />
      )}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
  onEdit,
}: {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const done = isDoneToday(habit.checkIns);
  const cur = currentStreak(habit.checkIns, habit.frequency);
  const best = longestStreak(habit.checkIns, habit.frequency);
  const week = doneThisWeek(habit.checkIns);
  const links = habit.linkedNoteIds.length + habit.linkedTaskIds.length;
  const u = unit(habit.frequency);

  return (
    <div className="liquid-glass flex h-full flex-col gap-4 rounded-3xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-white">{habit.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
              <Repeat className="h-3 w-3" />
              {describeFrequency(habit.frequency)}
            </span>
            {links > 0 && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {links}
              </span>
            )}
          </div>
        </div>
        <IconButton title="Edit habit" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
          <p className="flex items-center gap-1 text-[11px] text-white/40">
            <Flame className="h-3 w-3" /> Current
          </p>
          <p className="mt-1 text-2xl font-medium tracking-tight text-white">
            {cur}
            <span className="ml-1 text-xs font-normal text-white/40">{u}{cur !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
          <p className="flex items-center gap-1 text-[11px] text-white/40">
            <TrendingUp className="h-3 w-3" /> Longest
          </p>
          <p className="mt-1 text-2xl font-medium tracking-tight text-white">
            {best}
            <span className="ml-1 text-xs font-normal text-white/40">{u}{best !== 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>

      <Heatmap checkIns={habit.checkIns} />

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-[11px] text-white/40">
          {habit.frequency.type === "weekly"
            ? `${week} / ${habit.frequency.target} this week`
            : `${week} this week`}
        </span>
        {done ? (
          <GlassButton onClick={onToggle} className="!px-4">
            <Check className="h-4 w-4" />
            Done today
          </GlassButton>
        ) : (
          <PrimaryButton onClick={onToggle} className="!px-4 !py-2">
            Check in
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function HabitEditor({
  habit,
  onClose,
  onDeleted,
}: {
  habit: Habit | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const api = useData();
  const isNew = !habit;

  const [title, setTitle] = useState(habit?.title ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [freq, setFreq] = useState<Frequency>(
    habit?.frequency ?? { type: "daily", target: 1, days: [] }
  );
  const initialLinks = useMemo<LinkSel>(
    () => (habit ? linkSelFromHabit(habit) : { tasks: [], habits: [], notes: [] }),
    [habit]
  );
  const [links, setLinks] = useState<LinkSel>(initialLinks);

  const setType = (type: FrequencyType) => {
    if (type === "daily") setFreq({ type, target: 1, days: [] });
    else if (type === "weekly") setFreq({ type, target: Math.max(1, freq.target || 3), days: [] });
    else setFreq({ type, target: 0, days: freq.days.length ? freq.days : [1, 2, 3, 4, 5] });
  };
  const toggleDay = (d: number) =>
    setFreq((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));
  const toggleLink = (key: LinkKey, id: string) =>
    setLinks((prev) => {
      const has = prev[key].includes(id);
      return { ...prev, [key]: has ? prev[key].filter((x) => x !== id) : [...prev[key], id] };
    });

  const save = () => {
    const payload = {
      title: title.trim() || "Untitled habit",
      description,
      frequency: freq,
    };
    if (isNew) {
      const created = api.addHabit(payload);
      reconcileLinks(api, { type: "habit", id: created.id }, { tasks: [], habits: [], notes: [] }, links);
    } else if (habit) {
      api.updateHabit(habit.id, payload);
      reconcileLinks(api, { type: "habit", id: habit.id }, initialLinks, links);
    }
    onClose();
  };

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "New habit" : "Edit habit"}
      subtitle={isNew ? "Build a streak" : "Update the details"}
      icon={<Repeat className="h-4 w-4" />}
      footer={
        <>
          {!isNew && habit && (
            <DeleteButton
              label="Delete"
              onConfirm={() => {
                onDeleted(habit.id);
                onClose();
              }}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <GlassButton onClick={onClose}>Cancel</GlassButton>
            <PrimaryButton onClick={save}>{isNew ? "Create habit" : "Save changes"}</PrimaryButton>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>Habit</Label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read 20 pages"
            className="field"
          />
        </div>

        <div>
          <Label>Description (optional)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Why does this matter?"
            className="field resize-none"
          />
        </div>

        <div>
          <Label>Frequency</Label>
          <div className="mb-3 flex gap-1.5">
            {(["daily", "weekly", "custom"] as FrequencyType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-xs font-medium capitalize transition",
                  freq.type === t
                    ? "bg-white/15 text-white ring-1 ring-white/25"
                    : "bg-white/[0.03] text-white/50 ring-1 ring-white/5 hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {freq.type === "weekly" && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
              <Target className="h-4 w-4 text-white/50" />
              <span className="text-sm text-white/70">Aim for</span>
              <input
                type="number"
                min={1}
                max={7}
                value={freq.target}
                onChange={(e) =>
                  setFreq({ ...freq, target: Math.min(7, Math.max(1, Number(e.target.value) || 1)) })
                }
                className="w-14 rounded-lg bg-white/5 px-2 py-1 text-center text-sm text-white outline-none ring-1 ring-white/10"
              />
              <span className="text-sm text-white/70">times per week</span>
            </div>
          )}

          {freq.type === "custom" && (
            <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
              <p className="mb-2 text-xs text-white/50">On these days</p>
              <div className="flex justify-between gap-1.5">
                {DAY_LABELS.map((d, idx) => {
                  const on = freq.days.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={cn(
                        "grid h-9 flex-1 place-items-center rounded-full text-xs font-medium transition",
                        on ? "bg-white text-black" : "bg-white/5 text-white/50 ring-1 ring-white/10"
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <LinkEditor selfType="habit" value={links} onToggle={toggleLink} />
        </div>
      </div>
    </Modal>
  );
}
