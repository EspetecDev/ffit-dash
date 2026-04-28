import { NextResponse } from "next/server"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const csvPath = path.join(process.cwd(), "public", "data", "intake-log.csv")

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      values.push(current)
      current = ""
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

function escapeCsvValue(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    rowIndex?: unknown
    notas?: unknown
  }

  const rowIndex = body.rowIndex
  const notas = body.notas

  if (typeof rowIndex !== "number" || !Number.isInteger(rowIndex) || rowIndex < 0) {
    return NextResponse.json({ error: "Invalid rowIndex" }, { status: 400 })
  }

  if (typeof notas !== "string") {
    return NextResponse.json({ error: "Invalid notas" }, { status: 400 })
  }

  const csv = await readFile(csvPath, "utf8")
  const lines = csv.split(/\r?\n/)
  const headerLine = lines[0]

  if (!headerLine) {
    return NextResponse.json({ error: "CSV is empty" }, { status: 400 })
  }

  const headers = splitCsvLine(headerLine)
  let notesIndex = headers.findIndex((header) => normalizeHeader(header) === "notas")

  if (notesIndex === -1) {
    headers.push("Notas")
    notesIndex = headers.length - 1
    lines[0] = headers.map(escapeCsvValue).join(",")
  }

  const lineIndex = rowIndex + 1

  if (!lines[lineIndex]) {
    return NextResponse.json({ error: "CSV row not found" }, { status: 404 })
  }

  const values = splitCsvLine(lines[lineIndex])
  while (values.length < headers.length) values.push("")
  values[notesIndex] = notas
  lines[lineIndex] = values.map(escapeCsvValue).join(",")

  await writeFile(csvPath, lines.join("\n"), "utf8")

  return NextResponse.json({ ok: true })
}
