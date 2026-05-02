import Link from "next/link"

export default function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="grid max-w-md gap-4 text-center">
        <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
          403
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Forbidden</h1>
        <p className="text-sm text-muted-foreground">
          Your account does not have access to this page.
        </p>
        <Link
          className="mx-auto inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          href="/"
        >
          Return to login
        </Link>
      </section>
    </main>
  )
}
