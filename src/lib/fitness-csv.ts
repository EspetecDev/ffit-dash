export type FitnessLog = {
  date: string
  weightKg: number
  calories: number
  proteinG: number
  steps: number
  workoutMinutes: number
  workoutType: string
  sleepHours: number
  mood: string
  notes: string
}

type CsvRow = Record<string, string>

const numeric = (value: string | undefined) => {
  const parsed = Number(value)
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

export function parseFitnessCsv(csv: string): FitnessLog[] {
  const [headerLine, ...lines] = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (!headerLine) return []

  const headers = splitCsvLine(headerLine)

  return lines
    .map((line): CsvRow => {
      const values = splitCsvLine(line)
      return headers.reduce<CsvRow>((row, header, index) => {
        row[header] = values[index] ?? ""
        return row
      }, {})
    })
    .map((row) => ({
      date: row.date,
      weightKg: numeric(row.weight_kg),
      calories: numeric(row.calories),
      proteinG: numeric(row.protein_g),
      steps: numeric(row.steps),
      workoutMinutes: numeric(row.workout_minutes),
      workoutType: row.workout_type || "Other",
      sleepHours: numeric(row.sleep_hours),
      mood: row.mood || "Unlogged",
      notes: row.notes || "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}
