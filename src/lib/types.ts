/**
 * ============================================================================
 *  FLUX — All-in-One Productivity System
 *  SHARED DATA SCHEMA (single source of truth, persisted to localStorage)
 * ============================================================================
 *
 *  localStorage key ........ "flux.data.v1"  (see src/lib/storage.ts)
 *
 *  AppData {
 *    tasks:  Task[]
 *    habits: Habit[]
 *    notes:  Note[]
 *    meta:   { version: number; seeded: boolean }
 *  }
 *
 *  Task {
 *    id: string
 *    title: string
 *    description: string
 *    dueDate: string | null          // "YYYY-MM-DD" (local) or null
 *    priority: "low" | "medium" | "high"
 *    tags: string[]
 *    subtasks: Subtask[]
 *    completed: boolean
 *    completedAt: string | null      // ISO datetime
 *    linkedNoteIds: string[]         // task <-> note (bidirectional)
 *    linkedHabitIds: string[]        // task <-> habit (bidirectional)
 *    createdAt: string               // ISO datetime
 *    updatedAt: string               // ISO datetime
 *  }
 *
 *  Subtask { id: string; title: string; completed: boolean }
 *
 *  Habit {
 *    id: string
 *    title: string
 *    description: string
 *    frequency: {
 *      type: "daily" | "weekly" | "custom"
 *      target: number                // weekly -> times/week ; daily -> 1
 *      days: number[]                // custom -> weekdays 0(Sun)..6(Sat)
 *    }
 *    checkIns: string[]              // ["YYYY-MM-DD", ...] (deduped)
 *    linkedNoteIds: string[]         // habit <-> note (bidirectional)
 *    linkedTaskIds: string[]         // habit <-> task (bidirectional)
 *    createdAt: string
 *    updatedAt: string
 *  }
 *
 *  Note {
 *    id: string
 *    title: string
 *    body: string                    // markdown source
 *    tags: string[]
 *    linkedTaskIds: string[]         // note <-> task (bidirectional)
 *    linkedHabitIds: string[]        // note <-> habit (bidirectional)
 *    createdAt: string
 *    updatedAt: string
 *  }
 * ============================================================================
 */

export type Priority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  tags: string[];
  subtasks: Subtask[];
  completed: boolean;
  completedAt: string | null;
  linkedNoteIds: string[];
  linkedHabitIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type FrequencyType = "daily" | "weekly" | "custom";

export interface Frequency {
  type: FrequencyType;
  target: number;
  days: number[];
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: Frequency;
  checkIns: string[];
  linkedNoteIds: string[];
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  linkedTaskIds: string[];
  linkedHabitIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  meta: { version: number; seeded: boolean };
}

export type ViewKey = "dashboard" | "tasks" | "habits" | "notes";

/** Generic entity handle used by the bidirectional linking logic. */
export interface EntityRef {
  type: "task" | "habit" | "note";
  id: string;
}
