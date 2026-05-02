"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { KeyRound, LayoutDashboard, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export function UserConfigShell({ user }: { user: AuthUser }) {
  const [activeSection, setActiveSection] = useState<ConfigSectionId>("password")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const avatarLabel = user.username.slice(0, 1).toUpperCase()
  const section = sections.find((item) => item.id === activeSection) ?? sections[0]
  const SectionIcon = section.icon

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
        <div className="text-lg font-semibold tracking-normal">FFIT</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Badge variant="outline">{user.username}</Badge>
          <div
            className="flex size-9 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground"
            aria-label={user.username}
            title={user.username}
          >
            {avatarLabel}
          </div>
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
                  onClick={() => setActiveSection(section.id)}
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
                <div className="grid gap-3">
                  <div className="rounded-md border border-border px-4 py-3 text-sm text-muted-foreground">
                    No API tokens issued yet.
                  </div>
                  <Button disabled className="w-fit" type="button">
                    New token
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
