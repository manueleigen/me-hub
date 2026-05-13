"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Clock } from "lucide-react"
import { mockProjects, addTimeEntry } from "@/lib/mock-data/zeiterfassung"
import type { TimeEntryFormData } from "@/types/zeiterfassung"

interface QuickEntryProps {
  onEntryAdded?: () => void
  defaultDate?: string
}

export function QuickEntry({ onEntryAdded, defaultDate }: QuickEntryProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const today = new Date().toISOString().split("T")[0]
  
  const [formData, setFormData] = useState<TimeEntryFormData>({
    date: defaultDate || today,
    project: "",
    task: "",
    hours: 1,
    description: "",
    billable: true,
    rate: 85,
    tags: [],
  })

  const handleProjectChange = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId)
    setFormData(prev => ({
      ...prev,
      project: projectId,
      rate: project?.rate || 0,
      billable: (project?.rate || 0) > 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      addTimeEntry({
        ...formData,
        tags: formData.task.toLowerCase().split(" ").slice(0, 2),
      })
      
      setOpen(false)
      setFormData({
        date: defaultDate || today,
        project: "",
        task: "",
        hours: 1,
        description: "",
        billable: true,
        rate: 85,
        tags: [],
      })
      
      onEntryAdded?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Zeit erfassen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Zeit erfassen
            </DialogTitle>
            <DialogDescription>
              Erfasse deine Arbeitszeit schnell und einfach.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Stunden</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formData.hours}
                  onChange={e => setFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Projekt</Label>
              <Select value={formData.project} onValueChange={handleProjectChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Projekt waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.client})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task">Aufgabe</Label>
              <Input
                id="task"
                value={formData.task}
                onChange={e => setFormData(prev => ({ ...prev, task: e.target.value }))}
                placeholder="z.B. Icon Set finalisiert"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Weitere Details..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="billable" className="cursor-pointer">Abrechenbar</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.billable ? `${formData.rate} EUR/h` : "Nicht abrechenbar"}
                </p>
              </div>
              <Switch
                id="billable"
                checked={formData.billable}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, billable: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.project}>
              {isSubmitting ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
