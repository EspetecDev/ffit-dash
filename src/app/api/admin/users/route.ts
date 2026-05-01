import { NextRequest, NextResponse } from "next/server"

import {
  createUser,
  getRequestAdmin,
  listUsers,
  UserRole,
} from "@/lib/auth"

export async function GET(request: NextRequest) {
  if (!getRequestAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ users: listUsers() })
}

export async function POST(request: NextRequest) {
  if (!getRequestAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as {
      username?: unknown
      password?: unknown
      role?: unknown
    }

    if (typeof body.username !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Invalid user payload" }, { status: 400 })
    }

    const created = createUser({
      username: body.username,
      password: body.password,
      role: body.role === "admin" ? "admin" : ("user" as UserRole),
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 400 }
    )
  }
}
