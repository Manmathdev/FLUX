import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Task, Habit, Note, Priority, EntityRef, Frequency } from "../lib/types";
import { uid } from "../lib/utils";
import { loadData, saveData, clearData, buildSeed } from "../lib/storage";
import { todayKey } from "../lib/date";

interface DataApi {
  data: AppData;
  /* tasks */
  addTask: (input: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  /* habits */
  addHabit: (input: Partial<Habit>) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleCheckIn: (habitId: string, key?: string) => void;
  /* notes */
  addNote: (input: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  /* linking (bidirectional) + reset */
  link: (from: EntityRef, to: EntityRef) => void;
  unlink: (from: EntityRef, to: EntityRef) => void;
  resetAll: () => void;
}

const DataContext = createContext<DataApi | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData();
    // `meta.seeded` distinguishes "first ever run" (seed samples) from an
    // intentionally empty store (e.g. right after a reset).
    if (loaded.meta.seeded) return loaded;
    if (loaded.tasks.length || loaded.habits.length || loaded.notes.length) return loaded;
    return buildSeed();
  });

  // Persist on every mutation, hydrate from storage on mount (already done above).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      saveData(data); // make sure seeded data is persisted too
      return;
    }
    saveData(data);
  }, [data]);

  const now = () => new Date().toISOString();

  /* ----------------------------- tasks ----------------------------- */
  const addTask = useCallback((input: Partial<Task>) => {
    const task: Task = {
      id: uid(),
      title: input.title?.trim() || "Untitled task",
      description: input.description || "",
      dueDate: input.dueDate ?? null,
      priority: (input.priority as Priority) || "medium",
      tags: input.tags || [],
      subtasks: input.subtasks || [],
      completed: false,
      completedAt: null,
      linkedNoteIds: input.linkedNoteIds || [],
      linkedHabitIds: input.linkedHabitIds || [],
      createdAt: now(),
      updatedAt: now(),
    };
    setData((d) => ({ ...d, tasks: [task, ...d.tasks] }));
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => {
      const tasks = d.tasks.filter((t) => t.id !== id);
      const notes = d.notes.map((n) => ({ ...n, linkedTaskIds: n.linkedTaskIds.filter((x) => x !== id) }));
      const habits = d.habits.map((h) => ({ ...h, linkedTaskIds: h.linkedTaskIds.filter((x) => x !== id) }));
      return { ...d, tasks, notes, habits };
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? now() : null, updatedAt: now() }
          : t
      ),
    }));
  }, []);

  /* ----------------------------- habits ---------------------------- */
  const addHabit = useCallback((input: Partial<Habit>) => {
    const habit: Habit = {
      id: uid(),
      title: input.title?.trim() || "Untitled habit",
      description: input.description || "",
      frequency: (input.frequency as Frequency) || { type: "daily", target: 1, days: [] },
      checkIns: input.checkIns || [],
      linkedNoteIds: input.linkedNoteIds || [],
      linkedTaskIds: input.linkedTaskIds || [],
      createdAt: now(),
      updatedAt: now(),
    };
    setData((d) => ({ ...d, habits: [habit, ...d.habits] }));
    return habit;
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch, updatedAt: now() } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setData((d) => {
      const habits = d.habits.filter((h) => h.id !== id);
      const notes = d.notes.map((n) => ({ ...n, linkedHabitIds: n.linkedHabitIds.filter((x) => x !== id) }));
      const tasks = d.tasks.map((t) => ({ ...t, linkedHabitIds: t.linkedHabitIds.filter((x) => x !== id) }));
      return { ...d, habits, notes, tasks };
    });
  }, []);

  const toggleCheckIn = useCallback((habitId: string, key?: string) => {
    const k = key || todayKey();
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.checkIns.includes(k);
        return {
          ...h,
          checkIns: has ? h.checkIns.filter((x) => x !== k) : [...h.checkIns, k].sort(),
          updatedAt: now(),
        };
      }),
    }));
  }, []);

  /* ----------------------------- notes ----------------------------- */
  const addNote = useCallback((input: Partial<Note>) => {
    const note: Note = {
      id: uid(),
      title: input.title?.trim() || "Untitled note",
      body: input.body || "",
      tags: input.tags || [],
      linkedTaskIds: input.linkedTaskIds || [],
      linkedHabitIds: input.linkedHabitIds || [],
      createdAt: now(),
      updatedAt: now(),
    };
    setData((d) => ({ ...d, notes: [note, ...d.notes] }));
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((d) => {
      const notes = d.notes.filter((n) => n.id !== id);
      const tasks = d.tasks.map((t) => ({ ...t, linkedNoteIds: t.linkedNoteIds.filter((x) => x !== id) }));
      const habits = d.habits.map((h) => ({ ...h, linkedNoteIds: h.linkedNoteIds.filter((x) => x !== id) }));
      return { ...d, notes, tasks, habits };
    });
  }, []);

  /* ----------------------- bidirectional linking ------------------- */
  const link = useCallback((from: EntityRef, to: EntityRef) => {
    if (from.type === to.type) return;
    setData((d) => {
      const add = (arr: string[], id: string) => (arr.includes(id) ? arr : [...arr, id]);
      const tasks = d.tasks.slice();
      const habits = d.habits.slice();
      const notes = d.notes.slice();
      const apply = (a: EntityRef, b: EntityRef) => {
        // a links to b (store b's id on a's appropriate field)
        if (a.type === "task") {
          const t = tasks.find((x) => x.id === a.id);
          if (t) {
            if (b.type === "note") t.linkedNoteIds = add(t.linkedNoteIds, b.id);
            if (b.type === "habit") t.linkedHabitIds = add(t.linkedHabitIds, b.id);
          }
        } else if (a.type === "habit") {
          const h = habits.find((x) => x.id === a.id);
          if (h) {
            if (b.type === "note") h.linkedNoteIds = add(h.linkedNoteIds, b.id);
            if (b.type === "task") h.linkedTaskIds = add(h.linkedTaskIds, b.id);
          }
        } else {
          const n = notes.find((x) => x.id === a.id);
          if (n) {
            if (b.type === "task") n.linkedTaskIds = add(n.linkedTaskIds, b.id);
            if (b.type === "habit") n.linkedHabitIds = add(n.linkedHabitIds, b.id);
          }
        }
      };
      apply(from, to);
      apply(to, from);
      return { ...d, tasks, habits, notes };
    });
  }, []);

  const unlink = useCallback((from: EntityRef, to: EntityRef) => {
    if (from.type === to.type) return;
    setData((d) => {
      const remove = (arr: string[], id: string) => arr.filter((x) => x !== id);
      const tasks = d.tasks.slice();
      const habits = d.habits.slice();
      const notes = d.notes.slice();
      const apply = (a: EntityRef, b: EntityRef) => {
        if (a.type === "task") {
          const t = tasks.find((x) => x.id === a.id);
          if (t) {
            if (b.type === "note") t.linkedNoteIds = remove(t.linkedNoteIds, b.id);
            if (b.type === "habit") t.linkedHabitIds = remove(t.linkedHabitIds, b.id);
          }
        } else if (a.type === "habit") {
          const h = habits.find((x) => x.id === a.id);
          if (h) {
            if (b.type === "note") h.linkedNoteIds = remove(h.linkedNoteIds, b.id);
            if (b.type === "task") h.linkedTaskIds = remove(h.linkedTaskIds, b.id);
          }
        } else {
          const n = notes.find((x) => x.id === a.id);
          if (n) {
            if (b.type === "task") n.linkedTaskIds = remove(n.linkedTaskIds, b.id);
            if (b.type === "habit") n.linkedHabitIds = remove(n.linkedHabitIds, b.id);
          }
        }
      };
      apply(from, to);
      apply(to, from);
      return { ...d, tasks, habits, notes };
    });
  }, []);

  const resetAll = useCallback(() => {
    clearData();
    // Mark as seeded=true so a reload does NOT re-seed sample data.
    setData({ tasks: [], habits: [], notes: [], meta: { version: 1, seeded: true } });
  }, []);

  const api = useMemo<DataApi>(
    () => ({
      data,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCheckIn,
      addNote,
      updateNote,
      deleteNote,
      link,
      unlink,
      resetAll,
    }),
    [
      data,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCheckIn,
      addNote,
      updateNote,
      deleteNote,
      link,
      unlink,
      resetAll,
    ]
  );

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData(): DataApi {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}
