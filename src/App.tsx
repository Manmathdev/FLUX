import { useEffect, useState } from "react";
import { DataProvider, useData } from "./context/DataContext";
import { initNative, registerBackHandler } from "./lib/native";
import { Background } from "./components/Background";
import { Navbar } from "./components/Navbar";
import { ConfirmDialog } from "./components/Modal";
import { Dashboard } from "./views/Dashboard";
import { TasksView } from "./views/TasksView";
import { HabitsView } from "./views/HabitsView";
import { NotesView } from "./views/NotesView";
import type { ViewKey } from "./lib/types";

/**
 * ============================================================================
 *  FLUX — All-in-One Productivity System
 *  Single-page app: Tasks + Habits + Notes over one shared data layer.
 * ----------------------------------------------------------------------------
 *  DATA SCHEMA (full definitions in src/lib/types.ts · persisted to
 *  localStorage under "flux.data.v1" via src/lib/storage.ts)
 *
 *    Task    { id, title, description, dueDate, priority, tags, subtasks[],
 *               completed, completedAt, linkedNoteIds[], linkedHabitIds[],
 *               createdAt, updatedAt }
 *    Habit   { id, title, description, frequency{type,target,days},
 *               checkIns["YYYY-MM-DD"], linkedNoteIds[], linkedTaskIds[],
 *               createdAt, updatedAt }
 *    Note    { id, title, body(markdown), tags[], linkedTaskIds[],
 *               linkedHabitIds[], createdAt, updatedAt }
 *
 *  Cross-links (task <-> note, task <-> habit, habit <-> note) are stored
 *  bidirectionally and surfaced on both sides. All three modules read/write
 *  the same DataContext, hydrate from localStorage on load, and persist on
 *  every mutation.
 * ============================================================================
 */

function Shell() {
  const { resetAll } = useData();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [confirm, setConfirm] = useState(false);

  // Initialise native (Android) integrations once. No-op in the browser.
  useEffect(() => {
    void initNative();
  }, []);

  // Native Back button: dismiss the confirm dialog first, then return to Home,
  // then exit the app. No-op on web.
  useEffect(() => {
    return registerBackHandler(() => {
      if (confirm) {
        setConfirm(false);
        return true;
      }
      if (view !== "dashboard") {
        setView("dashboard");
        return true;
      }
      return false;
    });
  }, [view, confirm]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      <Background />

      <Navbar view={view} setView={setView} onReset={() => setConfirm(true)} />

      <main className="main-top main-bottom relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-3 sm:px-6">
        {view === "dashboard" && <Dashboard setView={setView} />}
        {view === "tasks" && <TasksView />}
        {view === "habits" && <HabitsView />}
        {view === "notes" && <NotesView />}
      </main>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={resetAll}
        title="Reset all data?"
        message="This permanently deletes every task, habit, note and check-in history stored in this browser. The app will be empty. This cannot be undone."
        confirmLabel="Reset everything"
      />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}
