"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, Clock, Euro, FolderKanban } from "lucide-react"
import type { ClientWithStats } from "@/types/kunden"
import { CLIENT_STATUS_CONFIG } from "@/types/kunden"
import { cn } from "@/lib/utils"

interface ClientListProps {
  clients: ClientWithStats[]
}

export function ClientList({ clients }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="size-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Keine Kunden gefunden.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map(client => {
        const statusConfig = CLIENT_STATUS_CONFIG[client.status]
        const initials = client.name
          .split(" ")
          .map(w => w[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()

        return (
          <Link key={client.id} href={`/kunden/${client.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-12 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      <Badge className={cn("text-white shrink-0 text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mb-3">
                      {client.contact} - {client.email}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>{client.totalHours.toFixed(0)}h</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Euro className="size-3.5" />
                        <span>{(client.totalRevenue / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FolderKanban className="size-3.5" />
                        <span>{client.projectCount} Proj.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
