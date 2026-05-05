"use client"

import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  Edit3,
  ExternalLink,
  Flame,
  Ham,
  LayoutDashboard,
  List,
  Plus,
  PieChart,
  Salad,
  Save,
  Soup,
  Utensils,
  Wheat,
  X,
} from "lucide-react"
import Link from "next/link"

import { AccountMenu } from "@/components/account-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
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
} from "@/lib/intake"
import { cn } from "@/lib/utils"

const intakeApiPath = "/api/intake"
const intakeTrackingStart = "2026-04-27"
const requiredMealMoments = ["breakfast", "lunch", "dinner"]
const mealMomentOptions = ["Breakfast", "Lunch", "Snacks", "Dinner"]
const unitOptions = [
  { label: "Grams - g", value: "g" },
  { label: "Milliliters - ml", value: "ml" },
  { label: "Units - unit", value: "unit" },
  { label: "Servings - serving", value: "serving" },
  { label: "Tablespoons - tbsp", value: "tbsp" },
  { label: "Teaspoons - tsp", value: "tsp" },
  { label: "Cups - cup", value: "cup" },
  { label: "Slices - slice", value: "slice" },
]
const dailyRecommendedCalories = 2200

type DashboardView =
  | "nutrition-overview"
  | "nutrition-log"
  | "nutrition-day"
  | "workouts"
type EditStatus = Record<number, "idle" | "saving" | "error">
type IntakeDraft = Omit<IntakeEntry, "id" | "userId">
type FullEditorState = {
  mode: "create" | "edit" | "duplicate"
  entry?: IntakeEntry
  draft: IntakeDraft
  status: "idle" | "saving" | "error"
}
type Language = "ca" | "es" | "en"
type SessionUser = {
  id: number
  username: string
  role: "admin" | "user"
}

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
    activeFile: "Font activa",
    workoutsDataNote: "Entrenaments tindra la seva propia font de dades quan afegim aquest flux.",
    intakeCalendar: "Calendari d'ingesta",
    dailyIntakeLog: "Registre diari d'ingesta",
    intakeLog: "Registre d'ingesta",
    allDetails: "Tots els detalls",
    dayDetails: "Detalls del dia",
    backToLog: "Tornar al registre",
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
    addEntry: "Afegir entrada",
    fullEdit: "Edicio completa",
    duplicateEntry: "Duplicar entrada",
    duplicateToDay: "Duplicar al dia",
    entryEditor: "Editor d'entrada",
    newEntry: "Nova entrada",
    targetDate: "Data desti",
    brand: "Marca",
    unit: "Unitat",
    calories: "Calories",
    url: "URL",
    save: "Desar",
    cancel: "Cancel.lar",
    saveError: "Error en desar",
    editEntry: "Editar entrada de",
    login: "Iniciar sessio",
    logout: "Tancar sessio",
    username: "Usuari",
    password: "Contrasenya",
    loginRequired: "Inicia sessio per veure el teu registre d'ingesta.",
    loginError: "No s'ha pogut iniciar sessio",
    adminDashboardOnly: "Aquest compte nomes gestiona usuaris des del panell admin.",
    loadingData: "Carregant dades",
    failedData: "No s'han pogut carregar les dades",
    loadedFrom: "aliments carregats des de",
    totalRange: "Total del dia",
    workoutPending: "Tauler d'entrenaments pendent",
    workoutPendingDescription: "Aquesta seccio esta preparada per a la futura font de dades d'entrenaments.",
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
    activeFile: "Fuente activa",
    workoutsDataNote: "Workouts tendra su propia fuente de datos cuando pasemos a esa parte.",
    intakeCalendar: "Calendario de ingesta",
    dailyIntakeLog: "Registro diario de ingesta",
    intakeLog: "Registro de ingesta",
    allDetails: "Todos los detalles",
    dayDetails: "Detalles del dia",
    backToLog: "Volver al registro",
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
    addEntry: "Anadir entrada",
    fullEdit: "Edicion completa",
    duplicateEntry: "Duplicar entrada",
    duplicateToDay: "Duplicar al dia",
    entryEditor: "Editor de entrada",
    newEntry: "Nueva entrada",
    targetDate: "Fecha destino",
    brand: "Marca",
    unit: "Unidad",
    calories: "Calorias",
    url: "URL",
    save: "Guardar",
    cancel: "Cancelar",
    saveError: "Error al guardar",
    editEntry: "Editar entrada de",
    login: "Iniciar sesion",
    logout: "Cerrar sesion",
    username: "Usuario",
    password: "Contrasena",
    loginRequired: "Inicia sesion para ver tu registro de ingesta.",
    loginError: "No se pudo iniciar sesion",
    adminDashboardOnly: "Esta cuenta solo gestiona usuarios desde el panel admin.",
    loadingData: "Cargando datos",
    failedData: "No se pudieron cargar los datos",
    loadedFrom: "alimentos cargados desde",
    totalRange: "Total del dia",
    workoutPending: "Dashboard de entrenamientos pendiente",
    workoutPendingDescription: "Esta seccion esta preparada para la futura fuente de datos de entrenamientos.",
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
    byMoment: "By meal",
    selectedDayCalories: "Calories for the selected day.",
    rangeSummary: "Range summary",
    visibleDays: "visible days.",
    foods: "Foods",
    avgCalories: "Avg kcal",
    activeFile: "Active source",
    workoutsDataNote: "Workouts will get its own data source when we add that flow.",
    intakeCalendar: "Intake calendar",
    dailyIntakeLog: "Daily intake log",
    intakeLog: "Intake Log",
    allDetails: "All details",
    dayDetails: "Day details",
    backToLog: "Back to log",
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
    addEntry: "Add entry",
    fullEdit: "Full edit",
    duplicateEntry: "Duplicate entry",
    duplicateToDay: "Duplicate to day",
    entryEditor: "Entry editor",
    newEntry: "New entry",
    targetDate: "Target date",
    brand: "Brand",
    unit: "Unit",
    calories: "Calories",
    url: "URL",
    save: "Save",
    cancel: "Cancel",
    saveError: "Save failed",
    editEntry: "Edit entry for",
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    loginRequired: "Log in to view your intake register.",
    loginError: "Could not log in",
    adminDashboardOnly: "This account only manages users from the admin panel.",
    loadingData: "Loading data",
    failedData: "Could not load data",
    loadedFrom: "foods loaded from",
    totalRange: "Day total",
    workoutPending: "Workout dashboard pending",
    workoutPendingDescription: "This section is ready for the future workouts data source.",
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
    fat: day.fat * 9,
    carbs: day.carbs * 4,
    protein: day.protein * 4,
  }
}

function draftFromEntry(entry: IntakeEntry): IntakeDraft {
  return {
    date: entry.date,
    meal: entry.meal,
    food: entry.food,
    quantity: entry.quantity,
    unit: entry.unit,
    brand: entry.brand,
    calories: entry.calories,
    fat: entry.fat,
    carbs: entry.carbs,
    protein: entry.protein,
    url: entry.url,
    notes: entry.notes,
  }
}

function emptyDraft(date: string): IntakeDraft {
  return {
    date,
    meal: "",
    food: "",
    quantity: "",
    unit: "",
    brand: "",
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    url: "",
    notes: "",
  }
}

function numericDraftValue(value: number) {
  return Number.isFinite(value) ? String(value) : ""
}

function parseDraftNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
    ...plotDays.map((plotDay) => plotDay.day?.calories ?? 0),
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
    const y = 100 - (plotDay.day.calories / max) * 100
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
            <g key={point.day.date}>
              <title>
                {formatDate(point.day.date, language)} · {formatNumber(Math.round(point.day.calories), language)} kcal
              </title>
            </g>
          ))}
        </svg>
        <div className="absolute inset-0">
          {points.map((point) => (
            <div
              key={point.day.date}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              <button
                aria-label={`${formatDate(point.day.date, language)} · ${formatNumber(Math.round(point.day.calories), language)} kcal`}
                className="size-4 cursor-help rounded-full border-2 border-background bg-warning shadow-sm"
                title={`${formatDate(point.day.date, language)} · ${formatNumber(Math.round(point.day.calories), language)} kcal`}
                type="button"
              />
              <span className="whitespace-nowrap rounded-sm bg-muted/80 px-1 text-[10px] font-medium text-foreground">
                {formatNumber(Math.round(point.day.calories), language)}
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
  const total = macros.fat + macros.carbs + macros.protein || 1
  const items = [
    {
      label: t.fats,
      grams: day.fat,
      calories: macros.fat,
      className: "bg-warning",
    },
    {
      label: t.carbs,
      grams: day.carbs,
      calories: macros.carbs,
      className: "bg-info",
    },
    {
      label: t.protein,
      grams: day.protein,
      calories: macros.protein,
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
    acc[entry.meal] = (acc[entry.meal] ?? 0) + entry.calories
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

  const loggedMeals = new Set(day.entries.map((entry) => normalizeMealMoment(entry.meal)))
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
  const dayByDate = new Map(days.map((day) => [day.date, day]))
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

  if (normalized.includes("breakfast") || normalized.includes("desayuno")) {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
  }

  if (normalized.includes("snack") || normalized.includes("media")) {
    return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200"
  }

  if (normalized.includes("lunch") || normalized.includes("comida")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
  }

  if (normalized.includes("snack") || normalized.includes("merienda")) {
    return "border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200"
  }

  if (normalized.includes("dinner") || normalized.includes("cena")) {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
  }

  return "border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
}

function mealSubtotalClass(moment: string) {
  const normalized = normalizeMealMoment(moment)

  if (normalized.includes("breakfast") || normalized.includes("desayuno")) {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
  }

  if (normalized.includes("snack") || normalized.includes("media")) {
    return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
  }

  if (normalized.includes("lunch") || normalized.includes("comida")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
  }

  if (normalized.includes("snack") || normalized.includes("merienda")) {
    return "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100"
  }

  if (normalized.includes("dinner") || normalized.includes("cena")) {
    return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
  }

  return "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100"
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

function inputClass() {
  return "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
}

function EntryEditor({
  editor,
  t,
  onChange,
  onClose,
  onSave,
}: {
  editor: FullEditorState
  t: Copy
  onChange: (field: keyof IntakeDraft, value: string | number) => void
  onClose: () => void
  onSave: () => void
}) {
  const title =
    editor.mode === "create"
      ? t.newEntry
      : editor.mode === "duplicate"
        ? t.duplicateToDay
        : t.entryEditor
  const saveLabel = editor.mode === "edit" ? t.save : t.addEntry

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-md border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
            <p className="text-sm text-muted-foreground">{t.entryEditor}</p>
          </div>
          <Button
            aria-label={t.cancel}
            onClick={onClose}
            size="icon"
            title={t.cancel}
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>

        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5">
          <label className="grid gap-1 text-sm">
            {editor.mode === "duplicate" ? t.targetDate : t.tableDate}
            <input
              className={inputClass()}
              type="date"
              value={editor.draft.date}
              onChange={(event) => onChange("date", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.tableMoment}
            <select
              className={inputClass()}
              value={editor.draft.meal}
              onChange={(event) => onChange("meal", event.target.value)}
            >
              <option value="" disabled>
                {t.tableMoment}
              </option>
              {mealMomentOptions.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {t.tableFood}
            <input
              className={inputClass()}
              value={editor.draft.food}
              onChange={(event) => onChange("food", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.brand}
            <input
              className={inputClass()}
              value={editor.draft.brand}
              onChange={(event) => onChange("brand", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.tableQuantity}
            <input
              className={inputClass()}
              value={editor.draft.quantity}
              onChange={(event) => onChange("quantity", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.unit}
            <select
              className={inputClass()}
              value={editor.draft.unit}
              onChange={(event) => onChange("unit", event.target.value)}
            >
              <option value="" disabled>
                {t.unit}
              </option>
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {t.calories}
            <input
              className={inputClass()}
              min="0"
              type="number"
              value={numericDraftValue(editor.draft.calories)}
              onChange={(event) =>
                onChange("calories", parseDraftNumber(event.target.value))
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.tableFat}
            <input
              className={inputClass()}
              min="0"
              step="0.1"
              type="number"
              value={numericDraftValue(editor.draft.fat)}
              onChange={(event) => onChange("fat", parseDraftNumber(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Carbs
            <input
              className={inputClass()}
              min="0"
              step="0.1"
              type="number"
              value={numericDraftValue(editor.draft.carbs)}
              onChange={(event) => onChange("carbs", parseDraftNumber(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            {t.protein}
            <input
              className={inputClass()}
              min="0"
              step="0.1"
              type="number"
              value={numericDraftValue(editor.draft.protein)}
              onChange={(event) => onChange("protein", parseDraftNumber(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            {t.url}
            <input
              className={inputClass()}
              value={editor.draft.url}
              onChange={(event) => onChange("url", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            {t.tableNotes}
            <textarea
              className="min-h-28 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              value={editor.draft.notes}
              onChange={(event) => onChange("notes", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          {editor.status === "error" ? (
            <span className="text-sm text-red-500">{t.saveError}</span>
          ) : null}
          <Button onClick={onClose} type="button" variant="outline">
            {t.cancel}
          </Button>
          <Button
            disabled={editor.status === "saving"}
            onClick={onSave}
            type="button"
          >
            <Save />
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TopBar({ user }: { user: SessionUser | null }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
      <Link
        className="text-lg font-semibold tracking-normal transition-colors hover:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/"
      >
        FFIT
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AccountMenu user={user} />
      </div>
    </header>
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
    <aside className="border-b border-border bg-card/95 px-4 py-4 md:fixed md:bottom-0 md:left-0 md:top-[65px] md:z-20 md:w-64 md:border-b-0 md:border-r">
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
  canEdit,
  duplicateTargetDate,
  editingEntries,
  editStatus,
  onEditEntry,
  onFullEditEntry,
  onDuplicateEntry,
  onCancelEdit,
  onChangeDraft,
  onSaveEntry,
}: {
  entries: IntakeEntry[]
  showDate?: boolean
  language: Language
  t: Copy
  canEdit: boolean
  duplicateTargetDate?: string
  editingEntries: Record<number, IntakeDraft>
  editStatus: EditStatus
  onEditEntry: (entry: IntakeEntry) => void
  onFullEditEntry: (entry: IntakeEntry) => void
  onDuplicateEntry: (entry: IntakeEntry) => void
  onCancelEdit: (id: number) => void
  onChangeDraft: (
    id: number,
    field: keyof IntakeDraft,
    value: string | number
  ) => void
  onSaveEntry: (entry: IntakeEntry) => void
}) {
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      fat: acc.fat + entry.fat,
      carbs: acc.carbs + entry.carbs,
      protein: acc.protein + entry.protein,
    }),
    {
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    }
  )
  const groupedEntries = entries.reduce<
    Array<{
      moment: string
      entries: IntakeEntry[]
      totals: {
        calories: number
        fat: number
        carbs: number
        protein: number
      }
    }>
  >((groups, entry) => {
    let group = groups.find((item) => item.moment === entry.meal)

    if (!group) {
      group = {
        moment: entry.meal,
        entries: [],
        totals: {
          calories: 0,
          fat: 0,
          carbs: 0,
          protein: 0,
        },
      }
      groups.push(group)
    }

    group.entries.push(entry)
    group.totals.calories += entry.calories
    group.totals.fat += entry.fat
    group.totals.carbs += entry.carbs
    group.totals.protein += entry.protein

    return groups
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
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
                  key={`${entry.id}-${index}`}
                  className="border-b last:border-0"
                >
                  {(() => {
                    const draft = editingEntries[entry.id]
                    const isEditing = draft !== undefined

                    return (
                      <>
                        {showDate ? (
                          <td className="py-3 pr-4 font-medium">
                            {isEditing ? (
                              <input
                                className="h-9 w-36 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                type="date"
                                value={draft.date}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "date", event.target.value)
                                }
                              />
                            ) : (
                              formatDate(entry.date, language)
                            )}
                          </td>
                        ) : null}
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="flex min-w-36 flex-col gap-2">
                              {!showDate ? (
                                <input
                                  className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                  type="date"
                                  value={draft.date}
                                  onChange={(event) =>
                                    onChangeDraft(entry.id, "date", event.target.value)
                                  }
                                />
                              ) : null}
                              <select
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.meal}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "meal", event.target.value)
                                }
                              >
                                <option value="" disabled>
                                  {t.tableMoment}
                                </option>
                                {mealMomentOptions.map((meal) => (
                                  <option key={meal} value={meal}>
                                    {meal}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <Badge variant="outline" className={mealTagClass(entry.meal)}>
                              {entry.meal}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="flex min-w-44 flex-col gap-2">
                              <input
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.food}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "food", event.target.value)
                                }
                              />
                              <input
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.brand}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "brand", event.target.value)
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{entry.food}</div>
                              {entry.brand ? (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {entry.brand}
                                </div>
                              ) : null}
                            </>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="grid min-w-40 grid-cols-2 gap-2">
                              <input
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.quantity}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "quantity", event.target.value)
                                }
                              />
                              <select
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.unit}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "unit", event.target.value)
                                }
                              >
                                <option value="" disabled>
                                  {t.unit}
                                </option>
                                {unitOptions.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            [entry.quantity, entry.unit].filter(Boolean).join(" ")
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              className="h-9 w-24 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              min="0"
                              type="number"
                              value={numericDraftValue(draft.calories)}
                              onChange={(event) =>
                                onChangeDraft(
                                  entry.id,
                                  "calories",
                                  parseDraftNumber(event.target.value)
                                )
                              }
                            />
                          ) : (
                            formatNumber(Math.round(entry.calories), language)
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              min="0"
                              step="0.1"
                              type="number"
                              value={numericDraftValue(draft.fat)}
                              onChange={(event) =>
                                onChangeDraft(entry.id, "fat", parseDraftNumber(event.target.value))
                              }
                            />
                          ) : (
                            `${entry.fat} g`
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              min="0"
                              step="0.1"
                              type="number"
                              value={numericDraftValue(draft.carbs)}
                              onChange={(event) =>
                                onChangeDraft(entry.id, "carbs", parseDraftNumber(event.target.value))
                              }
                            />
                          ) : (
                            `${entry.carbs} g`
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              min="0"
                              step="0.1"
                              type="number"
                              value={numericDraftValue(draft.protein)}
                              onChange={(event) =>
                                onChangeDraft(
                                  entry.id,
                                  "protein",
                                  parseDraftNumber(event.target.value)
                                )
                              }
                            />
                          ) : (
                            `${entry.protein} g`
                          )}
                        </td>
                        <td className="min-w-[260px] max-w-[320px] py-3 pr-4">
                          {isEditing ? (
                            <textarea
                              className="min-h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              value={draft.notes}
                              onChange={(event) =>
                                onChangeDraft(entry.id, "notes", event.target.value)
                              }
                            />
                          ) : (
                            <span className="line-clamp-2 text-muted-foreground">
                              {entry.notes || "-"}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {isEditing ? (
                            <div className="flex min-w-48 flex-col gap-2">
                              <input
                                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                value={draft.url}
                                onChange={(event) =>
                                  onChangeDraft(entry.id, "url", event.target.value)
                                }
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => onSaveEntry(entry)}
                                  disabled={editStatus[entry.id] === "saving"}
                                >
                                  <Save />
                                  {t.save}
                                </Button>
                                <Button
                                  aria-label={t.cancel}
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onCancelEdit(entry.id)}
                                  title={t.cancel}
                                >
                                  <X />
                                </Button>
                                {editStatus[entry.id] === "error" ? (
                                  <span className="text-xs text-red-500">
                                    {t.saveError}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
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
                              {canEdit ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    aria-label={`${t.editEntry} ${entry.food}`}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEditEntry(entry)}
                                    title={`${t.editEntry} ${entry.food}`}
                                  >
                                    <Edit3 />
                                  </Button>
                                  <Button
                                    aria-label={`${t.fullEdit} ${entry.food}`}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onFullEditEntry(entry)}
                                    title={`${t.fullEdit} ${entry.food}`}
                                  >
                                    <List />
                                  </Button>
                                  <Button
                                    aria-label={`${t.duplicateEntry} ${entry.food}`}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      onDuplicateEntry({
                                        ...entry,
                                        date: duplicateTargetDate ?? entry.date,
                                      })
                                    }
                                    title={`${t.duplicateEntry} ${entry.food}`}
                                  >
                                    <Copy />
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </>
                    )
                  })()}
                </tr>
              ))}
              <tr className={cn("border-b text-sm font-medium", mealSubtotalClass(group.moment))}>
                {showDate ? <td className="py-2 pr-4" /> : null}
                <td className="py-2 pr-4" colSpan={3}>
                  {t.subtotal} {group.moment}
                </td>
                <td className="py-2 pr-4">
                  {formatNumber(Math.round(group.totals.calories), language)}
                </td>
                <td className="py-2 pr-4">{Math.round(group.totals.fat)} g</td>
                <td className="py-2 pr-4">
                  {Math.round(group.totals.carbs)} g
                </td>
                <td className="py-2 pr-4">{Math.round(group.totals.protein)} g</td>
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
            <td className="py-3 pr-4">{formatNumber(Math.round(totals.calories), language)}</td>
            <td className="py-3 pr-4">{Math.round(totals.fat)} g</td>
            <td className="py-3 pr-4">{Math.round(totals.carbs)} g</td>
            <td className="py-3 pr-4">{Math.round(totals.protein)} g</td>
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
  onAddEntry,
  canEdit,
  editingEntries,
  editStatus,
  onEditEntry,
  onFullEditEntry,
  onDuplicateEntry,
  onCancelEdit,
  onChangeDraft,
  onSaveEntry,
}: {
  days: DailyIntake[]
  status: string
  language: Language
  t: Copy
  onLanguageChange: (language: Language) => void
  onShowDayDetails: (date: string) => void
  onAddEntry: (date: string) => void
  canEdit: boolean
  editingEntries: Record<number, IntakeDraft>
  editStatus: EditStatus
  onEditEntry: (entry: IntakeEntry) => void
  onFullEditEntry: (entry: IntakeEntry) => void
  onDuplicateEntry: (entry: IntakeEntry) => void
  onCancelEdit: (id: number) => void
  onChangeDraft: (
    id: number,
    field: keyof IntakeDraft,
    value: string | number
  ) => void
  onSaveEntry: (entry: IntakeEntry) => void
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
        </div>
      </header>

      <div className="grid gap-4">
        {[...days].reverse().map((day) => (
          <Card key={day.date}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{formatDate(day.date, language)}</CardTitle>
                <CardDescription>
                  {day.entries.length} {t.foodsRegistered}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {formatNumber(Math.round(day.calories), language)} kcal
                </Badge>
                <Badge variant="outline">{Math.round(day.protein)} g {t.protein}</Badge>
                <Badge variant="outline">{Math.round(day.carbs)} g {t.carbs}</Badge>
                <Badge variant="outline">{Math.round(day.fat)} g {t.fats}</Badge>
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddEntry(day.date)}
                  >
                    <Plus />
                    {t.addEntry}
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => onShowDayDetails(day.date)}>
                  {t.allDetails}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <IntakeTable
                entries={day.entries}
                language={language}
                t={t}
                canEdit={canEdit}
                duplicateTargetDate={day.date}
                editingEntries={editingEntries}
                editStatus={editStatus}
                onEditEntry={onEditEntry}
                onFullEditEntry={onFullEditEntry}
                onDuplicateEntry={onDuplicateEntry}
                onCancelEdit={onCancelEdit}
                onChangeDraft={onChangeDraft}
                onSaveEntry={onSaveEntry}
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
  canEdit,
  editingEntries,
  editStatus,
  onBackToLog,
  onAddEntry,
  onEditEntry,
  onFullEditEntry,
  onDuplicateEntry,
  onCancelEdit,
  onChangeDraft,
  onSaveEntry,
}: {
  day: DailyIntake
  status: string
  meals: Record<string, number>
  language: Language
  t: Copy
  onLanguageChange: (language: Language) => void
  canEdit: boolean
  editingEntries: Record<number, IntakeDraft>
  editStatus: EditStatus
  onBackToLog: () => void
  onAddEntry: (date: string) => void
  onEditEntry: (entry: IntakeEntry) => void
  onFullEditEntry: (entry: IntakeEntry) => void
  onDuplicateEntry: (entry: IntakeEntry) => void
  onCancelEdit: (id: number) => void
  onChangeDraft: (
    id: number,
    field: keyof IntakeDraft,
    value: string | number
  ) => void
  onSaveEntry: (entry: IntakeEntry) => void
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
            {formatDate(day.date, language)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddEntry(day.date)}
            >
              <Plus />
              {t.addEntry}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onBackToLog}>
            <ArrowLeft />
            {t.backToLog}
          </Button>
          <LanguageSelector
            language={language}
            onLanguageChange={onLanguageChange}
            t={t}
          />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Flame}
          label={t.currentCalories}
          value={`${formatNumber(Math.round(day.calories), language)} kcal`}
          detail={`${day.entries.length} ${t.foodsRegistered}`}
          tone="gold"
        />
        <StatCard
          icon={Ham}
          label={t.protein}
          value={`${Math.round(day.protein)} g`}
          detail={t.dayTotal}
          tone="green"
        />
        <StatCard
          icon={Wheat}
          label={t.carbs}
          value={`${Math.round(day.carbs)} g`}
          detail={t.dayTotal}
          tone="blue"
        />
        <StatCard
          icon={Salad}
          label={t.fats}
          value={`${Math.round(day.fat)} g`}
          detail={t.dayTotal}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.macroSplit}</CardTitle>
            <CardDescription>{formatDate(day.date, language)}</CardDescription>
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
            canEdit={canEdit}
            duplicateTargetDate={day.date}
            editingEntries={editingEntries}
            editStatus={editStatus}
            onEditEntry={onEditEntry}
            onFullEditEntry={onFullEditEntry}
            onDuplicateEntry={onDuplicateEntry}
            onCancelEdit={onCancelEdit}
            onChangeDraft={onChangeDraft}
            onSaveEntry={onSaveEntry}
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
  const [status, setStatus] = useState(copy.es.loadingData)
  const [activeView, setActiveView] = useState<DashboardView>("nutrition-overview")
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginMessage, setLoginMessage] = useState("")
  const [canEdit, setCanEdit] = useState(false)
  const [editingEntries, setEditingEntries] = useState<Record<number, IntakeDraft>>({})
  const [editStatus, setEditStatus] = useState<EditStatus>({})
  const [entryEditor, setEntryEditor] = useState<FullEditorState | null>(null)

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

  const loadIntakeEntries = useCallback(async () => {
    try {
      const response = await fetch(`${intakeApiPath}?ts=${Date.now()}`)
      if (!response.ok) throw new Error(`Intake API returned ${response.status}`)
      const payload = (await response.json()) as {
        entries: IntakeEntry[]
        source: string
      }
      setEntries(payload.entries)
      setStatus(`${payload.entries.length} ${t.loadedFrom} ${payload.source}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.failedData)
    }
  }, [t])

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" })
      if (!response.ok) throw new Error("Session request failed")

      const payload = (await response.json()) as {
        user: SessionUser | null
      }
      setSessionUser(payload.user)
      setCanEdit(payload.user?.role === "user")
      if (payload.user?.role === "user") {
        setActiveView("nutrition-overview")
        await loadIntakeEntries()
      } else if (payload.user?.role === "admin") {
        setEntries([])
        setStatus(t.adminDashboardOnly)
        window.location.replace("/admin")
      } else {
        setEntries([])
        setStatus(t.loginRequired)
      }
    } catch {
      setSessionUser(null)
      setCanEdit(false)
      setEntries([])
      setStatus(t.loginRequired)
    } finally {
      setSessionLoaded(true)
    }
  }, [loadIntakeEntries, t])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadSession()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loadSession])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginMessage("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      })

      if (!response.ok) throw new Error(t.loginError)

      setLoginPassword("")
      await loadSession()
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : t.loginError)
    }
  }

  const days = useMemo(() => groupIntakeByDay(entries), [entries])
  const plotDays = useMemo(() => {
    const dayByDate = new Map(days.map((day) => [day.date, day]))
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
    days.find((day) => day.date === selectedDate) ??
    latestDay ??
    days[days.length - 1]

  const selectedEntries = useMemo(() => activeDay?.entries ?? [], [activeDay])
  const meals = useMemo(() => mealTotals(selectedEntries), [selectedEntries])

  const summary = useMemo(() => {
    return {
      avgCalories: average(visibleDays.map((day) => day.calories)),
      avgFat: average(visibleDays.map((day) => day.fat)),
      avgCarbs: average(visibleDays.map((day) => day.carbs)),
      avgProtein: average(visibleDays.map((day) => day.protein)),
      totalFoods: visibleDays.reduce((sum, day) => sum + day.entries.length, 0),
    }
  }, [visibleDays])

  const currentWeekStart = dateKey(startOfWeek(new Date()))
  const weekEnd = dateKey(addDays(parseLocalDate(weekStart), 6))

  function editEntry(entry: IntakeEntry) {
    setEditingEntries((current) => ({
      ...current,
      [entry.id]: draftFromEntry(entry),
    }))
    setEditStatus((current) => ({
      ...current,
      [entry.id]: "idle",
    }))
  }

  function openCreateEntry(date: string) {
    setEntryEditor({
      mode: "create",
      draft: emptyDraft(date),
      status: "idle",
    })
  }

  function openFullEditEntry(entry: IntakeEntry) {
    setEntryEditor({
      mode: "edit",
      entry,
      draft: draftFromEntry(entry),
      status: "idle",
    })
  }

  function openDuplicateEntry(entry: IntakeEntry) {
    setEntryEditor({
      mode: "duplicate",
      entry,
      draft: {
        ...draftFromEntry(entry),
        date: activeDay?.date ?? entry.date,
      },
      status: "idle",
    })
  }

  function changeFullEditorDraft(field: keyof IntakeDraft, value: string | number) {
    setEntryEditor((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
            },
            status: "idle",
          }
        : current
    )
  }

  function cancelEdit(id: number) {
    setEditingEntries((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function changeEntryDraft(
    id: number,
    field: keyof IntakeDraft,
    value: string | number
  ) {
    setEditingEntries((current) => {
      const draft = current[id]
      if (!draft) return current

      return {
        ...current,
        [id]: {
          ...draft,
          [field]: value,
        },
      }
    })
  }

  async function saveEntry(entry: IntakeEntry) {
    const draft = editingEntries[entry.id]
    if (!draft) return

    setEditStatus((current) => ({
      ...current,
      [entry.id]: "saving",
    }))

    try {
      const response = await fetch(intakeApiPath, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: entry.id,
          ...draft,
        }),
      })

      if (!response.ok) throw new Error("Failed to save entry")

      const payload = (await response.json()) as { entry: IntakeEntry }

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? payload.entry : item
        )
      )
      cancelEdit(entry.id)
      setEditStatus((current) => ({
        ...current,
        [entry.id]: "idle",
      }))
    } catch {
      setEditStatus((current) => ({
        ...current,
        [entry.id]: "error",
      }))
    }
  }

  async function saveFullEditorEntry() {
    if (!entryEditor) return

    setEntryEditor((current) =>
      current ? { ...current, status: "saving" } : current
    )

    try {
      const editEntryTarget =
        entryEditor.mode === "edit" ? entryEditor.entry : undefined
      const isEdit = Boolean(editEntryTarget)
      if (entryEditor.mode === "edit" && !editEntryTarget) {
        throw new Error("Missing entry")
      }
      const body =
        editEntryTarget !== undefined
          ? {
              id: editEntryTarget.id,
              ...entryEditor.draft,
            }
          : entryEditor.draft
      const response = await fetch(intakeApiPath, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to save entry")

      const payload = (await response.json()) as { entry: IntakeEntry }

      setEntries((current) =>
        isEdit
          ? current.map((item) =>
              item.id === payload.entry.id ? payload.entry : item
            )
          : [...current, payload.entry]
      )
      if (!isEdit) {
        setSelectedDate(payload.entry.date)
      }
      setEntryEditor(null)
    } catch {
      setEntryEditor((current) =>
        current ? { ...current, status: "error" } : current
      )
    }
  }

  function showDayDetails(date: string) {
    setSelectedDate(date)
    setActiveView("nutrition-day")
  }

  if (!sessionLoaded || !sessionUser) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar user={sessionUser} />
        <main className="flex min-h-[calc(100vh-65px)] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t.login}</CardTitle>
              <CardDescription>
                {sessionLoaded ? t.loginRequired : t.loadingData}
              </CardDescription>
            </CardHeader>
            {sessionLoaded ? (
              <CardContent>
                <form className="grid gap-3" onSubmit={login}>
                  <label className="grid gap-1 text-sm">
                    {t.username}
                    <input
                      className={inputClass()}
                      value={loginUsername}
                      onChange={(event) => setLoginUsername(event.target.value)}
                      autoComplete="username"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    {t.password}
                    <input
                      className={inputClass()}
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      type="password"
                      autoComplete="current-password"
                    />
                  </label>
                  <Button type="submit">{t.login}</Button>
                  {loginMessage ? (
                    <p className="text-sm text-red-500">{loginMessage}</p>
                  ) : null}
                </form>
              </CardContent>
            ) : null}
          </Card>
        </main>
      </div>
    )
  }

  if (sessionUser.role === "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar user={sessionUser} />
        <main className="flex min-h-[calc(100vh-65px)] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t.intakeRegister}</CardTitle>
              <CardDescription>{t.adminDashboardOnly}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  if (!activeDay) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar user={sessionUser} />
        <SidebarNav activeView={activeView} onViewChange={setActiveView} t={t} />
        <main className="flex min-h-[calc(100vh-65px)] items-center justify-center p-6 md:pl-64">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t.intakeRegister}</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            {canEdit ? (
              <CardContent>
                <Button onClick={() => openCreateEntry(dateKey(new Date()))}>
                  <Plus />
                  {t.addEntry}
                </Button>
              </CardContent>
            ) : null}
          </Card>
        </main>
        {entryEditor ? (
          <EntryEditor
            editor={entryEditor}
            t={t}
            onChange={changeFullEditorDraft}
            onClose={() => setEntryEditor(null)}
            onSave={saveFullEditorEntry}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar user={sessionUser} />
      <SidebarNav activeView={activeView} onViewChange={setActiveView} t={t} />
      <main className="min-h-[calc(100vh-65px)] md:pl-64">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          {activeView === "nutrition-log" ? (
            <IntakeLogView
              days={days}
              status={status}
              language={language}
              t={t}
              onLanguageChange={changeLanguage}
              onShowDayDetails={showDayDetails}
              onAddEntry={openCreateEntry}
              canEdit={canEdit}
              editingEntries={editingEntries}
              editStatus={editStatus}
              onEditEntry={editEntry}
              onFullEditEntry={openFullEditEntry}
              onDuplicateEntry={openDuplicateEntry}
              onCancelEdit={cancelEdit}
              onChangeDraft={changeEntryDraft}
              onSaveEntry={saveEntry}
            />
          ) : activeView === "nutrition-day" ? (
            <DayDetailsView
              day={activeDay}
              status={status}
              meals={meals}
              language={language}
              t={t}
              onLanguageChange={changeLanguage}
              canEdit={canEdit}
              editingEntries={editingEntries}
              editStatus={editStatus}
              onBackToLog={() => setActiveView("nutrition-log")}
              onAddEntry={openCreateEntry}
              onEditEntry={editEntry}
              onFullEditEntry={openFullEditEntry}
              onDuplicateEntry={openDuplicateEntry}
              onCancelEdit={cancelEdit}
              onChangeDraft={changeEntryDraft}
              onSaveEntry={saveEntry}
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
              <span>{t.lastDay} {formatDate(latestDay?.date ?? activeDay.date, language)}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
              {t.caloriesAndMacros}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector
              language={language}
              onLanguageChange={changeLanguage}
              t={t}
            />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Flame}
            label={t.currentCalories}
            value={`${formatNumber(Math.round(activeDay.calories), language)} kcal`}
            detail={`${selectedEntries.length} ${t.foodsRegistered} ${formatDate(activeDay.date, language)}`}
            tone="gold"
          />
          <StatCard
            icon={Ham}
            label={t.protein}
            value={`${Math.round(activeDay.protein)} g`}
            detail={`${Math.round(summary.avgProtein)} g ${t.average}`}
            tone="green"
          />
          <StatCard
            icon={Wheat}
            label={t.carbs}
            value={`${Math.round(activeDay.carbs)} g`}
            detail={`${Math.round(summary.avgCarbs)} g ${t.average}`}
            tone="blue"
          />
          <StatCard
            icon={Salad}
            label={t.fats}
            value={`${Math.round(activeDay.fat)} g`}
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
                    key={day.date}
                    variant={day.date === activeDay.date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(day.date)}
                  >
                    {formatDate(day.date, language)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.macroSplit}</CardTitle>
              <CardDescription>{formatDate(activeDay.date, language)}</CardDescription>
            </CardHeader>
            <CardContent>
              <MacroSplit day={activeDay} t={t} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{t.registeredFoods}</CardTitle>
                <CardDescription>{status}</CardDescription>
              </div>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateEntry(activeDay.date)}
                >
                  <Plus />
                  {t.addEntry}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <IntakeTable
                entries={selectedEntries}
                language={language}
                t={t}
                canEdit={canEdit}
                duplicateTargetDate={activeDay.date}
                editingEntries={editingEntries}
                editStatus={editStatus}
                onEditEntry={editEntry}
                onFullEditEntry={openFullEditEntry}
                onDuplicateEntry={openDuplicateEntry}
                onCancelEdit={cancelEdit}
                onChangeDraft={changeEntryDraft}
                onSaveEntry={saveEntry}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <CalendarIntakeTracker
              days={days}
              selectedDate={activeDay.date}
              onSelectDate={showDayDetails}
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
                  {status}. {t.workoutsDataNote}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
            </>
          )}
        </div>
      </main>
      {entryEditor ? (
        <EntryEditor
          editor={entryEditor}
          t={t}
          onChange={changeFullEditorDraft}
          onClose={() => setEntryEditor(null)}
          onSave={saveFullEditorEntry}
        />
      ) : null}
    </div>
  )
}
