"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { TimerStatus, TimeSegment, TrackingSession }  from "@/types/zeiterfassung"


export function useTimer(goalHours: number = 8) {
  const [status, setStatus] = useState<TimerStatus>("idle")
  const [segments, setSegments] = useState<TimeSegment[]>([])
  const [currentSegmentStart, setCurrentSegmentStart] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const goalSeconds = goalHours * 60 * 60

  // Calculate total work time from segments
  const calculateWorkMinutes = useCallback(() => {
    let total = 0
    for (const seg of segments) {
      if (seg.type === "work" && seg.endTime) {
        const [startH, startM] = seg.startTime.split(":").map(Number)
        const [endH, endM] = seg.endTime.split(":").map(Number)
        total += (endH * 60 + endM) - (startH * 60 + startM)
      }
    }
    return total
  }, [segments])

  // Update elapsed seconds based on segments + current running time
  useEffect(() => {
    const baseMinutes = calculateWorkMinutes()
    
    if (status === "running" && currentSegmentStart) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const runningSeconds = Math.floor((now.getTime() - currentSegmentStart.getTime()) / 1000)
        setElapsedSeconds(baseMinutes * 60 + runningSeconds)
      }, 1000)
    } else {
      setElapsedSeconds(baseMinutes * 60)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [status, currentSegmentStart, segments, calculateWorkMinutes])

  const formatTime = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const start = useCallback(() => {
    const now = new Date()
    setCurrentSegmentStart(now)
    setStatus("running")
    
    // Add a new work segment
    const newSegment: TimeSegment = {
      id: crypto.randomUUID(),
      startTime: formatTime(now),
      endTime: null,
      type: "work",
    }
    setSegments(prev => [...prev, newSegment])
  }, [])

  const pause = useCallback(() => {
    if (status !== "running" || !currentSegmentStart) return
    
    const now = new Date()
    
    // Close current work segment
    setSegments(prev => prev.map((seg, i) => 
      i === prev.length - 1 ? { ...seg, endTime: formatTime(now) } : seg
    ))
    
    // Add pause segment
    const pauseSegment: TimeSegment = {
      id: crypto.randomUUID(),
      startTime: formatTime(now),
      endTime: null,
      type: "pause",
      label: "Pause",
    }
    setSegments(prev => [...prev, pauseSegment])
    
    setCurrentSegmentStart(null)
    setStatus("paused")
  }, [status, currentSegmentStart])

  const resume = useCallback(() => {
    const now = new Date()
    
    // Close pause segment
    setSegments(prev => prev.map((seg, i) => 
      i === prev.length - 1 && seg.type === "pause" 
        ? { ...seg, endTime: formatTime(now) } 
        : seg
    ))
    
    // Start new work segment
    const workSegment: TimeSegment = {
      id: crypto.randomUUID(),
      startTime: formatTime(now),
      endTime: null,
      type: "work",
    }
    setSegments(prev => [...prev, workSegment])
    
    setCurrentSegmentStart(now)
    setStatus("running")
  }, [])

  const stop = useCallback(() => {
    if (!currentSegmentStart && status === "idle") return
    
    const now = new Date()
    
    // Close current segment
    setSegments(prev => prev.map((seg, i) => 
      i === prev.length - 1 && !seg.endTime 
        ? { ...seg, endTime: formatTime(now) } 
        : seg
    ))
    
    setCurrentSegmentStart(null)
    setStatus("idle")
  }, [currentSegmentStart, status])

  const reset = useCallback(() => {
    setSegments([])
    setCurrentSegmentStart(null)
    setElapsedSeconds(0)
    setStatus("idle")
  }, [])

  const updateSegment = useCallback((id: string, updates: Partial<TimeSegment>) => {
    setSegments(prev => prev.map(seg => 
      seg.id === id ? { ...seg, ...updates } : seg
    ))
  }, [])

  const deleteSegment = useCallback((id: string) => {
    setSegments(prev => prev.filter(seg => seg.id !== id))
  }, [])

  const progress = Math.min(elapsedSeconds / goalSeconds, 1)
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  return {
    status,
    segments,
    elapsedSeconds,
    progress,
    hours,
    minutes,
    seconds,
    goalHours,
    goalSeconds,
    start,
    pause,
    resume,
    stop,
    reset,
    updateSegment,
    deleteSegment,
    calculateWorkMinutes,
  }
}
