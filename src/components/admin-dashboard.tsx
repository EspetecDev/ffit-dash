"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { KeyRound, LogOut, RefreshCw, ShieldCheck, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type UserRole = "admin" | "user"

type AuthUser = {
  id: number
  username: string
  role: UserRole
  createdAt: string
}

const passwordChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%+=?"

function generatePassword() {
  const bytes = new Uint32Array(24)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => passwordChars[byte % passwordChars.length]).join("")
}

function inputClass() {
  return "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
}

export function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("user")
  const [createdPassword, setCreatedPassword] = useState("")

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" })
    if (!response.ok) throw new Error("Could not load users")
    const payload = (await response.json()) as { users: AuthUser[] }
    setUsers(payload.users)
  }, [])

  const loadSession = useCallback(async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" })
      const payload = (await response.json()) as {
        authenticated: boolean
        user: AuthUser | null
      }
      setCurrentUser(payload.user)

      if (payload.user?.role === "admin") {
        await loadUsers()
      }
    } catch {
      setMessage("Could not load session")
    } finally {
      setLoading(false)
    }
  }, [loadUsers])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadSession()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loadSession])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
      }),
    })

    if (!response.ok) {
      setMessage("Invalid credentials")
      return
    }

    setLoginPassword("")
    await loadSession()
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    setUsers([])
    setCreatedPassword("")
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setCreatedPassword("")

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        role: newRole,
      }),
    })

    const payload = (await response.json()) as {
      error?: string
      user?: AuthUser
    }

    if (!response.ok || !payload.user) {
      setMessage(payload.error || "Could not create user")
      return
    }

    setCreatedPassword(newPassword)
    setNewUsername("")
    setNewPassword("")
    setNewRole("user")
    await loadUsers()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" />
              <span>Admin</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Account management
            </h1>
          </div>

          {currentUser ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={currentUser.role === "admin" ? "default" : "outline"}>
                {currentUser.username}
              </Badge>
              <Button variant="outline" onClick={logout}>
                <LogOut />
                Logout
              </Button>
            </div>
          ) : null}
        </header>

        {loading ? (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              Loading admin session...
            </CardContent>
          </Card>
        ) : null}

        {!loading && !currentUser ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Admin login</CardTitle>
              <CardDescription>
                Use an admin account to manage dashboard users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={login}>
                <label className="grid gap-1 text-sm">
                  Username
                  <input
                    className={inputClass()}
                    value={loginUsername}
                    onChange={(event) => setLoginUsername(event.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Password
                  <input
                    className={inputClass()}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                  />
                </label>
                <Button type="submit">Login</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {!loading && currentUser?.role !== "admin" ? (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              Your account is not allowed to manage users.
            </CardContent>
          </Card>
        ) : null}

        {!loading && currentUser?.role === "admin" ? (
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>Create user</CardTitle>
                <CardDescription>
                  Accounts can only be created by an authenticated admin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={createAccount}>
                  <label className="grid gap-1 text-sm">
                    Username
                    <input
                      className={inputClass()}
                      value={newUsername}
                      onChange={(event) => setNewUsername(event.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Role
                    <select
                      className={inputClass()}
                      value={newRole}
                      onChange={(event) => setNewRole(event.target.value as UserRole)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    Password
                    <input
                      className={inputClass()}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="text"
                      autoComplete="new-password"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => setNewPassword(generatePassword())}>
                      <KeyRound />
                      Generate password
                    </Button>
                    <Button type="submit">
                      <UserPlus />
                      Create user
                    </Button>
                  </div>
                </form>

                {createdPassword ? (
                  <div className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">
                    <div className="font-medium">Created password</div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {createdPassword}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>{users.length} accounts</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadUsers}>
                  <RefreshCw />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4 font-medium">Username</th>
                        <th className="py-3 pr-4 font-medium">Role</th>
                        <th className="py-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{user.username}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={user.role === "admin" ? "default" : "outline"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {user.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {message ? <p className="text-sm text-red-500">{message}</p> : null}
      </div>
    </main>
  )
}
