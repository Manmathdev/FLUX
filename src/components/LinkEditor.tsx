import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useData } from "../context/DataContext";
import { Label } from "./primitives";
import type { EntityRef } from "../lib/types";

export interface LinkSel {
  tasks: string[];
  habits: string[];
  notes: string[];
}

export type LinkKey = keyof LinkSel;

export function linkSelFromTask(t: { linkedHabitIds: string[]; linkedNoteIds: string[] }): LinkSel {
  return { tasks: [], habits: [...t.linkedHabitIds], notes: [...t.linkedNoteIds] };
}
export function linkSelFromHabit(h: { linkedTaskIds: string[]; linkedNoteIds: string[] }): LinkSel {
  return { tasks: [...h.linkedTaskIds], habits: [], notes: [...h.linkedNoteIds] };
}
export function linkSelFromNote(n: { linkedTaskIds: string[]; linkedHabitIds: string[] }): LinkSel {
  return { tasks: [...n.linkedTaskIds], habits: [...n.linkedHabitIds], notes: [] };
}

/** Reconcile a final selection against the initial snapshot via the data API. */
export function reconcileLinks(
  api: { link: (a: EntityRef, b: EntityRef) => void; unlink: (a: EntityRef, b: EntityRef) => void },
  self: EntityRef,
  initial: LinkSel,
  next: LinkSel
) {
  const typeOf = (k: LinkKey): EntityRef["type"] =>
    k === "tasks" ? "task" : k === "habits" ? "habit" : "note";
  (Object.keys(next) as LinkKey[]).forEach((k) => {
    const type = typeOf(k);
    const init = new Set(initial[k]);
    const nxt = new Set(next[k]);
    nxt.forEach((id) => {
      if (!init.has(id)) api.link(self, { type, id });
    });
    init.forEach((id) => {
      if (!nxt.has(id)) api.unlink(self, { type, id });
    });
  });
}

/**
 * Controlled link picker. Lists the two other entity types as toggle chips.
 * Links are surfaced on BOTH sides automatically (bidirectional storage).
 */
export function LinkEditor({
  selfType,
  value,
  onToggle,
}: {
  selfType: EntityRef["type"];
  value: LinkSel;
  onToggle: (key: LinkKey, id: string) => void;
}) {
  const { data } = useData();

  const sections: { key: LinkKey; label: string; items: { id: string; title: string }[] }[] = [];
  if (selfType !== "task")
    sections.push({ key: "tasks", label: "Tasks", items: data.tasks.map((t) => ({ id: t.id, title: t.title })) });
  if (selfType !== "habit")
    sections.push({ key: "habits", label: "Habits", items: data.habits.map((h) => ({ id: h.id, title: h.title })) });
  if (selfType !== "note")
    sections.push({ key: "notes", label: "Notes", items: data.notes.map((n) => ({ id: n.id, title: n.title })) });

  return (
    <div className="space-y-4">
      <div>
        <Label>Linked items</Label>
        <p className="-mt-1 mb-2 text-[11px] text-white/30">
          Links appear on both sides automatically.
        </p>
      </div>
      {sections.map((sec) => (
        <div key={sec.key}>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/35">
            {sec.label}
          </p>
          {sec.items.length === 0 ? (
            <p className="text-xs text-white/30">Nothing to link yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sec.items.map((it) => {
                const sel = value[sec.key].includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onToggle(sec.key, it.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                      sel
                        ? "bg-white/15 text-white ring-1 ring-white/25"
                        : "liquid-glass text-white/50 hover:text-white"
                    )}
                  >
                    {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                    <span className="max-w-[160px] truncate">{it.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
