import type { AppData, Task, Habit, Note } from "./types";
import { uid } from "./utils";
import { dateKey, addDays } from "./date";

const KEY = "flux.data.v1";
const VERSION = 1;

export function createEmptyData(): AppData {
  return {
    tasks: [],
    habits: [],
    notes: [],
    meta: { version: VERSION, seeded: false },
  };
}

/** Defensive normalization so older/partial localStorage never crashes the app. */
export function normalize(input: unknown): AppData {
  const d = (input ?? {}) as Partial<AppData>;
  const tasks = Array.isArray(d.tasks) ? (d.tasks as Task[]) : [];
  const habits = Array.isArray(d.habits) ? (d.habits as Habit[]) : [];
  const notes = Array.isArray(d.notes) ? (d.notes as Note[]) : [];
  return {
    tasks: tasks.map(normalizeTask),
    habits: habits.map(normalizeHabit),
    notes: notes.map(normalizeNote),
    meta: { version: VERSION, seeded: !!(d.meta && d.meta.seeded) },
  };
}

function normalizeTask(t: Partial<Task>): Task {
  return {
    id: t.id || uid(),
    title: t.title || "Untitled",
    description: t.description || "",
    dueDate: t.dueDate ?? null,
    priority: t.priority === "low" || t.priority === "high" ? t.priority : "medium",
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((s) => ({
          id: s.id || uid(),
          title: s.title || "",
          completed: !!s.completed,
        }))
      : [],
    completed: !!t.completed,
    completedAt: t.completedAt ?? null,
    linkedNoteIds: Array.isArray(t.linkedNoteIds) ? t.linkedNoteIds : [],
    linkedHabitIds: Array.isArray(t.linkedHabitIds) ? t.linkedHabitIds : [],
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
  };
}

function normalizeHabit(h: Partial<Habit>): Habit {
  return {
    id: h.id || uid(),
    title: h.title || "Untitled",
    description: h.description || "",
    frequency: {
      type: h.frequency?.type === "daily" || h.frequency?.type === "custom" ? h.frequency.type : "daily",
      target: typeof h.frequency?.target === "number" ? h.frequency.target : 1,
      days: Array.isArray(h.frequency?.days) ? (h.frequency!.days as number[]) : [],
    },
    checkIns: Array.isArray(h.checkIns) ? Array.from(new Set(h.checkIns)) : [],
    linkedNoteIds: Array.isArray(h.linkedNoteIds) ? h.linkedNoteIds : [],
    linkedTaskIds: Array.isArray(h.linkedTaskIds) ? h.linkedTaskIds : [],
    createdAt: h.createdAt || new Date().toISOString(),
    updatedAt: h.updatedAt || new Date().toISOString(),
  };
}

function normalizeNote(n: Partial<Note>): Note {
  return {
    id: n.id || uid(),
    title: n.title || "Untitled",
    body: n.body || "",
    tags: Array.isArray(n.tags) ? n.tags : [],
    linkedTaskIds: Array.isArray(n.linkedTaskIds) ? n.linkedTaskIds : [],
    linkedHabitIds: Array.isArray(n.linkedHabitIds) ? n.linkedHabitIds : [],
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || new Date().toISOString(),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createEmptyData();
    return normalize(JSON.parse(raw));
  } catch {
    return createEmptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — fail silently */
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  First-run seed data (relative to "today" so the dashboard feels alive)    */
/* -------------------------------------------------------------------------- */

function iso(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function lastNDays(n: number, skip: number[] = []): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (skip.includes(i % 7)) continue;
    out.push(dateKey(addDays(new Date(), -i)));
  }
  return out;
}

export function buildSeed(): AppData {
  const today = dateKey(new Date());
  const tomorrow = dateKey(addDays(new Date(), 1));
  const inThree = dateKey(addDays(new Date(), 3));

  const noteReadId = uid();
  const noteDeepId = uid();
  const habitReadId = uid();
  const habitRunId = uid();
  const habitWaterId = uid();

  const taskShip: Task = {
    id: uid(),
    title: "Ship the FLUX dashboard v1",
    description:
      "Wire up today's tasks, habit check-offs and recent notes into one cohesive home view.",
    dueDate: today,
    priority: "high",
    tags: ["work", "launch"],
    subtasks: [
      { id: uid(), title: "Layout the stat row", completed: true },
      { id: uid(), title: "Connect habit check-offs", completed: true },
      { id: uid(), title: "Add empty states", completed: false },
    ],
    completed: false,
    completedAt: null,
    linkedNoteIds: [noteReadId],
    linkedHabitIds: [],
    createdAt: iso(2),
    updatedAt: iso(0, 11),
  };

  const taskGroceries: Task = {
    id: uid(),
    title: "Weekly groceries",
    description: "",
    dueDate: today,
    priority: "low",
    tags: ["personal"],
    subtasks: [],
    completed: false,
    completedAt: null,
    linkedNoteIds: [],
    linkedHabitIds: [habitWaterId],
    createdAt: iso(1),
    updatedAt: iso(0, 8),
  };

  const taskReview: Task = {
    id: uid(),
    title: "Review quarterly metrics deck",
    description: "Focus on retention and activation slides.",
    dueDate: tomorrow,
    priority: "medium",
    tags: ["work"],
    subtasks: [],
    completed: false,
    completedAt: null,
    linkedNoteIds: [noteDeepId],
    linkedHabitIds: [],
    createdAt: iso(3),
    updatedAt: iso(0, 7),
  };

  const taskDesign: Task = {
    id: uid(),
    title: "Design system audit",
    description: "",
    dueDate: inThree,
    priority: "medium",
    tags: ["work", "design"],
    subtasks: [],
    completed: false,
    completedAt: null,
    linkedNoteIds: [],
    linkedHabitIds: [],
    createdAt: iso(4),
    updatedAt: iso(1),
  };

  // a couple of already-completed tasks this week (for stats)
  const done1: Task = {
    id: uid(),
    title: "Reply to design feedback",
    description: "",
    dueDate: dateKey(addDays(new Date(), -1)),
    priority: "low",
    tags: ["work"],
    subtasks: [],
    completed: true,
    completedAt: iso(1, 15),
    linkedNoteIds: [],
    linkedHabitIds: [],
    createdAt: iso(2),
    updatedAt: iso(1, 15),
  };
  const done2: Task = {
    id: uid(),
    title: "Morning run",
    description: "",
    dueDate: dateKey(addDays(new Date(), -2)),
    priority: "low",
    tags: ["health"],
    subtasks: [],
    completed: true,
    completedAt: iso(2, 7),
    linkedNoteIds: [],
    linkedHabitIds: [habitRunId],
    createdAt: iso(3),
    updatedAt: iso(2, 7),
  };

  const habits: Habit[] = [
    {
      id: habitReadId,
      title: "Read 20 pages",
      description: "Fiction or non-fiction, no scrolling allowed.",
      frequency: { type: "daily", target: 1, days: [] },
      checkIns: lastNDays(12, [5, 6]), // weekdays
      linkedNoteIds: [noteReadId],
      linkedTaskIds: [],
      createdAt: iso(20),
      updatedAt: iso(0, 6),
    },
    {
      id: habitRunId,
      title: "Move for 30 minutes",
      description: "Run, cycle, or a long walk.",
      frequency: { type: "weekly", target: 4, days: [] },
      checkIns: lastNDays(10, [1, 4]),
      linkedNoteIds: [],
      linkedTaskIds: [done2.id],
      createdAt: iso(30),
      updatedAt: iso(0, 7),
    },
    {
      id: habitWaterId,
      title: "Drink 2L of water",
      description: "",
      frequency: { type: "custom", target: 0, days: [1, 2, 3, 4, 5] },
      checkIns: lastNDays(8, [0, 6]),
      linkedNoteIds: [],
      linkedTaskIds: [taskGroceries.id],
      createdAt: iso(15),
      updatedAt: iso(0, 9),
    },
  ];

  const notes: Note[] = [
    {
      id: noteReadId,
      title: "Reading list — 2026",
      body:
        "## Currently reading\n- *The Creative Act* — Rick Rubin\n- **Atomic Habits** — James Clear\n\n> Consistency compounds.\n\nNotes to revisit weekly.",
      tags: ["reading", "personal"],
      linkedTaskIds: [],
      linkedHabitIds: [habitReadId],
      createdAt: iso(6),
      updatedAt: iso(0, 10),
    },
    {
      id: noteDeepId,
      title: "Q-retention brainstorm",
      body:
        "Retention ideas for next quarter:\n\n- Weekly recap email\n- Streak rewards\n- Onboarding checklist\n\nFocus on the **first 7 days**.",
      tags: ["work", "ideas"],
      linkedTaskIds: [taskReview.id],
      linkedHabitIds: [],
      createdAt: iso(4),
      updatedAt: iso(1, 14),
    },
    {
      id: uid(),
      title: "Sprint retro notes",
      body: "What went well, what to improve, action items for next sprint.",
      tags: ["work"],
      linkedTaskIds: [],
      linkedHabitIds: [],
      createdAt: iso(9),
      updatedAt: iso(3),
    },
  ];

  return {
    tasks: [taskShip, taskGroceries, taskReview, taskDesign, done1, done2],
    habits,
    notes,
    meta: { version: VERSION, seeded: true },
  };
}
