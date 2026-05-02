import { NextRequest, NextResponse } from "next/server"

import {
  createUserApiToken,
  deleteUserApiToken,
  getRequestUser,
  listUserApiTokens,
} from "@/lib/auth"

export async function GET(request: NextRequest) {
  const user = getRequestUser(request)
  if (user?.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ tokens: listUserApiTokens(user.id) })
}

export async function POST(request: NextRequest) {
  const user = getRequestUser(request)
  if (user?.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown
  } | null

  try {
    const token = createUserApiToken({
      userId: user.id,
      name: typeof body?.name === "string" ? body.name : "",
    })

    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create token" },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const user = getRequestUser(request)
  if (user?.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown
  } | null
  const tokenId = Number(body?.id)

  if (!Number.isInteger(tokenId)) {
    return NextResponse.json({ error: "Invalid token id" }, { status: 400 })
  }

  const deleted = deleteUserApiToken({ userId: user.id, tokenId })
  if (!deleted) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
