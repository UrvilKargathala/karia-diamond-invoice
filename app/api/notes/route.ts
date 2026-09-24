import { NextResponse } from "next/server";
import { getAllNotes, saveNote } from "@/lib/db";
import type { Note } from "@/lib/types";
import { generateId } from "@/lib/utils";

export async function GET() {
  const notes = await getAllNotes();
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, content } = body as { title: string; content: string };

  const now = new Date().toISOString();
  const note: Note = {
    id: generateId(),
    title: title.trim(),
    content: content.trim(),
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  await saveNote(note);
  return NextResponse.json(note, { status: 201 });
}
