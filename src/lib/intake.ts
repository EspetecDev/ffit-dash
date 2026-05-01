export type IntakeEntry = {
  id: number
  userId: number
  date: string
  meal: string
  food: string
  quantity: string
  unit: string
  brand: string
  calories: number
  fat: number
  carbs: number
  protein: number
  url: string
  notes: string
}

export type DailyIntake = {
  date: string
  calories: number
  fat: number
  carbs: number
  protein: number
  entries: IntakeEntry[]
}

export function groupIntakeByDay(entries: IntakeEntry[]): DailyIntake[] {
  const days = entries.reduce<Record<string, DailyIntake>>((acc, entry) => {
    acc[entry.date] ??= {
      date: entry.date,
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
      entries: [],
    }

    acc[entry.date].calories += entry.calories
    acc[entry.date].fat += entry.fat
    acc[entry.date].carbs += entry.carbs
    acc[entry.date].protein += entry.protein
    acc[entry.date].entries.push(entry)

    return acc
  }, {})

  return Object.values(days).sort((a, b) => a.date.localeCompare(b.date))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("es", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}
