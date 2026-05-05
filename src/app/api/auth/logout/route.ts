import { NextRequest, NextResponse } from "next/server"

import { deleteSession, isSecureRequest, sessionCookieName } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value
  deleteSession(token)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  })

  return response
}
