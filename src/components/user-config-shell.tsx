"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { Copy, KeyRound, LayoutDashboard, Plus, ShieldCheck, Trash2 } from "lucide-react"

import { AccountMenu } from "@/components/account-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import type { AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

const sections = [
  {
    id: "password",
    label: "Change password",
    icon: KeyRound,
    description: "Use this area to update account credentials.",
  },
  {
    id: "api-tokens",
    label: "Manage API tokens",
    icon: ShieldCheck,
    description: "Use this area to manage REST and MCP access tokens.",
  },
]

type ConfigSectionId = (typeof sections)[number]["id"]
type ApiToken = {
  id: number
  name: string
  token: string
  tokenPrefix: string
  createdAt: string
}

export function UserConfigShell({ user }: { user: AuthUser }) {
  const [activeSection, setActiveSection] = useState<ConfigSectionId>("password")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([])
  const [newTokenName, setNewTokenName] = useState("")
  const [tokenMessage, setTokenMessage] = useState("")
  const [tokenStatus, setTokenStatus] = useState<"idle" | "success" | "error">("idle")
  const [isTokenLoading, setIsTokenLoading] = useState(false)
  const [isTokenCreating, setIsTokenCreating] = useState(false)
  const [deletingTokenId, setDeletingTokenId] = useState<number | null>(null)
  const section = sections.find((item) => item.id === activeSection) ?? sections[0]
  const SectionIcon = section.icon

  async function loadApiTokens() {
    setIsTokenLoading(true)
    setTokenMessage("")
    setTokenStatus("idle")

    try {
      const response = await fetch("/api/auth/tokens", { cache: "no-store" })
      const payload = (await response.json()) as {
        error?: string
        tokens?: ApiToken[]
      }

      if (!response.ok) {
        throw new Error(payload.error || "Could not load API tokens")
      }

      setApiTokens(payload.tokens ?? [])
    } catch (error) {
      setTokenStatus("error")
      setTokenMessage(
        error instanceof Error ? error.message : "Could not load API tokens"
      )
    } finally {
      setIsTokenLoading(false)
    }
  }

  function changeSection(sectionId: ConfigSectionId) {
    setActiveSection(sectionId)
    if (sectionId === "api-tokens") {
      loadApiTokens()
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage("")
    setPasswordStatus("idle")
    setIsPasswordSaving(true)

    if (newPassword !== confirmPassword) {
      setPasswordStatus("error")
      setPasswordMessage("Passwords do not match")
      setIsPasswordSaving(false)
      return
    }

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "Could not update password")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordStatus("success")
      setPasswordMessage("Password updated.")
    } catch (error) {
      setPasswordStatus("error")
      setPasswordMessage(
        error instanceof Error ? error.message : "Could not update password"
      )
    } finally {
      setIsPasswordSaving(false)
    }
  }

  async function createToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTokenMessage("")
    setTokenStatus("idle")

    if (!window.confirm(`Create API token "${newTokenName.trim()}"?`)) {
      return
    }

    setIsTokenCreating(true)

    try {
      const response = await fetch("/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName }),
      })
      const payload = (await response.json()) as {
        error?: string
        token?: ApiToken
      }

      if (!response.ok || !payload.token) {
        throw new Error(payload.error || "Could not create token")
      }

      setApiTokens((current) => [...current, payload.token as ApiToken])
      setNewTokenName("")
      setTokenStatus("success")
      setTokenMessage("API token created.")
    } catch (error) {
      setTokenStatus("error")
      setTokenMessage(
        error instanceof Error ? error.message : "Could not create token"
      )
    } finally {
      setIsTokenCreating(false)
    }
  }

  async function copyToken(token: ApiToken) {
    try {
      await window.navigator.clipboard.writeText(token.token)
      setTokenStatus("success")
      setTokenMessage(`Copied ${token.name}.`)
    } catch {
      setTokenStatus("error")
      setTokenMessage("Could not copy token")
    }
  }

  async function deleteToken(token: ApiToken) {
    if (!window.confirm(`Remove API token "${token.name}"?`)) {
      return
    }

    setDeletingTokenId(token.id)
    setTokenMessage("")
    setTokenStatus("idle")

    try {
      const response = await fetch("/api/auth/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: token.id }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || "Could not remove token")
      }

      setApiTokens((current) => current.filter((item) => item.id !== token.id))
      setTokenStatus("success")
      setTokenMessage(`Removed ${token.name}.`)
    } catch (error) {
      setTokenStatus("error")
      setTokenMessage(
        error instanceof Error ? error.message : "Could not remove token"
      )
    } finally {
      setDeletingTokenId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
        <Link
          className="text-lg font-semibold tracking-normal transition-colors hover:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/"
        >
          FFIT
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccountMenu user={user} />
        </div>
      </header>

      <aside className="border-b border-border bg-card/95 px-4 py-4 md:fixed md:bottom-0 md:left-0 md:top-[65px] md:z-20 md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-6">
          <div>
            <div className="text-lg font-semibold tracking-normal">Config</div>
            <div className="text-sm text-muted-foreground">Account settings</div>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  key={section.id}
                  onClick={() => changeSection(section.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  {section.label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      <main className="min-h-[calc(100vh-65px)] md:pl-64">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4" />
                <span>Config</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                Account settings
              </h1>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href="/"
            >
              <LayoutDashboard />
              Dashboard
            </Link>
          </header>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SectionIcon className="size-4" />
                <span>{section.label}</span>
              </div>
              <CardTitle>{section.label}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeSection === "password" ? (
                <form className="grid gap-3 sm:max-w-md" onSubmit={changePassword}>
                  <label className="grid gap-1 text-sm">
                    Current password
                    <input
                      autoComplete="current-password"
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      type="password"
                      value={currentPassword}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    New password
                    <input
                      autoComplete="new-password"
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      minLength={5}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      type="password"
                      value={newPassword}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Confirm new password
                    <input
                      autoComplete="new-password"
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      minLength={5}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </label>
                  <Button disabled={isPasswordSaving} type="submit">
                    {isPasswordSaving ? "Saving..." : "Change password"}
                  </Button>
                  {passwordMessage ? (
                    <p
                      className={cn(
                        "text-sm",
                        passwordStatus === "success"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      )}
                    >
                      {passwordMessage}
                    </p>
                  ) : null}
                </form>
              ) : (
                <div className="grid gap-4">
                  <form className="flex flex-col gap-2 sm:flex-row" onSubmit={createToken}>
                    <label className="grid flex-1 gap-1 text-sm">
                      Token name
                      <input
                        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        maxLength={40}
                        onChange={(event) => setNewTokenName(event.target.value)}
                        required
                        value={newTokenName}
                      />
                    </label>
                    <Button
                      className="sm:self-end"
                      disabled={isTokenCreating}
                      type="submit"
                    >
                      <Plus />
                      {isTokenCreating ? "Creating..." : "New token"}
                    </Button>
                  </form>

                  <div className="grid gap-2">
                    {apiTokens.length > 0 ? (
                      apiTokens.map((token) => (
                        <div
                          className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          key={token.id}
                        >
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {token.tokenPrefix}...
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => copyToken(token)}
                            >
                              <Copy />
                              Copy
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={deletingTokenId === token.id}
                              onClick={() => deleteToken(token)}
                            >
                              <Trash2 />
                              {deletingTokenId === token.id ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-border px-4 py-3 text-sm text-muted-foreground">
                        {isTokenLoading ? "Loading API tokens..." : "No API tokens issued yet."}
                      </div>
                    )}
                  </div>

                  {tokenMessage ? (
                    <p
                      className={cn(
                        "text-sm",
                        tokenStatus === "success"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      )}
                    >
                      {tokenMessage}
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
