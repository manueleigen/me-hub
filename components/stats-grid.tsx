import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCard {
  label: string;
  value: number | string;
  sub?: string;
  valueClassName?: string;
}

export function StatsGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", card.valueClassName)}>
              {card.value}
            </div>
            {card.sub && (
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
