import { NextRequest, NextResponse } from "next/server"

import {
  createUser,
  deleteUserAccount,
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

export async function DELETE(request: NextRequest) {
  const admin = getRequestAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as {
      userId?: unknown
    }
    const userId = Number(body.userId)

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 }
      )
    }

    const deleted = deleteUserAccount(userId)

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: deleted.user,
      deletedIntakeEntries: deleted.deletedIntakeEntries,
      deletedApiTokens: deleted.deletedApiTokens,
      deletedSessions: deleted.deletedSessions,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 400 }
    )
  }
}
