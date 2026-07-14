import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarClock,
  Link2,
  ListChecks,
  Inbox,
  ChevronDown,
  X,
  ListTodo,
  AlignLeft,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { todayKey, formatDueDate, isOverdue } from "../lib/date";
import type { Task, Priority, Subtask } from "../lib/types";
import { uid } from "../lib/utils";
import { cn } from "../lib/utils";
import {
  FadeIn,
  PrimaryButton,
  GlassButton,
  IconButton,
  TogglePill,
  Tag,
  PriorityBars,
  CircleCheck,
  Label,
  EmptyState,
  DeleteButton,
} from "../components/primitives";
import { Modal } from "../components/Modal";
import {
  LinkEditor,
  linkSelFromTask,
  reconcileLinks,
  type LinkSel,
  type LinkKey,
} from "../components/LinkEditor";

const PRIO_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function dueCmp(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

type StatusF = "all" | "active" | "completed";
type DueF = "all" | "today" | "overdue" | "upcoming" | "unscheduled";
type SortF = "smart" | "due" | "priority" | "created";

export function TasksView() {
  const { data, toggleTask, deleteTask } = useData();
  const [status, setStatus] = useState<StatusF>("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [due, setDue] = useState<DueF>("all");
  const [tag, setTag] = useState<string>("all");
  const [sort, setSort] = useState<SortF>("smart");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const today = todayKey();
  const allTags = useMemo(
    () => Array.from(new Set(data.tasks.flatMap((t) => t.tags))).sort(),
    [data.tasks]
  );

  const list = useMemo(() => {
    let l = data.tasks.slice();
    if (status === "active") l = l.filter((t) => !t.completed);
    else if (status === "completed") l = l.filter((t) => t.completed);
    if (priority !== "all") l = l.filter((t) => t.priority === priority);
    if (due === "today") l = l.filter((t) => t.dueDate === today);
    else if (due === "overdue") l = l.filter((t) => t.dueDate && t.dueDate < today);
    else if (due === "upcoming") l = l.filter((t) => t.dueDate && t.dueDate > today);
    else if (due === "unscheduled") l = l.filter((t) => !t.dueDate);
    if (tag !== "all") l = l.filter((t) => t.tags.includes(tag));
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((x) => x.toLowerCase().includes(q))
      );
    }
    if (sort === "due") l.sort((a, b) => dueCmp(a.dueDate, b.dueDate));
    else if (sort === "priority") l.sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
    else if (sort === "created") l.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    else
      l.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const p = PRIO_RANK[a.priority] - PRIO_RANK[b.priority];
        if (p) return p;
        return dueCmp(a.dueDate, b.dueDate);
      });
    return l;
  }, [data.tasks, status, priority, due, tag, query, sort, today]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <FadeIn className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal tracking-[-0.03em] text-white sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-xs text-white/40">
            {data.tasks.filter((t) => !t.completed).length} open ·{" "}
            {data.tasks.filter((t) => t.completed).length} done
          </p>
        </div>
        <PrimaryButton onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New task
        </PrimaryButton>
      </FadeIn>

      {/* Filters */}
      <FadeIn
        delay={80}
        className="mb-4 flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/40 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="liquid-glass flex items-center gap-1 rounded-full px-1 py-1">
            <AlignLeft className="ml-2 h-3.5 w-3.5 text-white/40" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortF)}
              className="cursor-pointer appearance-none bg-transparent pr-3 text-xs text-white outline-none"
            >
              <option value="smart">Smart</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="created">Newest</option>
            </select>
            <ChevronDown className="-ml-4 h-3.5 w-3.5 text-white/40" />
          </div>
        </div>

        <div className="no-scrollbar -mx-1 flex items-center gap-3 overflow-x-auto px-1 pb-0.5">
          <FilterGroup label="Status">
            {(["all", "active", "completed"] as StatusF[]).map((o) => (
              <TogglePill key={o} active={status === o} onClick={() => setStatus(o)}>
                {o === "all" ? "All" : o[0].toUpperCase() + o.slice(1)}
              </TogglePill>
            ))}
          </FilterGroup>
          <FilterGroup label="Priority">
            <TogglePill active={priority === "all"} onClick={() => setPriority("all")}>
              Any
            </TogglePill>
            {(["high", "medium", "low"] as Priority[]).map((o) => (
              <TogglePill key={o} active={priority === o} onClick={() => setPriority(o)}>
                <span className="inline-flex items-center gap-1.5">
                  <PriorityBars priority={o} />
                  {o[0].toUpperCase() + o.slice(1)}
                </span>
              </TogglePill>
            ))}
          </FilterGroup>
          <FilterGroup label="Due">
            {(["all", "today", "overdue", "upcoming", "unscheduled"] as DueF[]).map((o) => (
              <TogglePill key={o} active={due === o} onClick={() => setDue(o)}>
                {o === "all" ? "Any" : o[0].toUpperCase() + o.slice(1)}
              </TogglePill>
            ))}
          </FilterGroup>
          {allTags.length > 0 && (
            <FilterGroup label="Tag">
              <TogglePill active={tag === "all"} onClick={() => setTag("all")}>
                Any
              </TogglePill>
              {allTags.map((t) => (
                <TogglePill key={t} active={tag === t} onClick={() => setTag(t)}>
                  #{t}
                </TogglePill>
              ))}
            </FilterGroup>
          )}
        </div>
      </FadeIn>

      {/* List */}
      <div className="scroll-thin -mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {list.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title={data.tasks.length === 0 ? "No tasks yet" : "No tasks match"}
            hint={
              data.tasks.length === 0
                ? "Create your first task to get started."
                : "Try adjusting your filters."
            }
            action={
              <PrimaryButton onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                New task
              </PrimaryButton>
            }
          />
        ) : (
          <div className="flex flex-col gap-2 pb-2">
            {list.map((t, i) => (
              <FadeIn key={t.id} delay={Math.min(i * 40, 400)}>
                <TaskRow
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onOpen={() => setEditing(t)}
                />
              </FadeIn>
            ))}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <TaskEditor
          key={editing ? editing.id : "new"}
          task={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onDeleted={(id) => deleteTask(id)}
        />
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </span>
      {children}
      <span className="ml-1 h-4 w-px bg-white/10" />
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const links = task.linkedNoteIds.length + task.linkedHabitIds.length;
  const doneSubs = task.subtasks.filter((s) => s.completed).length;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group block w-full cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <CircleCheck checked={task.completed} onClick={onToggle} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PriorityBars priority={task.priority} />
            <p
              className={cn(
                "truncate text-sm text-white/90",
                task.completed && "text-white/35 line-through"
              )}
            >
              {task.title}
            </p>
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-1 text-xs text-white/40">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-white/45">
            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  isOverdue(task.dueDate) && !task.completed && "text-white/80"
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {doneSubs}/{task.subtasks.length}
              </span>
            )}
            {links > 0 && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {links}
              </span>
            )}
            {task.tags.slice(0, 3).map((tg) => (
              <Tag key={tg}>#{tg}</Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskEditor({
  task,
  onClose,
  onDeleted,
}: {
  task: Task | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const api = useData();
  const isNew = !task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [subInput, setSubInput] = useState("");
  const initialLinks = useMemo<LinkSel>(
    () => (task ? linkSelFromTask(task) : { tasks: [], habits: [], notes: [] }),
    [task]
  );
  const [links, setLinks] = useState<LinkSel>(initialLinks);

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, "");
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };
  const addSub = () => {
    const v = subInput.trim();
    if (v) setSubtasks([...subtasks, { id: uid(), title: v, completed: false }]);
    setSubInput("");
  };
  const toggleLink = (key: LinkKey, id: string) =>
    setLinks((prev) => {
      const has = prev[key].includes(id);
      return { ...prev, [key]: has ? prev[key].filter((x) => x !== id) : [...prev[key], id] };
    });

  const save = () => {
    const payload = {
      title: title.trim() || "Untitled task",
      description,
      dueDate: dueDate || null,
      priority,
      tags,
      subtasks,
    };
    if (isNew) {
      const created = api.addTask(payload);
      reconcileLinks(api, { type: "task", id: created.id }, { tasks: [], habits: [], notes: [] }, links);
    } else if (task) {
      api.updateTask(task.id, payload);
      reconcileLinks(api, { type: "task", id: task.id }, initialLinks, links);
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? "New task" : "Edit task"}
      subtitle={isNew ? "Capture what needs doing" : "Update the details"}
      icon={<ListTodo className="h-4 w-4" />}
      footer={
        <>
          {!isNew && task && (
            <DeleteButton
              label="Delete"
              onConfirm={() => {
                onDeleted(task.id);
                onClose();
              }}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <GlassButton onClick={onClose}>Cancel</GlassButton>
            <PrimaryButton onClick={save}>{isNew ? "Create task" : "Save changes"}</PrimaryButton>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>Title</Label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish the quarterly report"
            className="field"
          />
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add context, links, or steps…"
            className="field resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Due date</Label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field flex-1"
              />
              {dueDate && (
                <IconButton title="Clear date" onClick={() => setDueDate("")}>
                  <X className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          </div>
          <div>
            <Label>Priority</Label>
            <div className="flex gap-1.5">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium capitalize transition",
                    priority === p
                      ? "bg-white/15 text-white ring-1 ring-white/25"
                      : "bg-white/[0.03] text-white/50 ring-1 ring-white/5 hover:text-white"
                  )}
                >
                  <PriorityBars priority={p} />
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white"
              >
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={tags.length ? "Add tag" : "Type a tag and press enter"}
              className="min-w-[140px] flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div>
          <Label>Subtasks</Label>
          <div className="space-y-1.5">
            {subtasks.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-2 py-1.5"
              >
                <CircleCheck
                  size="sm"
                  checked={s.completed}
                  onClick={() =>
                    setSubtasks(
                      subtasks.map((x) => (x.id === s.id ? { ...x, completed: !x.completed } : x))
                    )
                  }
                />
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    s.completed ? "text-white/35 line-through" : "text-white/85"
                  )}
                >
                  {s.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}
                  className="text-white/35 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSub();
                  }
                }}
                placeholder="Add a subtask…"
                className="field"
              />
              <IconButton title="Add subtask" onClick={addSub}>
                <Plus className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <LinkEditor selfType="task" value={links} onToggle={toggleLink} />
        </div>
      </div>
    </Modal>
  );
}
