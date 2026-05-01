import { AdminDashboard } from "@/components/admin-dashboard"
import { getSessionUser, sessionCookieName } from "@/lib/auth"
import { cookies } from "next/headers"
import { forbidden } from "next/navigation"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const user = getSessionUser(cookieStore.get(sessionCookieName)?.value)

  if (user?.role !== "admin") {
    forbidden()
  }

  return <AdminDashboard />
}
