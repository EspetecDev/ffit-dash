import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdirSync } from "node:fs"
import path from "node:path"

export const sessionCookieName = "ffit_session"

export type UserRole = "admin" | "user"

export type AuthUser = {
  id: number
  username: string
  role: UserRole
  createdAt: string
}

type SqliteDatabase = {
  exec: (sql: string) => void
  prepare: (sql: string) => {
    all: (...values: unknown[]) => Record<string, unknown>[]
    get: (...values: unknown[]) => Record<string, unknown> | undefined
    run: (...values: unknown[]) => { changes: number; lastInsertRowid: number | bigint }
  }
}

let db: SqliteDatabase | undefined

function getDataDir() {
  return process.env.FFIT_DATA_DIR
    ? path.resolve(process.env.FFIT_DATA_DIR)
    : path.join(process.cwd(), "data")
}

function getDbPath() {
  return path.join(getDataDir(), "ffit.db")
}

function getDb() {
  if (db) return db

  mkdirSync(getDataDir(), { recursive: true })
  const sqlite = process.getBuiltinModule("node:sqlite") as {
    DatabaseSync: new (path: string) => SqliteDatabase
  }
  db = new sqlite.DatabaseSync(getDbPath())
  ensureAuthSchema(db)

  return db
}

function ensureAuthSchema(database: SqliteDatabase) {
  database.exec(`
    create table if not exists users (
      id integer primary key autoincrement,
      username text not null unique,
      password_hash text not null,
      role text not null default 'user',
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    );
    create index if not exists users_role_idx on users(role);

    create table if not exists sessions (
      id text primary key,
      token_hash text not null unique,
      user_id integer not null,
      expires_at text not null,
      created_at text not null default current_timestamp,
      foreign key(user_id) references users(id)
    );
    create index if not exists sessions_user_id_idx on sessions(user_id);
    create index if not exists sessions_expires_at_idx on sessions(expires_at);
  `)
}

function toUser(row: Record<string, unknown>): AuthUser {
  return {
    id: Number(row.id),
    username: String(row.username ?? ""),
    role: row.role === "admin" ? "admin" : "user",
    createdAt: String(row.created_at ?? ""),
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split(":")
  if (algorithm !== "scrypt" || !salt || !storedHash) return false

  const candidate = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex")
  const stored = Buffer.from(storedHash, "hex")
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function validateUsername(username: string) {
  const value = username.trim()
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(value)) {
    throw new Error("Username must be 3-40 characters using letters, numbers, dots, dashes, or underscores")
  }

  return value
}

function validatePassword(password: string) {
  if (password.length < 10) {
    throw new Error("Password must be at least 10 characters")
  }

  return password
}

function validateRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user"
}

export function bootstrapAdminUser() {
  const database = getDb()
  const existingAdmin = database
    .prepare("select id from users where role = 'admin' limit 1")
    .get()

  if (existingAdmin) return

  const username = process.env.FFIT_ADMIN_USERNAME?.trim()
  const password = process.env.FFIT_ADMIN_PASSWORD
  if (!username || !password) return

  createUser({
    username,
    password,
    role: "admin",
  })
}

export function createUser({
  username,
  password,
  role,
}: {
  username: string
  password: string
  role: UserRole
}) {
  const database = getDb()
  const normalizedUsername = validateUsername(username)
  const validatedPassword = validatePassword(password)
  const validatedRole = validateRole(role)

  try {
    const result = database
      .prepare("insert into users (username, password_hash, role) values (?, ?, ?)")
      .run(normalizedUsername, hashPassword(validatedPassword), validatedRole)

    const row = database
      .prepare("select * from users where id = ?")
      .get(Number(result.lastInsertRowid))
    if (!row) throw new Error("Failed to read created user")

    return toUser(row)
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new Error("Username already exists")
    }
    throw error
  }
}

export function listUsers() {
  bootstrapAdminUser()

  return getDb()
    .prepare("select * from users order by created_at asc, id asc")
    .all()
    .map(toUser)
}

export function authenticateUser(username: string, password: string) {
  bootstrapAdminUser()

  const row = getDb()
    .prepare("select * from users where username = ?")
    .get(username.trim())

  if (!row || !verifyPassword(password, String(row.password_hash ?? ""))) {
    return null
  }

  return toUser(row)
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

  getDb()
    .prepare("insert into sessions (id, token_hash, user_id, expires_at) values (?, ?, ?, ?)")
    .run(randomBytes(16).toString("hex"), hashSessionToken(token), userId, expiresAt)

  return { token, expiresAt }
}

export function getSessionUser(token?: string | null) {
  if (!token) return null

  bootstrapAdminUser()

  const row = getDb()
    .prepare(`
      select users.*
      from sessions
      join users on users.id = sessions.user_id
      where sessions.token_hash = ?
        and datetime(sessions.expires_at) > datetime('now')
      limit 1
    `)
    .get(hashSessionToken(token))

  return row ? toUser(row) : null
}

export function deleteSession(token?: string | null) {
  if (!token) return

  getDb()
    .prepare("delete from sessions where token_hash = ?")
    .run(hashSessionToken(token))
}

export function isAdmin(user: AuthUser | null) {
  return user?.role === "admin"
}
