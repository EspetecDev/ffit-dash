import { mkdirSync } from "node:fs"
import path from "node:path"

import { bootstrapAdminUser } from "@/lib/auth"
import { IntakeEntry } from "@/lib/intake"

type SqliteDatabase = {
  exec: (sql: string) => void
  prepare: (sql: string) => {
    all: (...values: unknown[]) => Record<string, unknown>[]
    get: (...values: unknown[]) => Record<string, unknown> | undefined
    run: (...values: unknown[]) => { changes: number; lastInsertRowid: number | bigint }
  }
}

export type IntakeInput = Omit<IntakeEntry, "id" | "userId">

let db: SqliteDatabase | undefined

export function getDataDir() {
  return process.env.FFIT_DATA_DIR
    ? path.resolve(process.env.FFIT_DATA_DIR)
    : path.join(process.cwd(), "data")
}

export function getIntakeDbPath() {
  return path.join(getDataDir(), "ffit.db")
}

function getDb() {
  if (db) return db

  mkdirSync(getDataDir(), { recursive: true })
  const sqlite = process.getBuiltinModule("node:sqlite") as {
    DatabaseSync: new (path: string) => SqliteDatabase
  }
  db = new sqlite.DatabaseSync(getIntakeDbPath())
  ensureSchema(db)

  return db
}

function createSchema(database: SqliteDatabase) {
  database.exec(`
    create table if not exists intake_entries (
      id integer primary key autoincrement,
      user_id integer not null,
      date text not null,
      meal text not null,
      food text not null,
      quantity text not null default '',
      unit text not null default '',
      brand text not null default '',
      calories real not null default 0,
      fat real not null default 0,
      carbs real not null default 0,
      protein real not null default 0,
      url text not null default '',
      notes text not null default '',
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    );
  `)
}

function createIndexes(database: SqliteDatabase) {
  database.exec(`
    create index if not exists intake_entries_user_id_idx on intake_entries(user_id);
    create index if not exists intake_entries_date_idx on intake_entries(date);
  `)
}

function tableExists(database: SqliteDatabase) {
  const row = database
    .prepare("select name from sqlite_master where type = 'table' and name = 'intake_entries'")
    .get()

  return Boolean(row)
}

function tableColumns(database: SqliteDatabase) {
  return new Set(
    database
      .prepare("pragma table_info(intake_entries)")
      .all()
      .map((row) => String(row.name))
  )
}

function ensureSchema(database: SqliteDatabase) {
  if (!tableExists(database)) {
    createSchema(database)
    createIndexes(database)
    return
  }

  const columns = tableColumns(database)
  if (columns.has("date")) {
    createSchema(database)
    ensureOwnerColumn(database, columns)
    createIndexes(database)
    return
  }

  if (columns.has("fecha")) {
    migrateSpanishSchema(database)
    return
  }

  throw new Error("Unsupported intake_entries database schema")
}

function firstAdminUserId(database: SqliteDatabase) {
  bootstrapAdminUser()

  const admin = database
    .prepare("select id from users where role = 'admin' order by created_at asc, id asc limit 1")
    .get()

  if (admin) return Number(admin.id)

  const user = database
    .prepare("select id from users order by created_at asc, id asc limit 1")
    .get()

  return user ? Number(user.id) : null
}

function requireDefaultOwnerId(database: SqliteDatabase) {
  const ownerId = firstAdminUserId(database)
  if (!ownerId) {
    throw new Error("No intake owner is available. Configure FFIT_ADMIN_USERNAME and FFIT_ADMIN_PASSWORD to bootstrap the first admin user.")
  }

  return ownerId
}

function ensureOwnerColumn(database: SqliteDatabase, columns: Set<string>) {
  if (columns.has("user_id")) return

  const ownerId = requireDefaultOwnerId(database)
  database.exec("alter table intake_entries add column user_id integer")
  database
    .prepare("update intake_entries set user_id = ? where user_id is null")
    .run(ownerId)
  database.exec("create index if not exists intake_entries_user_id_idx on intake_entries(user_id);")
}

function migrateSpanishSchema(database: SqliteDatabase) {
  const ownerId = requireDefaultOwnerId(database)
  database.exec(`
    alter table intake_entries rename to intake_entries_legacy;
  `)
  createSchema(database)
  database.exec(`
    insert into intake_entries (
      id,
      user_id,
      date,
      meal,
      food,
      quantity,
      unit,
      brand,
      calories,
      fat,
      carbs,
      protein,
      url,
      notes,
      created_at,
      updated_at
    )
    select
      id,
      ${ownerId},
      fecha,
      momento,
      alimento,
      cantidad,
      unidad,
      marca,
      calorias,
      grasas,
      carbohidratos,
      proteinas,
      url,
      notas,
      created_at,
      updated_at
    from intake_entries_legacy;
    drop table intake_entries_legacy;
  `)
  createIndexes(database)
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "").trim().replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeInput(input: Record<string, unknown>): IntakeInput {
  return {
    date: String(input.date ?? "").trim(),
    meal: String(input.meal ?? "").trim() || "No meal",
    food: String(input.food ?? "").trim() || "No food",
    quantity: String(input.quantity ?? "").trim(),
    unit: String(input.unit ?? "").trim(),
    brand: String(input.brand ?? "").trim(),
    calories: toNumber(input.calories),
    fat: toNumber(input.fat),
    carbs: toNumber(input.carbs),
    protein: toNumber(input.protein),
    url: String(input.url ?? "").trim(),
    notes: String(input.notes ?? "").trim(),
  }
}

function fromRow(row: Record<string, unknown>): IntakeEntry {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    date: String(row.date ?? ""),
    meal: String(row.meal ?? ""),
    food: String(row.food ?? ""),
    quantity: String(row.quantity ?? ""),
    unit: String(row.unit ?? ""),
    brand: String(row.brand ?? ""),
    calories: toNumber(row.calories),
    fat: toNumber(row.fat),
    carbs: toNumber(row.carbs),
    protein: toNumber(row.protein),
    url: String(row.url ?? ""),
    notes: String(row.notes ?? ""),
  }
}

function insertIntakeEntry(input: Record<string, unknown>) {
  const database = getDb()

  const entry = normalizeInput(input)
  if (!entry.date) throw new Error("date is required")
  const ownerId = requireDefaultOwnerId(database)

  const result = database
    .prepare(`
      insert into intake_entries (
        user_id,
        date,
        meal,
        food,
        quantity,
        unit,
        brand,
        calories,
        fat,
        carbs,
        protein,
        url,
        notes
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      ownerId,
      entry.date,
      entry.meal,
      entry.food,
      entry.quantity,
      entry.unit,
      entry.brand,
      entry.calories,
      entry.fat,
      entry.carbs,
      entry.protein,
      entry.url,
      entry.notes
    )

  return Number(result.lastInsertRowid)
}

export function listIntakeEntries() {
  return getDb()
    .prepare("select * from intake_entries order by date asc, id asc")
    .all()
    .map(fromRow)
}

export function createIntakeEntry(input: Record<string, unknown>) {
  const entry = normalizeInput(input)
  if (!entry.date) throw new Error("date is required")

  const id = insertIntakeEntry(entry)
  const row = getDb().prepare("select * from intake_entries where id = ?").get(id)
  if (!row) throw new Error("Failed to read inserted intake entry")

  return fromRow(row)
}

export function updateIntakeEntry(id: number, input: Record<string, unknown>) {
  const database = getDb()
  const entry = normalizeInput(input)
  if (!entry.date) throw new Error("date is required")

  const result = database
    .prepare(`
      update intake_entries
      set
        date = ?,
        meal = ?,
        food = ?,
        quantity = ?,
        unit = ?,
        brand = ?,
        calories = ?,
        fat = ?,
        carbs = ?,
        protein = ?,
        url = ?,
        notes = ?,
        updated_at = current_timestamp
      where id = ?
    `)
    .run(
      entry.date,
      entry.meal,
      entry.food,
      entry.quantity,
      entry.unit,
      entry.brand,
      entry.calories,
      entry.fat,
      entry.carbs,
      entry.protein,
      entry.url,
      entry.notes,
      id
    )

  if (result.changes === 0) {
    return { ok: false, status: 404, error: "Intake row not found" }
  }

  const row = database.prepare("select * from intake_entries where id = ?").get(id)
  if (!row) throw new Error("Failed to read updated intake entry")

  return { ok: true, entry: fromRow(row) }
}
