import { NextRequest, NextResponse } from "next/server"

import { authenticateUser, createSession, sessionCookieName } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: unknown
    password?: unknown
  }

  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
  }

  const user = authenticateUser(body.username, body.password)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const session = createSession(user.id)
  const response = NextResponse.json({ user })
  response.cookies.set(sessionCookieName, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  })

  return response
}
