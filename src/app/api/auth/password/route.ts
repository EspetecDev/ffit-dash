import { NextRequest, NextResponse } from "next/server"

import { changeUserPassword, getRequestUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const user = getRequestUser(request)
  if (user?.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: unknown
    newPassword?: unknown
  } | null

  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""

  try {
    const changed = changeUserPassword({
      userId: user.id,
      currentPassword,
      newPassword,
    })

    if (!changed) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update password" },
      { status: 400 }
    )
  }
}
