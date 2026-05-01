import { NextRequest, NextResponse } from "next/server"

import { getRequestUser } from "@/lib/auth"
import {
  createIntakeEntry,
  getIntakeDbPath,
  listIntakeEntries,
  updateIntakeEntry,
} from "@/lib/intake-db"

function isAuthorized(request: Request) {
  const token = process.env.FFIT_INGEST_TOKEN
  if (!token) return false

  return request.headers.get("authorization") === `Bearer ${token}`
}

export async function GET(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const entries = listIntakeEntries(user.id)

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

export async function POST(request: NextRequest) {
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

export async function PATCH(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const id = body.id

    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const result = updateIntakeEntry(id, body, user.id)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({ entry: result.entry })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update intake entry" },
      { status: 400 }
    )
  }
}
