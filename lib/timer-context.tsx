"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import type { TimerStatus, TimeSegment } from "@/types/zeiterfassung"

export interface TimerFormData {
  clientSlug: string
  clientName: string
  projectSlug: string
  projectName: string
  description: string
  hourlyRate: number
  goalHours: number
  billable: boolean
}

interface TimerContextValue {
  status: TimerStatus
  segments: TimeSegment[]
  elapsedSeconds: number
  progress: number
  hours: number
  minutes: number
  seconds: number
  pauseMinutes: number
  formData: TimerFormData
  setFormData: (updates: Partial<TimerFormData>) => void
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  reset: () => void
  updateSegment: (id: string, updates: Partial<TimeSegment>) => void
  deleteSegment: (id: string) => void
  calculateWorkMinutes: () => number
}

const TimerContext = createContext<TimerContextValue | null>(null)

const DEFAULT_FORM: TimerFormData = {
  clientSlug: "",
  clientName: "",
  projectSlug: "",
  projectName: "",
  description: "",
  hourlyRate: 85,
  goalHours: 8,
  billable: true,
}

const STORAGE_KEY = "mehub-timer-state"

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<TimerStatus>("idle")
  const [segments, setSegments] = useState<TimeSegment[]>([])
  const [currentSegmentStart, setCurrentSegmentStart] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [formData, setFormDataState] = useState<TimerFormData>(DEFAULT_FORM)
  const [hydrated, setHydrated] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Restore from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.status && saved.status !== "idle") {
          setStatus(saved.status)
          setSegments(saved.segments ?? [])
          setFormDataState(saved.formData ?? DEFAULT_FORM)
          if (saved.currentSegmentStart) {
            setCurrentSegmentStart(new Date(saved.currentSegmentStart))
          }
        }
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever relevant state changes
  useEffect(() => {
    if (!hydrated) return
    if (status !== "idle" || segments.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          status,
          segments,
          formData,
          currentSegmentStart: currentSegmentStart?.toISOString() ?? null,
        }),
      )
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [status, segments, formData, currentSegmentStart, hydrated])

  const calculateWorkMinutes = useCallback(() => {
    let total = 0
    for (const seg of segments) {
      if (seg.type === "work" && seg.endTime) {
        const [sh, sm] = seg.startTime.split(":").map(Number)
        const [eh, em] = seg.endTime.split(":").map(Number)
        total += (eh * 60 + em) - (sh * 60 + sm)
      }
    }
    return total
  }, [segments])

  // Tick interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    const baseMinutes = calculateWorkMinutes()

    if (status === "running" && currentSegmentStart) {
      intervalRef.current = setInterval(() => {
        const runningSeconds = Math.floor(
          (Date.now() - currentSegmentStart.getTime()) / 1000,
        )
        setElapsedSeconds(baseMinutes * 60 + runningSeconds)
      }, 1000)
    } else {
      setElapsedSeconds(baseMinutes * 60)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status, currentSegmentStart, segments, calculateWorkMinutes])

  const start = useCallback(() => {
    const now = new Date()
    setCurrentSegmentStart(now)
    setStatus("running")
    setSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), startTime: formatTime(now), endTime: null, type: "work" },
    ])
  }, [])

  const pause = useCallback(() => {
    const now = new Date()
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === prev.length - 1 && !seg.endTime ? { ...seg, endTime: formatTime(now) } : seg,
      ),
    )
    setSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), startTime: formatTime(now), endTime: null, type: "pause", label: "Pause" },
    ])
    setCurrentSegmentStart(null)
    setStatus("paused")
  }, [])

  const resume = useCallback(() => {
    const now = new Date()
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === prev.length - 1 && seg.type === "pause" && !seg.endTime
          ? { ...seg, endTime: formatTime(now) }
          : seg,
      ),
    )
    setSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), startTime: formatTime(now), endTime: null, type: "work" },
    ])
    setCurrentSegmentStart(now)
    setStatus("running")
  }, [])

  const stop = useCallback(() => {
    const now = new Date()
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === prev.length - 1 && !seg.endTime ? { ...seg, endTime: formatTime(now) } : seg,
      ),
    )
    setCurrentSegmentStart(null)
    setStatus("idle")
  }, [])

  const reset = useCallback(() => {
    setSegments([])
    setCurrentSegmentStart(null)
    setElapsedSeconds(0)
    setStatus("idle")
    setFormDataState(DEFAULT_FORM)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateSegment = useCallback((id: string, updates: Partial<TimeSegment>) => {
    setSegments((prev) => prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg)))
  }, [])

  const deleteSegment = useCallback((id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id))
  }, [])

  const setFormData = useCallback((updates: Partial<TimerFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...updates }))
  }, [])

  const goalSeconds = formData.goalHours * 3600
  const progress = goalSeconds > 0 ? Math.min(elapsedSeconds / goalSeconds, 1) : 0
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  const pauseMinutes = segments
    .filter((s) => s.type === "pause" && s.endTime)
    .reduce((total, seg) => {
      const [sh, sm] = seg.startTime.split(":").map(Number)
      const [eh, em] = seg.endTime!.split(":").map(Number)
      return total + (eh * 60 + em) - (sh * 60 + sm)
    }, 0)

  return (
    <TimerContext.Provider
      value={{
        status,
        segments,
        elapsedSeconds,
        progress,
        hours,
        minutes,
        seconds,
        pauseMinutes,
        formData,
        setFormData,
        start,
        pause,
        resume,
        stop,
        reset,
        updateSegment,
        deleteSegment,
        calculateWorkMinutes,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error("useTimerContext must be used within TimerProvider")
  return ctx
}
