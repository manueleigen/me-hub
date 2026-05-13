"use client"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { ProductIdea } from "@/types/produkt-ideen"
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/produkt-ideen"
import { cn } from "@/lib/utils"

interface IdeaDetailDialogProps {
  idea: ProductIdea | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IdeaDetailDialog({ idea, open, onOpenChange }: IdeaDetailDialogProps) {
  if (!idea) return null

  const statusConfig = STATUS_CONFIG[idea.status]
  const priorityConfig = PRIORITY_CONFIG[idea.priority]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("text-white", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <Badge variant="outline">{idea.category}</Badge>
          </div>
          <DialogTitle className="text-xl">{idea.title}</DialogTitle>
          {idea.description && (
            <DialogDescription>{idea.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Zielgruppe</h4>
              <p className="text-sm">{idea.targetAudience || "–"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Umsatzpotenzial</h4>
              <p className="text-sm">{idea.potentialRevenue || "–"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Aufwand</h4>
              <p className="text-sm">{idea.effortEstimate || "–"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Priorität</h4>
              <p className={cn("text-sm font-medium", priorityConfig.color)}>
                {priorityConfig.label}
              </p>
            </div>
          </div>

          {idea.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {idea.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notizen</h4>
                <p className="text-sm whitespace-pre-wrap">{idea.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
