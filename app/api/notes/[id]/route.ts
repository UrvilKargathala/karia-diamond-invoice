import { NextResponse } from "next/server";
import { getAllNotes, updateNote, deleteNote } from "@/lib/db";
import type { Note } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await getAllNotes();
  const existing = all.find((n) => n.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, content, pinned } = body as {
    title?: string;
    content?: string;
    pinned?: boolean;
  };

  const updated: Note = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    content: content !== undefined ? content.trim() : existing.content,
    pinned: pinned !== undefined ? pinned : existing.pinned,
    updatedAt: new Date().toISOString(),
  };

  const success = await updateNote(id, updated);
  if (!success) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteNote(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
