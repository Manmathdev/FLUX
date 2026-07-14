import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  Eye,
  Pencil,
  Link2,
  StickyNote,
  Inbox,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { relativeTime } from "../lib/date";
import { renderMarkdown, plainText } from "../lib/markdown";
import type { Note } from "../lib/types";
import {
  FadeIn,
  PrimaryButton,
  GlassButton,
  Tag,
  TogglePill,
  Label,
  EmptyState,
  DeleteButton,
} from "../components/primitives";
import { Modal } from "../components/Modal";
import {
  LinkEditor,
  linkSelFromNote,
  reconcileLinks,
  type LinkSel,
  type LinkKey,
} from "../components/LinkEditor";

export function NotesView() {
  const { data, deleteNote } = useData();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(data.notes.flatMap((n) => n.tags))).sort(),
    [data.notes]
  );

  const list = useMemo(() => {
    let l = data.notes.slice();
    if (tag !== "all") l = l.filter((n) => n.tags.includes(tag));
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return l.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [data.notes, query, tag]);

  return (
    <div className="flex h-full flex-col">
      <FadeIn className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal tracking-[-0.03em] text-white sm:text-3xl">Notes</h1>
          <p className="mt-1 text-xs text-white/40">{data.notes.length} note{data.notes.length !== 1 ? "s" : ""}</p>
        </div>
        <PrimaryButton onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New note
        </PrimaryButton>
      </FadeIn>

      {/* Search + tags */}
      <FadeIn
        delay={80}
        className="mb-4 flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3 backdrop-blur-md"
      >
        <div className="liquid-glass flex items-center gap-2 rounded-full px-3.5 py-2">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, content, or tag…"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/40 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
            <TogglePill active={tag === "all"} onClick={() => setTag("all")}>
              All
            </TogglePill>
            {allTags.map((t) => (
              <TogglePill key={t} active={tag === t} onClick={() => setTag(t)}>
                #{t}
              </TogglePill>
            ))}
          </div>
        )}
      </FadeIn>

      {/* Grid */}
      <div className="scroll-thin -mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {list.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title={data.notes.length === 0 ? "No notes yet" : "No notes match"}
            hint={
              data.notes.length === 0
                ? "Jot down an idea, plan, or reference."
                : "Try a different search."
            }
            action={
              <PrimaryButton onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                New note
              </PrimaryButton>
            }
          />
        ) : (
          <div className="grid gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((n, i) => (
              <FadeIn key={n.id} delay={Math.min(i * 40, 400)} className="h-full">
                <NoteCard note={n} onOpen={() => setEditing(n)} />
              </FadeIn>
            ))}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <NoteEditor
          key={editing ? editing.id : "new"}
          note={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onDeleted={(id) => deleteNote(id)}
        />
      )}
    </div>
  );
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const links = note.linkedTaskIds.length + note.linkedHabitIds.length;
  return (
    <button
      onClick={onOpen}
      className="liquid-glass gh flex h-full flex-col gap-2 rounded-3xl p-4 text-left transition hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium text-white">{note.title}</h3>
        <span className="shrink-0 text-[10px] text-white/35">{relativeTime(note.updatedAt)}</span>
      </div>
      <p className="line-clamp-4 flex-1 text-xs leading-relaxed text-white/45">
        {plainText(note.body, 220) || "Empty note"}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {note.tags.slice(0, 3).map((t) => (
          <Tag key={t}>#{t}</Tag>
        ))}
        {links > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-white/35">
            <Link2 className="h-3 w-3" />
            {links}
          </span>
        )}
      </div>
    </button>
  );
}

function NoteEditor({
  note,
  onClose,
  onDeleted,
}: {
  note: Note | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const api = useData();
  const isNew = !note;

  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const initialLinks = useMemo<LinkSel>(
    () => (note ? linkSelFromNote(note) : { tasks: [], habits: [], notes: [] }),
    [note]
  );
  const [links, setLinks] = useState<LinkSel>(initialLinks);

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, "");
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };
  const toggleLink = (key: LinkKey, id: string) =>
    setLinks((prev) => {
      const has = prev[key].includes(id);
      return { ...prev, [key]: has ? prev[key].filter((x) => x !== id) : [...prev[key], id] };
    });

  const save = () => {
    const payload = {
      title: title.trim() || "Untitled note",
      body,
      tags,
    };
    if (isNew) {
      const created = api.addNote(payload);
      reconcileLinks(api, { type: "note", id: created.id }, { tasks: [], habits: [], notes: [] }, links);
    } else if (note) {
      api.updateNote(note.id, payload);
      reconcileLinks(api, { type: "note", id: note.id }, initialLinks, links);
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? "New note" : "Edit note"}
      subtitle={isNew ? "Capture a thought" : "Update your note"}
      icon={<StickyNote className="h-4 w-4" />}
      footer={
        <>
          {!isNew && note && (
            <DeleteButton
              label="Delete"
              onConfirm={() => {
                onDeleted(note.id);
                onClose();
              }}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <GlassButton onClick={onClose}>Cancel</GlassButton>
            <PrimaryButton onClick={save}>{isNew ? "Create note" : "Save changes"}</PrimaryButton>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full bg-transparent text-xl font-medium tracking-tight text-white outline-none placeholder:text-white/30"
        />

        {/* Write / Preview */}
        <div className="flex items-center gap-1.5">
          <TogglePill active={tab === "write"} onClick={() => setTab("write")}>
            <span className="inline-flex items-center gap-1.5">
              <Pencil className="h-3 w-3" /> Write
            </span>
          </TogglePill>
          <TogglePill active={tab === "preview"} onClick={() => setTab("preview")}>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3" /> Preview
            </span>
          </TogglePill>
          <span className="ml-auto text-[10px] text-white/30">Markdown supported</span>
        </div>

        {tab === "write" ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder={"# Heading\n\nWrite in **markdown** — _italic_, `code`, lists and [links](https://...)."}
            className="field min-h-[220px] resize-none font-mono text-[13px] leading-relaxed"
          />
        ) : (
          <div className="prose-flux min-h-[220px] rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            {body.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
            ) : (
              <p className="text-white/30">Nothing to preview yet.</p>
            )}
          </div>
        )}

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

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <LinkEditor selfType="note" value={links} onToggle={toggleLink} />
        </div>
      </div>
    </Modal>
  );
}
