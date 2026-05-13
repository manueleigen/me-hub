"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Lightbulb } from "lucide-react"
import { addProductIdea } from "@/lib/mock-data/produkt-ideen"
import type { ProductIdeaFormData, IdeaCategory, IdeaStatus, IdeaPriority } from "@/types/produkt-ideen"
import { CATEGORY_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/produkt-ideen"

interface NewIdeaDialogProps {
  onIdeaAdded?: () => void
}

const defaultFormData: ProductIdeaFormData = {
  title: "",
  description: "",
  category: "SaaS",
  status: "idea",
  targetAudience: "",
  potentialRevenue: "",
  effortEstimate: "",
  priority: "medium",
  tags: [],
  notes: "",
}

export function NewIdeaDialog({ onIdeaAdded }: NewIdeaDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductIdeaFormData>(defaultFormData)
  const [tagsInput, setTagsInput] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      addProductIdea({
        ...formData,
        tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      })
      
      setOpen(false)
      setFormData(defaultFormData)
      setTagsInput("")
      onIdeaAdded?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Neue Idee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="size-5" />
              Neue Produktidee
            </DialogTitle>
            <DialogDescription>
              Halte deine Idee fest. Du kannst sie spaeter im Kanban-Board weiterentwickeln.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Figma-to-Code Template Pack"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Was ist die Idee? Was macht sie besonders?"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={v => setFormData(prev => ({ ...prev, category: v as IdeaCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_CONFIG) as IdeaCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioritaet</Label>
                <Select
                  value={formData.priority}
                  onValueChange={v => setFormData(prev => ({ ...prev, priority: v as IdeaPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_CONFIG) as IdeaPriority[]).map(p => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_CONFIG[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Zielgruppe</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={e => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="z.B. Freelance Designer die auch coden"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potentialRevenue">Umsatzpotenzial</Label>
                <Input
                  id="potentialRevenue"
                  value={formData.potentialRevenue}
                  onChange={e => setFormData(prev => ({ ...prev, potentialRevenue: e.target.value }))}
                  placeholder="z.B. einmalig 29-49 EUR"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="effortEstimate">Aufwand</Label>
                <Input
                  id="effortEstimate"
                  value={formData.effortEstimate}
                  onChange={e => setFormData(prev => ({ ...prev, effortEstimate: e.target.value }))}
                  placeholder="z.B. 2 Wochen"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (kommagetrennt)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="z.B. figma, templates, design"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Weitere Gedanken, Links, Konkurrenzanalyse..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title}>
              {isSubmitting ? "Speichern..." : "Idee speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
