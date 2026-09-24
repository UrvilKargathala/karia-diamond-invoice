"use client";

import { useEffect, useState, useMemo } from "react";
import {
  StickyNote,
  Plus,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { SlideOver } from "@/components/slide-over";
import { useToast } from "@/components/toast";
import { NoteGridSkeleton } from "@/components/skeleton";
import type { Note } from "@/lib/types";

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchNotes = () => {
    setLoading(true);
    fetch("/api/notes")
      .then((r) => r.json())
      .then(setNotes)
      .catch(() => toast("Failed to load notes", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchNotes, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const openNew = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setPanelOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setPanelOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast("Title is required", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/notes/${editId}` : "/api/notes";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        toast(editId ? "Note updated" : "Note saved", "success");
        setPanelOpen(false);
        fetchNotes();
      } else {
        toast("Failed to save note", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      if (res.ok) fetchNotes();
    } catch {
      toast("Something went wrong", "error");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Note deleted", "success");
        fetchNotes();
      } else toast("Failed to delete", "error");
    } catch {
      toast("Something went wrong", "error");
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Internal notes and reminders</p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          <Plus size={14} /> New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="form-input pl-9"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <NoteGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <StickyNote size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "No notes match your search" : "No notes yet. Create your first one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((note) => {
            const isExpanded = expanded.has(note.id);
            const isLong = note.content.length > 220;
            return (
              <div key={note.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm break-words">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note)}
                    className={`p-1 rounded shrink-0 ${
                      note.pinned
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-gray-300 hover:text-gray-500"
                    }`}
                    title={note.pinned ? "Unpin" : "Pin"}
                  >
                    {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                  </button>
                </div>
                <p
                  className={`text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words flex-1 ${
                    isLong && !isExpanded ? "line-clamp-5" : ""
                  }`}
                >
                  {note.content}
                </p>
                {isLong && (
                  <button
                    onClick={() => toggleExpand(note.id)}
                    className="text-xs text-blue-600 hover:underline mt-1 self-start"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-400">
                  <span>{fmtDate(note.updatedAt)}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(note)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(note.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Panel */}
      <SlideOver open={panelOpen} title={editId ? "Edit Note" : "New Note"} onClose={() => setPanelOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-end border-t pt-4 mt-6">
          <button onClick={() => setPanelOpen(false)} className="btn btn-outline">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary disabled:opacity-50">
            {saving ? "Saving..." : editId ? "Update Note" : "Save Note"}
          </button>
        </div>
      </SlideOver>
    </div>
  );
}
