import { UserConfigShell } from "@/components/user-config-shell"
import { getSessionUser, sessionCookieName } from "@/lib/auth"
import { cookies } from "next/headers"
import { forbidden } from "next/navigation"

export default async function ConfigPage() {
  const cookieStore = await cookies()
  const user = getSessionUser(cookieStore.get(sessionCookieName)?.value)

  if (user?.role !== "user") {
    forbidden()
  }

  return <UserConfigShell user={user} />
}
