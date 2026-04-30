import { NextRequest, NextResponse } from "next/server"

import { getRequestAdmin } from "@/lib/auth"
import { updateIntakeNotes } from "@/lib/intake-db"

export async function POST(request: NextRequest) {
  if (!getRequestAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as {
    id?: unknown
    notes?: unknown
  }

  const id = body.id
  const notes = body.notes

  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Invalid notes" }, { status: 400 })
  }

  const result = await updateIntakeNotes(id, notes)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({ ok: true })
}
