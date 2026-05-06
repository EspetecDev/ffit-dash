"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react"
import { LogOut, Settings, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AccountMenuUser = {
  username: string
  role: "admin" | "user"
}

type AccountMenuProps = {
  user: AccountMenuUser | null
}

export function AccountMenu({ user }: AccountMenuProps) {
  const pathname = usePathname()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)
  const logoutItemRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const avatarLabel = user?.username.slice(0, 1).toUpperCase() || "?"
  const isDisabled = !user

  useEffect(() => {
    if (!open) return

    function closeOnPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnPointerDown)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      ;(firstItemRef.current ?? logoutItemRef.current)?.focus()
    }
  }, [open])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.replace("/")
  }

  function toggleMenu() {
    if (!isDisabled) {
      setOpen((current) => !current)
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!isDisabled) {
        setOpen(true)
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? `${user.username} account menu` : "No user"}
        disabled={isDisabled}
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        size="icon"
        title={user ? user.username : "No user"}
        type="button"
        variant="outline"
      >
        <span className="text-sm font-semibold">{avatarLabel}</span>
      </Button>

      {open && user ? (
        <div
          className="absolute right-0 top-11 z-50 min-w-44 overflow-hidden rounded-md border border-border bg-card py-1 text-card-foreground shadow-lg"
          id={menuId}
          role="menu"
        >
          <div className="border-b border-border px-3 py-2">
            <div className="truncate text-sm font-medium">{user.username}</div>
            <div className="text-xs capitalize text-muted-foreground">{user.role}</div>
          </div>

          {user.role === "user" ? (
            <Link
              ref={firstItemRef}
              className={menuItemClass()}
              href="/config"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <Settings />
              Config
            </Link>
          ) : pathname !== "/admin" ? (
            <Link
              ref={firstItemRef}
              className={menuItemClass()}
              href="/admin"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <ShieldCheck />
              Admin
            </Link>
          ) : null}

          <button
            ref={logoutItemRef}
            className={cn(menuItemClass(), "w-full")}
            onClick={logout}
            role="menuitem"
            type="button"
          >
            <LogOut />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}

function menuItemClass() {
  return "flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none [&_svg]:size-4"
}
