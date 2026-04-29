import { NextResponse } from "next/server"

import { createIntakeEntry, getIntakeDbPath, listIntakeEntries } from "@/lib/intake-db"

function isAuthorized(request: Request) {
  const token = process.env.FFIT_INGEST_TOKEN
  if (!token) return false

  return request.headers.get("authorization") === `Bearer ${token}`
}

export async function GET() {
  try {
    const entries = listIntakeEntries()

    return NextResponse.json({
      entries,
      source: getIntakeDbPath(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read intake DB",
        source: getIntakeDbPath(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const entry = createIntakeEntry(body)

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create intake entry" },
      { status: 400 }
    )
  }
}
