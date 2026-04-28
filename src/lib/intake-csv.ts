export type IntakeEntry = {
  rowIndex: number
  fecha: string
  momento: string
  alimento: string
  cantidad: string
  unidad: string
  marca: string
  calorias: number
  grasas: number
  carbohidratos: number
  proteinas: number
  url: string
  notas: string
}

export type DailyIntake = {
  fecha: string
  calorias: number
  grasas: number
  carbohidratos: number
  proteinas: number
  entries: IntakeEntry[]
}

type CsvRow = Record<string, string>

const aliases = {
  fecha: ["fecha", "date"],
  momento: ["momento", "meal", "meal_time"],
  alimento: ["alimento", "food"],
  cantidad: ["cantidad", "quantity", "amount"],
  unidad: ["unidad", "unit"],
  marca: ["marca", "brand"],
  calorias: ["calorias", "calorías", "calories"],
  grasas: ["grasas", "fat_g", "fats"],
  carbohidratos: ["carbohidratos", "carbs_g", "carbs"],
  proteinas: ["proteinas", "proteínas", "protein_g", "protein"],
  url: ["url", "link"],
  notas: ["notas", "notes"],
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function numeric(value: string | undefined) {
  const normalized = value?.trim().replace(",", ".") ?? ""
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

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
      values.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function valueFor(row: CsvRow, key: keyof typeof aliases) {
  const normalizedAliases = aliases[key].map(normalizeHeader)
  const match = Object.entries(row).find(([header]) =>
    normalizedAliases.includes(normalizeHeader(header))
  )

  return match?.[1] ?? ""
}

export function parseIntakeCsv(csv: string): IntakeEntry[] {
  const [headerLine, ...lines] = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (!headerLine) return []

  const headers = splitCsvLine(headerLine)

  return lines
    .map((line, rowIndex): CsvRow & { __rowIndex: string } => {
      const values = splitCsvLine(line)
      return headers.reduce<CsvRow & { __rowIndex: string }>((row, header, index) => {
        row[header] = values[index] ?? ""
        return row
      }, { __rowIndex: String(rowIndex) })
    })
    .map((row) => ({
      rowIndex: numeric(row.__rowIndex),
      fecha: valueFor(row, "fecha"),
      momento: valueFor(row, "momento") || "Sin momento",
      alimento: valueFor(row, "alimento") || "Sin alimento",
      cantidad: valueFor(row, "cantidad"),
      unidad: valueFor(row, "unidad"),
      marca: valueFor(row, "marca"),
      calorias: numeric(valueFor(row, "calorias")),
      grasas: numeric(valueFor(row, "grasas")),
      carbohidratos: numeric(valueFor(row, "carbohidratos")),
      proteinas: numeric(valueFor(row, "proteinas")),
      url: valueFor(row, "url"),
      notas: valueFor(row, "notas"),
    }))
    .filter((entry) => entry.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function groupIntakeByDay(entries: IntakeEntry[]): DailyIntake[] {
  const days = entries.reduce<Record<string, DailyIntake>>((acc, entry) => {
    acc[entry.fecha] ??= {
      fecha: entry.fecha,
      calorias: 0,
      grasas: 0,
      carbohidratos: 0,
      proteinas: 0,
      entries: [],
    }

    acc[entry.fecha].calorias += entry.calorias
    acc[entry.fecha].grasas += entry.grasas
    acc[entry.fecha].carbohidratos += entry.carbohidratos
    acc[entry.fecha].proteinas += entry.proteinas
    acc[entry.fecha].entries.push(entry)

    return acc
  }, {})

  return Object.values(days).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("es", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}
