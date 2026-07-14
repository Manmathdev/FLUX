import { useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Flame,
  StickyNote,
  RotateCcw,
  Menu,
  X,
  Aperture,
} from "lucide-react";
import { cn } from "../lib/utils";
import { IconButton } from "./primitives";
import type { ViewKey } from "../lib/types";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "habits", label: "Habits", icon: Flame },
  { key: "notes", label: "Notes", icon: StickyNote },
];

export function Navbar({
  view,
  setView,
  onReset,
}: {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-top fixed inset-x-0 top-0 z-50 px-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => setView("dashboard")}
          className="blur-fade-up flex items-center gap-2.5"
          style={{ animationDelay: "0ms" }}
        >
          <span className="liquid-glass grid h-9 w-9 place-items-center rounded-full">
            <Aperture className="h-4 w-4 text-white" />
          </span>
          <span className="text-left leading-none">
            <span className="block text-sm font-medium tracking-[0.22em] text-white">
              FLUX
            </span>
            <span className="mt-0.5 hidden text-[9px] tracking-[0.25em] text-white/35 sm:block">
              PRODUCTIVITY
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav
          className="hidden md:block blur-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="liquid-glass flex items-center gap-1 rounded-full p-1">
            {NAV.map((n) => {
              const active = view === n.key;
              const Icon = n.icon;
              return (
                <button
                  key={n.key}
                  onClick={() => setView(n.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition",
                    active
                      ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                      : "text-white/55 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Actions */}
        <div
          className="flex items-center gap-2 blur-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <IconButton title="Reset all data" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="liquid-glass gh grid h-10 w-10 place-items-center rounded-full text-white md:hidden"
          >
            <span className="relative grid h-4 w-4 place-items-center">
              <Menu
                className={cn(
                  "absolute h-4 w-4 transition-all duration-500",
                  open
                    ? "rotate-90 opacity-0 scale-50"
                    : "rotate-0 opacity-100 scale-100"
                )}
              />
              <X
                className={cn(
                  "absolute h-4 w-4 transition-all duration-500",
                  open
                    ? "rotate-0 opacity-100 scale-100"
                    : "-rotate-90 opacity-0 scale-50"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mx-auto mt-2 max-w-6xl md:hidden">
          <div className="liquid-panel drop-in rounded-2xl p-2">
            {NAV.map((n, i) => {
              const active = view === n.key;
              const Icon = n.icon;
              return (
                <button
                  key={n.key}
                  style={{ animationDelay: `${i * 50 + 40}ms` }}
                  onClick={() => {
                    setView(n.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "slide-in-x flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </button>
              );
            })}
            <div className="my-1 h-px bg-white/10" />
            <button
              style={{ animationDelay: "260ms" }}
              onClick={() => {
                setOpen(false);
                onReset();
              }}
              className="slide-in-x flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              Reset all data
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
