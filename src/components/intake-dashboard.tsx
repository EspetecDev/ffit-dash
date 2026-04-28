"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Edit3,
  ExternalLink,
  Flame,
  Ham,
  LayoutDashboard,
  List,
  Moon,
  PieChart,
  RefreshCw,
  Salad,
  Save,
  Soup,
  Sun,
  Utensils,
  Wheat,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DailyIntake,
  IntakeEntry,
  groupIntakeByDay,
  parseIntakeCsv,
} from "@/lib/intake-csv"
import { cn } from "@/lib/utils"

const csvPath = "/data/intake-log.csv"
const intakeTrackingStart = "2026-04-27"
const requiredMealMoments = ["desayuno", "comida", "cena"]
const dailyRecommendedCalories = 2200

type DashboardView =
  | "nutrition-overview"
  | "nutrition-log"
  | "nutrition-day"
  | "workouts"
type NotesState = Record<number, "idle" | "saving" | "error">
type Language = "ca" | "es" | "en"

const languageLabels: Record<Language, string> = {
  ca: "CA",
  es: "ES",
  en: "EN",
}

const localeByLanguage: Record<Language, string> = {
  ca: "ca",
  es: "es",
  en: "en",
}

const weekdaysByLanguage: Record<Language, string[]> = {
  ca: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
  es: ["L", "M", "X", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
}

const copy = {
  ca: {
    appSubtitle: "Registre diari de fitness",
    nutrition: "Nutricio",
    workouts: "Entrenaments",
    overview: "Resum",
    log: "Registre",
    language: "Idioma",
    currentCalories: "Calories del dia",
    protein: "Proteines",
    carbs: "Carbohidrats",
    fats: "Greixos",
    dayTotal: "Total del dia",
    average: "de mitjana",
    foodsRegistered: "aliments registrats",
    registeredFoods: "Aliments registrats",
    caloriesByDay: "Calories per dia",
    currentWeek: "Setmana actual",
    previousWeek: "Setmana anterior",
    nextWeek: "Setmana seguent",
    recommendedCalories: "Calories recomanades",
    selectedAverage: "Mitjana seleccionada",
    macroSplit: "Repartiment de macros",
    byMoment: "Per moment",
    selectedDayCalories: "Calories del dia seleccionat.",
    rangeSummary: "Resum del rang",
    visibleDays: "dies visibles.",
    foods: "Aliments",
    avgCalories: "Kcal mitjanes",
    activeFile: "Fitxer actiu",
    workoutsCsvNote: "Entrenaments pot viure en un altre CSV quan afegim aquest flux.",
    intakeCalendar: "Calendari d'ingesta",
    dailyIntakeLog: "Registre diari d'ingesta",
    intakeLog: "Registre d'ingesta",
    allDetails: "Tots els detalls",
    dayDetails: "Detalls del dia",
    backToLog: "Tornar al registre",
    reloadCsv: "Recarregar CSV",
    lastDay: "Ultim dia",
    intakeRegister: "Registre d'ingesta",
    caloriesAndMacros: "Calories i Macros",
    tableDate: "Data",
    tableMoment: "Moment",
    tableFood: "Aliment",
    tableQuantity: "Quantitat",
    tableFat: "Greixos",
    tableNotes: "Notes",
    tableSource: "URL",
    source: "Font",
    subtotal: "Subtotal",
    save: "Desar",
    cancel: "Cancel.lar",
    saveError: "Error en desar",
    editNotes: "Editar notes de",
    loadingCsv: "Carregant CSV",
    failedCsv: "No s'ha pogut carregar el CSV",
    loadedFrom: "aliments carregats des de",
    totalRange: "Total del dia",
    workoutPending: "Tauler d'entrenaments pendent",
    workoutPendingDescription: "Aquesta seccio esta preparada per a un CSV separat d'entrenaments.",
  },
  es: {
    appSubtitle: "Registro diario de fitness",
    nutrition: "Nutricion",
    workouts: "Entrenamientos",
    overview: "Resumen",
    log: "Registro",
    language: "Idioma",
    currentCalories: "Calorias del dia",
    protein: "Proteinas",
    carbs: "Carbohidratos",
    fats: "Grasas",
    dayTotal: "Total del dia",
    average: "de media",
    foodsRegistered: "alimentos registrados",
    registeredFoods: "Alimentos registrados",
    caloriesByDay: "Calorias por dia",
    currentWeek: "Semana actual",
    previousWeek: "Semana anterior",
    nextWeek: "Semana siguiente",
    recommendedCalories: "Calorias recomendadas",
    selectedAverage: "Media seleccionada",
    macroSplit: "Reparto de macros",
    byMoment: "Por momento",
    selectedDayCalories: "Calorias del dia seleccionado.",
    rangeSummary: "Resumen del rango",
    visibleDays: "dias visibles.",
    foods: "Alimentos",
    avgCalories: "Kcal medias",
    activeFile: "Archivo activo",
    workoutsCsvNote: "Workouts puede vivir en otro CSV cuando pasemos a esa parte.",
    intakeCalendar: "Calendario de ingesta",
    dailyIntakeLog: "Registro diario de ingesta",
    intakeLog: "Registro de ingesta",
    allDetails: "Todos los detalles",
    dayDetails: "Detalles del dia",
    backToLog: "Volver al registro",
    reloadCsv: "Recargar CSV",
    lastDay: "Ultimo dia",
    intakeRegister: "Registro de ingesta",
    caloriesAndMacros: "Calorias y Macros",
    tableDate: "Fecha",
    tableMoment: "Momento",
    tableFood: "Alimento",
    tableQuantity: "Cantidad",
    tableFat: "Grasas",
    tableNotes: "Notas",
    tableSource: "URL",
    source: "Fuente",
    subtotal: "Subtotal",
    save: "Guardar",
    cancel: "Cancelar",
    saveError: "Error al guardar",
    editNotes: "Editar notas de",
    loadingCsv: "Cargando CSV",
    failedCsv: "No se pudo cargar el CSV",
    loadedFrom: "alimentos cargados desde",
    totalRange: "Total del dia",
    workoutPending: "Dashboard de entrenamientos pendiente",
    workoutPendingDescription: "Esta seccion esta preparada para un CSV separado de entrenamientos.",
  },
  en: {
    appSubtitle: "Fitness daily log",
    nutrition: "Nutrition",
    workouts: "Workouts",
    overview: "Overview",
    log: "Log",
    language: "Language",
    currentCalories: "Day calories",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fat",
    dayTotal: "Day total",
    average: "average",
    foodsRegistered: "foods registered",
    registeredFoods: "Registered foods",
    caloriesByDay: "Calories by day",
    currentWeek: "Current week",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    recommendedCalories: "Recommended calories",
    selectedAverage: "Selected average",
    macroSplit: "Macro split",
    byMoment: "By moment",
    selectedDayCalories: "Calories for the selected day.",
    rangeSummary: "Range summary",
    visibleDays: "visible days.",
    foods: "Foods",
    avgCalories: "Avg kcal",
    activeFile: "Active file",
    workoutsCsvNote: "Workouts can live in another CSV when we add that flow.",
    intakeCalendar: "Intake calendar",
    dailyIntakeLog: "Daily intake log",
    intakeLog: "Intake Log",
    allDetails: "All details",
    dayDetails: "Day details",
    backToLog: "Back to log",
    reloadCsv: "Reload CSV",
    lastDay: "Last day",
    intakeRegister: "Intake register",
    caloriesAndMacros: "Calories and Macros",
    tableDate: "Date",
    tableMoment: "Moment",
    tableFood: "Food",
    tableQuantity: "Quantity",
    tableFat: "Fat",
    tableNotes: "Notes",
    tableSource: "URL",
    source: "Source",
    subtotal: "Subtotal",
    save: "Save",
    cancel: "Cancel",
    saveError: "Save failed",
    editNotes: "Edit notes for",
    loadingCsv: "Loading CSV",
    failedCsv: "Could not load CSV",
    loadedFrom: "foods loaded from",
    totalRange: "Day total",
    workoutPending: "Workout dashboard pending",
    workoutPendingDescription: "This section is ready for a separate workouts CSV.",
  },
} satisfies Record<Language, Record<string, string>>

type Copy = (typeof copy)[Language]

function formatDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatNumber(value: number, language: Language) {
  return new Intl.NumberFormat(localeByLanguage[language]).format(value)
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function macroCalories(day: DailyIntake) {
  return {
    grasas: day.grasas * 9,
    carbohidratos: day.carbohidratos * 4,
    proteinas: day.proteinas * 4,
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: typeof Flame
  label: string
  value: string
  detail: string
  tone?: "default" | "green" | "gold" | "blue"
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    green: "bg-success/10 text-success",
    gold: "bg-warning/15 text-warning",
    blue: "bg-info/10 text-info",
  }[tone]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-muted-foreground">{label}</CardTitle>
        <div className={cn("rounded-md p-2", toneClass)}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function CaloriesPlot({
  plotDays,
  language,
  t,
}: {
  plotDays: Array<{ date: string; day?: DailyIntake }>
  language: Language
  t: Copy
}) {
  const currentMaxCalories = Math.max(
    ...plotDays.map((plotDay) => plotDay.day?.calorias ?? 0),
    0
  )
  const max =
    currentMaxCalories > dailyRecommendedCalories
      ? currentMaxCalories + 500
      : dailyRecommendedCalories + 1000
  const limitOffset = 100 - (dailyRecommendedCalories / max) * 100
  const recommendedCaloriesLabel = `${t.recommendedCalories}: ${formatNumber(dailyRecommendedCalories, language)} kcal`
  const points = plotDays.flatMap((plotDay, index) => {
    if (!plotDay.day) return []

    const x = plotDays.length === 1 ? 50 : index * (100 / plotDays.length) + 50 / plotDays.length
    const y = 100 - (plotDay.day.calorias / max) * 100
    return {
      day: plotDay.day,
      x,
      y,
    }
  })
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ")

  return (
    <div className="space-y-2">
      <div className="relative h-40">
        <div
          aria-label={recommendedCaloriesLabel}
          className="absolute left-0 right-0 z-20 cursor-help border-t border-dashed border-primary"
          style={{ top: `${limitOffset}%` }}
          title={recommendedCaloriesLabel}
        >
          <span className="absolute right-2 -translate-y-1/2 bg-muted/80 px-1.5 text-xs font-medium text-primary">
            {formatNumber(dailyRecommendedCalories, language)} kcal
          </span>
        </div>
        <div className="absolute inset-0 rounded-md bg-muted/60" />
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          role="img"
          aria-label={t.caloriesByDay}
        >
          <line x1="0" x2="100" y1="100" y2="100" className="stroke-border" />
          <line x1="0" x2="100" y1="66" y2="66" className="stroke-border/60" />
          <line x1="0" x2="100" y1="33" y2="33" className="stroke-border/60" />
          {polylinePoints ? (
            <polyline
              fill="none"
              points={polylinePoints}
              className="stroke-warning"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {points.map((point) => (
            <g key={point.day.fecha}>
              <title>
                {formatDate(point.day.fecha, language)} · {formatNumber(Math.round(point.day.calorias), language)} kcal
              </title>
            </g>
          ))}
        </svg>
        <div className="absolute inset-0">
          {points.map((point) => (
            <div
              key={point.day.fecha}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              <button
                aria-label={`${formatDate(point.day.fecha, language)} · ${formatNumber(Math.round(point.day.calorias), language)} kcal`}
                className="size-4 cursor-help rounded-full border-2 border-background bg-warning shadow-sm"
                title={`${formatDate(point.day.fecha, language)} · ${formatNumber(Math.round(point.day.calorias), language)} kcal`}
                type="button"
              />
              <span className="whitespace-nowrap rounded-sm bg-muted/80 px-1 text-[10px] font-medium text-foreground">
                {formatNumber(Math.round(point.day.calorias), language)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        {plotDays.map((plotDay) => (
          <span
            key={plotDay.date}
            className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground"
          >
            {formatDate(plotDay.date, language)}
          </span>
        ))}
      </div>
    </div>
  )
}

function MacroSplit({ day, t }: { day: DailyIntake; t: Copy }) {
  const macros = macroCalories(day)
  const total = macros.grasas + macros.carbohidratos + macros.proteinas || 1
  const items = [
    {
      label: t.fats,
      grams: day.grasas,
      calories: macros.grasas,
      className: "bg-warning",
    },
    {
      label: t.carbs,
      grams: day.carbohidratos,
      calories: macros.carbohidratos,
      className: "bg-info",
    },
    {
      label: t.protein,
      grams: day.proteinas,
      calories: macros.proteinas,
      className: "bg-success",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-md bg-muted">
        {items.map((item) => (
          <div
            key={item.label}
            className={item.className}
            style={{ width: `${(item.calories / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", item.className)} />
              <span>{item.label}</span>
            </div>
            <span className="text-muted-foreground">
              {Math.round(item.grams)} g · {Math.round((item.calories / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function mealTotals(entries: IntakeEntry[]) {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.momento] = (acc[entry.momento] ?? 0) + entry.calorias
    return acc
  }, {})
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseLocalDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function startOfWeek(date: Date) {
  const weekStart = new Date(date)
  const dayOffset = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - dayOffset)
  return weekStart
}

function normalizeMealMoment(moment: string) {
  return moment
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function intakeDayStatus(day: DailyIntake | undefined) {
  if (!day) return "missing"

  const loggedMeals = new Set(day.entries.map((entry) => normalizeMealMoment(entry.momento)))
  const hasEveryRequiredMeal = requiredMealMoments.every((meal) =>
    [...loggedMeals].some((loggedMeal) => loggedMeal.includes(meal))
  )

  return hasEveryRequiredMeal ? "complete" : "partial"
}

function CalendarIntakeTracker({
  days,
  selectedDate,
  onSelectDate,
  language,
  t,
}: {
  days: DailyIntake[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  language: Language
  t: Copy
}) {
  const today = new Date()
  const todayKey = dateKey(today)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const leadingEmptyDays = (monthStart.getDay() + 6) % 7
  const dayByDate = new Map(days.map((day) => [day.fecha, day]))
  const monthDays = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), index + 1)
    return {
      label: index + 1,
      key: dateKey(date),
    }
  })
  const statusClass = {
    complete: "bg-success",
    partial: "bg-warning",
    missing: "bg-red-500",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.intakeCalendar}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium">
            {new Intl.DateTimeFormat(localeByLanguage[language], {
              month: "long",
              year: "numeric",
            }).format(today)}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {weekdaysByLanguage[language].map((weekday, index) => (
            <div key={`${weekday}-${index}`} className="py-1 font-medium">
              {weekday}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: leadingEmptyDays }, (_, index) => (
            <div key={`empty-${index}`} />
          ))}
          {monthDays.map((day) => {
            const isEligible =
              day.key >= intakeTrackingStart && day.key <= todayKey
            const status = isEligible
              ? intakeDayStatus(dayByDate.get(day.key))
              : null
            const hasIntake = dayByDate.has(day.key)

            return (
              <button
                key={day.key}
                className={cn(
                  "flex aspect-square min-h-10 flex-col items-center justify-center rounded-md border border-transparent text-sm transition-colors",
                  hasIntake && "hover:border-border hover:bg-muted",
                  selectedDate === day.key && "border-primary bg-primary/10",
                  !isEligible && "text-muted-foreground/45"
                )}
                disabled={!hasIntake}
                onClick={() => onSelectDate(day.key)}
                type="button"
              >
                <span>{day.label}</span>
                {status ? (
                  <span className={cn("mt-1 size-2 rounded-full", statusClass[status])} />
                ) : null}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function mealTagClass(moment: string) {
  const normalized = normalizeMealMoment(moment)

  if (normalized.includes("desayuno")) {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
  }

  if (normalized.includes("media")) {
    return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200"
  }

  if (normalized.includes("comida")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
  }

  if (normalized.includes("merienda")) {
    return "border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200"
  }

  if (normalized.includes("cena")) {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
  }

  return "border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
}

function mealSubtotalClass(moment: string) {
  const normalized = normalizeMealMoment(moment)

  if (normalized.includes("desayuno")) {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
  }

  if (normalized.includes("media")) {
    return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
  }

  if (normalized.includes("comida")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
  }

  if (normalized.includes("merienda")) {
    return "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100"
  }

  if (normalized.includes("cena")) {
    return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
  }

  return "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100"
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const nextIsDark = storedTheme ? storedTheme === "dark" : prefersDark

    document.documentElement.classList.toggle("dark", nextIsDark)
    const frame = window.requestAnimationFrame(() => setIsDark(nextIsDark))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleTheme() {
    const nextIsDark = !isDark
    document.documentElement.classList.toggle("dark", nextIsDark)
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light")
    setIsDark(nextIsDark)
  }

  return (
    <Button
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Tema claro" : "Tema oscuro"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}

function LanguageSelector({
  language,
  onLanguageChange,
  t,
}: {
  language: Language
  onLanguageChange: (language: Language) => void
  t: Copy
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-1">
      <span className="px-2 text-xs text-muted-foreground">{t.language}</span>
      {(["ca", "es", "en"] as Language[]).map((option) => (
        <Button
          key={option}
          variant={language === option ? "default" : "ghost"}
          size="sm"
          onClick={() => onLanguageChange(option)}
        >
          {languageLabels[option]}
        </Button>
      ))}
    </div>
  )
}

function SidebarNav({
  activeView,
  onViewChange,
  t,
}: {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  t: Copy
}) {
  const itemClass = (view: DashboardView) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      activeView === view
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <aside className="border-b border-border bg-card/95 px-4 py-4 md:fixed md:inset-y-0 md:left-0 md:z-20 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-6">
        <div>
          <div className="text-lg font-semibold tracking-normal">Ffit Dash</div>
          <div className="text-sm text-muted-foreground">{t.appSubtitle}</div>
        </div>

        <nav className="space-y-6">
          <div>
            <div className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
              {t.nutrition}
            </div>
            <div className="space-y-1">
              <button
                className={itemClass("nutrition-overview")}
                onClick={() => onViewChange("nutrition-overview")}
                type="button"
              >
                <LayoutDashboard className="size-4" />
                {t.overview}
              </button>
              <button
                className={itemClass("nutrition-log")}
                onClick={() => onViewChange("nutrition-log")}
                type="button"
              >
                <List className="size-4" />
                {t.log}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
              {t.workouts}
            </div>
            <button
              className={itemClass("workouts")}
              onClick={() => onViewChange("workouts")}
              type="button"
            >
              <Dumbbell className="size-4" />
              {t.overview}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}

function IntakeTable({
  entries,
  showDate = false,
  language,
  t,
  editingNotes,
  notesStatus,
  onEditNotes,
  onCancelNotes,
  onChangeDraft,
  onSaveNotes,
}: {
  entries: IntakeEntry[]
  showDate?: boolean
  language: Language
  t: Copy
  editingNotes: Record<number, string>
  notesStatus: NotesState
  onEditNotes: (entry: IntakeEntry) => void
  onCancelNotes: (rowIndex: number) => void
  onChangeDraft: (rowIndex: number, value: string) => void
  onSaveNotes: (entry: IntakeEntry) => void
}) {
  const totals = entries.reduce(
    (acc, entry) => ({
      calorias: acc.calorias + entry.calorias,
      grasas: acc.grasas + entry.grasas,
      carbohidratos: acc.carbohidratos + entry.carbohidratos,
      proteinas: acc.proteinas + entry.proteinas,
    }),
    {
      calorias: 0,
      grasas: 0,
      carbohidratos: 0,
      proteinas: 0,
    }
  )
  const groupedEntries = entries.reduce<
    Array<{
      moment: string
      entries: IntakeEntry[]
      totals: {
        calorias: number
        grasas: number
        carbohidratos: number
        proteinas: number
      }
    }>
  >((groups, entry) => {
    let group = groups.find((item) => item.moment === entry.momento)

    if (!group) {
      group = {
        moment: entry.momento,
        entries: [],
        totals: {
          calorias: 0,
          grasas: 0,
          carbohidratos: 0,
          proteinas: 0,
        },
      }
      groups.push(group)
    }

    group.entries.push(entry)
    group.totals.calorias += entry.calorias
    group.totals.grasas += entry.grasas
    group.totals.carbohidratos += entry.carbohidratos
    group.totals.proteinas += entry.proteinas

    return groups
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="border-b text-xs uppercase text-muted-foreground">
          <tr>
            {showDate ? <th className="py-3 pr-4 font-medium">{t.tableDate}</th> : null}
            <th className="py-3 pr-4 font-medium">{t.tableMoment}</th>
            <th className="py-3 pr-4 font-medium">{t.tableFood}</th>
            <th className="py-3 pr-4 font-medium">{t.tableQuantity}</th>
            <th className="py-3 pr-4 font-medium">Kcal</th>
            <th className="py-3 pr-4 font-medium">{t.tableFat}</th>
            <th className="py-3 pr-4 font-medium">Carbs</th>
            <th className="py-3 pr-4 font-medium">{t.protein}</th>
            <th className="py-3 pr-4 font-medium">{t.tableNotes}</th>
            <th className="py-3 font-medium">{t.tableSource}</th>
          </tr>
        </thead>
        <tbody>
          {groupedEntries.map((group) => (
            <Fragment key={group.moment}>
              {group.entries.map((entry, index) => (
                <tr
                  key={`${entry.fecha}-${entry.momento}-${entry.alimento}-${index}`}
                  className="border-b last:border-0"
                >
                  {showDate ? (
                    <td className="py-3 pr-4 font-medium">
                      {formatDate(entry.fecha, language)}
                    </td>
                  ) : null}
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className={mealTagClass(entry.momento)}>
                      {entry.momento}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{entry.alimento}</div>
                    {entry.marca ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.marca}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {[entry.cantidad, entry.unidad].filter(Boolean).join(" ")}
                  </td>
                  <td className="py-3 pr-4">
                {formatNumber(Math.round(entry.calorias), language)}
                  </td>
                  <td className="py-3 pr-4">{entry.grasas} g</td>
                  <td className="py-3 pr-4">{entry.carbohidratos} g</td>
                  <td className="py-3 pr-4">{entry.proteinas} g</td>
                  <td className="min-w-[260px] max-w-[320px] py-3 pr-4">
                    {editingNotes[entry.rowIndex] !== undefined ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="min-h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                          value={editingNotes[entry.rowIndex]}
                          onChange={(event) =>
                            onChangeDraft(entry.rowIndex, event.target.value)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => onSaveNotes(entry)}
                            disabled={notesStatus[entry.rowIndex] === "saving"}
                          >
                            <Save />
                            {t.save}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelNotes(entry.rowIndex)}
                          >
                            {t.cancel}
                          </Button>
                          {notesStatus[entry.rowIndex] === "error" ? (
                            <span className="text-xs text-red-500">
                              {t.saveError}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-muted-foreground">
                          {entry.notas || "-"}
                        </span>
                        <Button
                          aria-label={`${t.editNotes} ${entry.alimento}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditNotes(entry)}
                        >
                          <Edit3 />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    {entry.url ? (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={entry.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t.source}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className={cn("border-b text-sm font-medium", mealSubtotalClass(group.moment))}>
                {showDate ? <td className="py-2 pr-4" /> : null}
                <td className="py-2 pr-4" colSpan={3}>
                  {t.subtotal} {group.moment}
                </td>
                <td className="py-2 pr-4">
                  {formatNumber(Math.round(group.totals.calorias), language)}
                </td>
                <td className="py-2 pr-4">{Math.round(group.totals.grasas)} g</td>
                <td className="py-2 pr-4">
                  {Math.round(group.totals.carbohidratos)} g
                </td>
                <td className="py-2 pr-4">{Math.round(group.totals.proteinas)} g</td>
                <td className="py-2 pr-4" />
                <td className="py-2" />
              </tr>
            </Fragment>
          ))}
        </tbody>
        <tfoot className="border-t bg-muted/50 text-sm font-semibold">
          <tr>
            {showDate ? <td className="py-3 pr-4" /> : null}
            <td className="py-3 pr-4" colSpan={3}>
              {t.dayTotal}
            </td>
            <td className="py-3 pr-4">{formatNumber(Math.round(totals.calorias), language)}</td>
            <td className="py-3 pr-4">{Math.round(totals.grasas)} g</td>
            <td className="py-3 pr-4">{Math.round(totals.carbohidratos)} g</td>
            <td className="py-3 pr-4">{Math.round(totals.proteinas)} g</td>
            <td className="py-3 pr-4" />
            <td className="py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function IntakeLogView({
  days,
  status,
  language,
  t,
  onLanguageChange,
  onShowDayDetails,
  editingNotes,
  notesStatus,
  onEditNotes,
  onCancelNotes,
  onChangeDraft,
  onSaveNotes,
}: {
  days: DailyIntake[]
  status: string
  language: Language
  t: Copy
  onLanguageChange: (language: Language) => void
  onShowDayDetails: (date: string) => void
  editingNotes: Record<number, string>
  notesStatus: NotesState
  onEditNotes: (entry: IntakeEntry) => void
  onCancelNotes: (rowIndex: number) => void
  onChangeDraft: (rowIndex: number, value: string) => void
  onSaveNotes: (entry: IntakeEntry) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{t.nutrition}</span>
            <span>{t.dailyIntakeLog}</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
            {t.intakeLog}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSelector
            language={language}
            onLanguageChange={onLanguageChange}
            t={t}
          />
          <ThemeToggle />
        </div>
      </header>

      <div className="grid gap-4">
        {[...days].reverse().map((day) => (
          <Card key={day.fecha}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{formatDate(day.fecha, language)}</CardTitle>
                <CardDescription>
                  {day.entries.length} {t.foodsRegistered}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {formatNumber(Math.round(day.calorias), language)} kcal
                </Badge>
                <Badge variant="outline">{Math.round(day.proteinas)} g {t.protein}</Badge>
                <Badge variant="outline">{Math.round(day.carbohidratos)} g {t.carbs}</Badge>
                <Badge variant="outline">{Math.round(day.grasas)} g {t.fats}</Badge>
                <Button size="sm" onClick={() => onShowDayDetails(day.fecha)}>
                  {t.allDetails}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <IntakeTable
                entries={day.entries}
                language={language}
                t={t}
                editingNotes={editingNotes}
                notesStatus={notesStatus}
                onEditNotes={onEditNotes}
                onCancelNotes={onCancelNotes}
                onChangeDraft={onChangeDraft}
                onSaveNotes={onSaveNotes}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  )
}

function DayDetailsView({
  day,
  status,
  meals,
  language,
  t,
  onLanguageChange,
  editingNotes,
  notesStatus,
  onBackToLog,
  onEditNotes,
  onCancelNotes,
  onChangeDraft,
  onSaveNotes,
}: {
  day: DailyIntake
  status: string
  meals: Record<string, number>
  language: Language
  t: Copy
  onLanguageChange: (language: Language) => void
  editingNotes: Record<number, string>
  notesStatus: NotesState
  onBackToLog: () => void
  onEditNotes: (entry: IntakeEntry) => void
  onCancelNotes: (rowIndex: number) => void
  onChangeDraft: (rowIndex: number, value: string) => void
  onSaveNotes: (entry: IntakeEntry) => void
}) {
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{t.nutrition}</span>
            <span>{t.dayDetails}</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
            {formatDate(day.fecha, language)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBackToLog}>
            <ArrowLeft />
            {t.backToLog}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw />
            {t.reloadCsv}
          </Button>
          <LanguageSelector
            language={language}
            onLanguageChange={onLanguageChange}
            t={t}
          />
          <ThemeToggle />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Flame}
          label={t.currentCalories}
          value={`${formatNumber(Math.round(day.calorias), language)} kcal`}
          detail={`${day.entries.length} ${t.foodsRegistered}`}
          tone="gold"
        />
        <StatCard
          icon={Ham}
          label={t.protein}
          value={`${Math.round(day.proteinas)} g`}
          detail={t.dayTotal}
          tone="green"
        />
        <StatCard
          icon={Wheat}
          label={t.carbs}
          value={`${Math.round(day.carbohidratos)} g`}
          detail={t.dayTotal}
          tone="blue"
        />
        <StatCard
          icon={Salad}
          label={t.fats}
          value={`${Math.round(day.grasas)} g`}
          detail={t.dayTotal}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.macroSplit}</CardTitle>
            <CardDescription>{formatDate(day.fecha, language)}</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroSplit day={day} t={t} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.byMoment}</CardTitle>
            <CardDescription>{t.selectedDayCalories}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(meals).map(([meal, calories]) => (
              <div
                key={meal}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                  mealSubtotalClass(meal)
                )}
              >
                <div className="flex items-center gap-2">
                  <Soup className="size-4" />
                  <span className="text-sm font-medium">{meal}</span>
                </div>
                <Badge variant="outline">{formatNumber(Math.round(calories), language)} kcal</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t.registeredFoods}</CardTitle>
          <CardDescription>{status}</CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeTable
            entries={day.entries}
            language={language}
            t={t}
            editingNotes={editingNotes}
            notesStatus={notesStatus}
            onEditNotes={onEditNotes}
            onCancelNotes={onCancelNotes}
            onChangeDraft={onChangeDraft}
            onSaveNotes={onSaveNotes}
          />
        </CardContent>
      </Card>
    </>
  )
}

export function IntakeDashboard() {
  const [language, setLanguage] = useState<Language>("es")
  const t = copy[language]
  const [entries, setEntries] = useState<IntakeEntry[]>([])
  const [weekStart, setWeekStart] = useState(() => dateKey(startOfWeek(new Date())))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [status, setStatus] = useState(copy.es.loadingCsv)
  const [activeView, setActiveView] = useState<DashboardView>("nutrition-overview")
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({})
  const [notesStatus, setNotesStatus] = useState<NotesState>({})

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("language")
    if (storedLanguage === "ca" || storedLanguage === "es" || storedLanguage === "en") {
      const frame = window.requestAnimationFrame(() => setLanguage(storedLanguage))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [])

  function changeLanguage(nextLanguage: Language) {
    window.localStorage.setItem("language", nextLanguage)
    setLanguage(nextLanguage)
  }

  useEffect(() => {
    async function loadCsv() {
      try {
        const response = await fetch(`${csvPath}?ts=${Date.now()}`)
        if (!response.ok) throw new Error(`CSV returned ${response.status}`)
        const csv = await response.text()
        const parsed = parseIntakeCsv(csv)
        setEntries(parsed)
        setStatus(`${parsed.length} ${t.loadedFrom} ${csvPath}`)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : t.failedCsv)
      }
    }

    loadCsv()
  }, [t])

  const days = useMemo(() => groupIntakeByDay(entries), [entries])
  const plotDays = useMemo(() => {
    const dayByDate = new Map(days.map((day) => [day.fecha, day]))
    const startDate = parseLocalDate(weekStart)

    return Array.from({ length: 7 }, (_, index) => {
      const date = dateKey(addDays(startDate, index))
      return {
        date,
        day: dayByDate.get(date),
      }
    })
  }, [days, weekStart])
  const visibleDays = useMemo(
    () => plotDays.flatMap((plotDay) => (plotDay.day ? [plotDay.day] : [])),
    [plotDays]
  )
  const latestDay = visibleDays[visibleDays.length - 1]
  const activeDay =
    days.find((day) => day.fecha === selectedDate) ??
    latestDay ??
    days[days.length - 1]

  const selectedEntries = useMemo(() => activeDay?.entries ?? [], [activeDay])
  const meals = useMemo(() => mealTotals(selectedEntries), [selectedEntries])

  const summary = useMemo(() => {
    return {
      avgCalories: average(visibleDays.map((day) => day.calorias)),
      avgFat: average(visibleDays.map((day) => day.grasas)),
      avgCarbs: average(visibleDays.map((day) => day.carbohidratos)),
      avgProtein: average(visibleDays.map((day) => day.proteinas)),
      totalFoods: visibleDays.reduce((sum, day) => sum + day.entries.length, 0),
    }
  }, [visibleDays])

  const currentWeekStart = dateKey(startOfWeek(new Date()))
  const weekEnd = dateKey(addDays(parseLocalDate(weekStart), 6))

  function editNotes(entry: IntakeEntry) {
    setEditingNotes((current) => ({
      ...current,
      [entry.rowIndex]: entry.notas,
    }))
    setNotesStatus((current) => ({
      ...current,
      [entry.rowIndex]: "idle",
    }))
  }

  function cancelNotes(rowIndex: number) {
    setEditingNotes((current) => {
      const next = { ...current }
      delete next[rowIndex]
      return next
    })
  }

  function changeNotesDraft(rowIndex: number, value: string) {
    setEditingNotes((current) => ({
      ...current,
      [rowIndex]: value,
    }))
  }

  async function saveNotes(entry: IntakeEntry) {
    const notas = editingNotes[entry.rowIndex] ?? ""

    setNotesStatus((current) => ({
      ...current,
      [entry.rowIndex]: "saving",
    }))

    try {
      const response = await fetch("/api/intake/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowIndex: entry.rowIndex,
          notas,
        }),
      })

      if (!response.ok) throw new Error("Failed to save notes")

      setEntries((current) =>
        current.map((item) =>
          item.rowIndex === entry.rowIndex ? { ...item, notas } : item
        )
      )
      cancelNotes(entry.rowIndex)
      setNotesStatus((current) => ({
        ...current,
        [entry.rowIndex]: "idle",
      }))
    } catch {
      setNotesStatus((current) => ({
        ...current,
        [entry.rowIndex]: "error",
      }))
    }
  }

  function showDayDetails(date: string) {
    setSelectedDate(date)
    setActiveView("nutrition-day")
  }

  if (!activeDay) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SidebarNav activeView={activeView} onViewChange={setActiveView} t={t} />
        <main className="flex min-h-screen items-center justify-center p-6 md:pl-64">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t.intakeRegister}</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SidebarNav activeView={activeView} onViewChange={setActiveView} t={t} />
      <main className="min-h-screen md:pl-64">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          {activeView === "nutrition-log" ? (
            <IntakeLogView
              days={days}
              status={status}
              language={language}
              t={t}
              onLanguageChange={changeLanguage}
              onShowDayDetails={showDayDetails}
              editingNotes={editingNotes}
              notesStatus={notesStatus}
              onEditNotes={editNotes}
              onCancelNotes={cancelNotes}
              onChangeDraft={changeNotesDraft}
              onSaveNotes={saveNotes}
            />
          ) : activeView === "nutrition-day" ? (
            <DayDetailsView
              day={activeDay}
              status={status}
              meals={meals}
              language={language}
              t={t}
              onLanguageChange={changeLanguage}
              editingNotes={editingNotes}
              notesStatus={notesStatus}
              onBackToLog={() => setActiveView("nutrition-log")}
              onEditNotes={editNotes}
              onCancelNotes={cancelNotes}
              onChangeDraft={changeNotesDraft}
              onSaveNotes={saveNotes}
            />
          ) : activeView === "workouts" ? (
            <div className="flex flex-col gap-4">
              <header className="border-b border-border pb-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Dumbbell className="size-4" />
                  <span>{t.workouts}</span>
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
                  {t.workouts}
                </h1>
              </header>
              <Card>
                <CardHeader>
                  <CardTitle>{t.workoutPending}</CardTitle>
                  <CardDescription>
                    {t.workoutPendingDescription}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (
            <>
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>{t.intakeRegister}</span>
              <span>{t.lastDay} {formatDate(latestDay?.fecha ?? activeDay.fecha, language)}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
              {t.caloriesAndMacros}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw />
              {t.reloadCsv}
            </Button>
            <LanguageSelector
              language={language}
              onLanguageChange={changeLanguage}
              t={t}
            />
            <ThemeToggle />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Flame}
            label={t.currentCalories}
            value={`${formatNumber(Math.round(activeDay.calorias), language)} kcal`}
            detail={`${selectedEntries.length} ${t.foodsRegistered} ${formatDate(activeDay.fecha, language)}`}
            tone="gold"
          />
          <StatCard
            icon={Ham}
            label={t.protein}
            value={`${Math.round(activeDay.proteinas)} g`}
            detail={`${Math.round(summary.avgProtein)} g ${t.average}`}
            tone="green"
          />
          <StatCard
            icon={Wheat}
            label={t.carbs}
            value={`${Math.round(activeDay.carbohidratos)} g`}
            detail={`${Math.round(summary.avgCarbs)} g ${t.average}`}
            tone="blue"
          />
          <StatCard
            icon={Salad}
            label={t.fats}
            value={`${Math.round(activeDay.grasas)} g`}
            detail={`${Math.round(summary.avgFat)} g ${t.average}`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{t.caloriesByDay}</CardTitle>
                <CardDescription>
                  {formatDate(weekStart, language)} - {formatDate(weekEnd, language)} · {t.selectedAverage}: {formatNumber(Math.round(summary.avgCalories), language)} kcal.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  aria-label={t.previousWeek}
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setWeekStart((current) =>
                      dateKey(addDays(parseLocalDate(current), -7))
                    )
                  }
                  title={t.previousWeek}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant={weekStart === currentWeekStart ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeekStart(currentWeekStart)}
                >
                  {t.currentWeek}
                </Button>
                <Button
                  aria-label={t.nextWeek}
                  variant="outline"
                  size="icon"
                  disabled={weekStart >= currentWeekStart}
                  onClick={() =>
                    setWeekStart((current) =>
                      dateKey(addDays(parseLocalDate(current), 7))
                    )
                  }
                  title={t.nextWeek}
                >
                  <ChevronRight />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CaloriesPlot plotDays={plotDays} language={language} t={t} />
              <div className="mt-4 flex flex-wrap gap-2">
                {visibleDays.map((day) => (
                  <Button
                    key={day.fecha}
                    variant={day.fecha === activeDay.fecha ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(day.fecha)}
                  >
                    {formatDate(day.fecha, language)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.macroSplit}</CardTitle>
              <CardDescription>{formatDate(activeDay.fecha, language)}</CardDescription>
            </CardHeader>
            <CardContent>
              <MacroSplit day={activeDay} t={t} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t.registeredFoods}</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent>
              <IntakeTable
                entries={selectedEntries}
                language={language}
                t={t}
                editingNotes={editingNotes}
                notesStatus={notesStatus}
                onEditNotes={editNotes}
                onCancelNotes={cancelNotes}
                onChangeDraft={changeNotesDraft}
                onSaveNotes={saveNotes}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <CalendarIntakeTracker
              days={days}
              selectedDate={activeDay.fecha}
              onSelectDate={setSelectedDate}
              language={language}
              t={t}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t.byMoment}</CardTitle>
                <CardDescription>{t.selectedDayCalories}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(meals).map(([meal, calories]) => (
                  <div key={meal} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Soup className="size-4 text-muted-foreground" />
                      <span className="text-sm">{meal}</span>
                    </div>
                    <Badge variant="outline">{formatNumber(Math.round(calories), language)} kcal</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.rangeSummary}</CardTitle>
                <CardDescription>{visibleDays.length} {t.visibleDays}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Utensils className="size-4 text-muted-foreground" />
                    {t.foods}
                  </span>
                  <span className="font-medium">{summary.totalFoods}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <PieChart className="size-4 text-muted-foreground" />
                    {t.avgCalories}
                  </span>
                  <span className="font-medium">
                    {formatNumber(Math.round(summary.avgCalories), language)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t.activeFile}: {csvPath}. {t.workoutsCsvNote}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
