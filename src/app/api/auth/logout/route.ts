import { NextRequest, NextResponse } from "next/server"

import { deleteSession, sessionCookieName } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value
  deleteSession(token)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
